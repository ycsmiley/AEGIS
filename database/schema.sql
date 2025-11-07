-- ============================================================================
-- AEGIS FINANCE - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Arc-native supply chain finance platform database schema
-- Off-chain data storage for invoice management and user profiles
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('BUYER', 'SUPPLIER')),
    wallet_address TEXT UNIQUE,
    credit_rating INTEGER DEFAULT 100 CHECK (credit_rating >= 0 AND credit_rating <= 100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_wallet ON companies(wallet_address);
CREATE INDEX idx_companies_type ON companies(type);

-- ============================================================================
-- USER PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('BUYER', 'SUPPLIER', 'ADMIN', 'LP')),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    wallet_address TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USDC',
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'FINANCED', 'REJECTED', 'PAID')),
    
    -- Aegis AI pricing data
    aegis_payout_offer DECIMAL(18, 2),
    aegis_discount_rate DECIMAL(5, 4),
    aegis_risk_score DECIMAL(5, 2),
    aegis_signature TEXT,
    
    -- Blockchain data
    blockchain_tx_hash TEXT,
    blockchain_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_pricing CHECK (
        (status IN ('APPROVED', 'FINANCED', 'PAID') AND aegis_payout_offer IS NOT NULL)
        OR (status IN ('PENDING', 'REJECTED') AND aegis_payout_offer IS NULL)
    )
);

CREATE INDEX idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX idx_invoices_buyer ON invoices(buyer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_tx_hash ON invoices(blockchain_tx_hash);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('FINANCING', 'REPAYMENT', 'DEPOSIT', 'WITHDRAWAL')),
    amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    tx_hash TEXT UNIQUE NOT NULL,
    block_number INTEGER,
    gas_used DECIMAL(18, 6),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================================================
-- POOL STATUS TABLE (singleton for monitoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pool_status (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton pattern
    total_liquidity DECIMAL(18, 2) DEFAULT 0,
    available_liquidity DECIMAL(18, 2) DEFAULT 0,
    locked_amount DECIMAL(18, 2) DEFAULT 0,
    total_financed DECIMAL(18, 2) DEFAULT 0,
    total_repaid DECIMAL(18, 2) DEFAULT 0,
    default_amount DECIMAL(18, 2) DEFAULT 0,
    default_rate DECIMAL(5, 4) DEFAULT 0,
    total_lps INTEGER DEFAULT 0,
    total_invoices INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize singleton row
INSERT INTO pool_status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log invoice status changes
CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_logs (
            action,
            resource_type,
            resource_id,
            old_values,
            new_values
        ) VALUES (
            'status_change',
            'invoice',
            NEW.id,
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_invoice_status AFTER UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION log_invoice_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view companies they interact with" ON companies
    FOR SELECT USING (
        id IN (
            SELECT DISTINCT supplier_id FROM invoices 
            WHERE buyer_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
            UNION
            SELECT DISTINCT buyer_id FROM invoices 
            WHERE supplier_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
        )
    );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Invoices policies
CREATE POLICY "Suppliers can view their invoices" ON invoices
    FOR SELECT USING (
        supplier_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Buyers can view their invoices" ON invoices
    FOR SELECT USING (
        buyer_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Suppliers can create invoices" ON invoices
    FOR INSERT WITH CHECK (
        supplier_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role = 'SUPPLIER')
    );

CREATE POLICY "Suppliers can update their pending invoices" ON invoices
    FOR UPDATE USING (
        supplier_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role = 'SUPPLIER')
        AND status = 'PENDING'
    );

-- Transactions policies
CREATE POLICY "Users can view related transactions" ON transactions
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE
                supplier_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
                OR buyer_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
        )
    );

-- Pool status is public read
CREATE POLICY "Anyone can view pool status" ON pool_status
    FOR SELECT USING (true);

-- Audit logs policies (read-only for admins)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Invoice summary view
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.amount,
    i.status,
    i.due_date,
    i.aegis_payout_offer,
    i.aegis_discount_rate,
    s.name AS supplier_name,
    s.wallet_address AS supplier_wallet,
    b.name AS buyer_name,
    b.wallet_address AS buyer_wallet,
    i.created_at,
    i.updated_at
FROM invoices i
JOIN companies s ON i.supplier_id = s.id
JOIN companies b ON i.buyer_id = b.id;

-- Pool analytics view
CREATE OR REPLACE VIEW pool_analytics AS
SELECT 
    (SELECT COUNT(*) FROM invoices WHERE status = 'FINANCED') AS total_financed_count,
    (SELECT SUM(aegis_payout_offer) FROM invoices WHERE status = 'FINANCED') AS total_financed_amount,
    (SELECT COUNT(*) FROM invoices WHERE status = 'PAID') AS total_repaid_count,
    (SELECT COUNT(DISTINCT supplier_id) FROM invoices) AS active_suppliers,
    (SELECT COUNT(DISTINCT buyer_id) FROM invoices) AS active_buyers,
    (SELECT AVG(aegis_discount_rate) FROM invoices WHERE aegis_discount_rate IS NOT NULL) AS avg_discount_rate;

-- ============================================================================
-- SEED DATA (optional, for testing)
-- ============================================================================

-- Insert test companies
INSERT INTO companies (name, type, credit_rating) VALUES
    ('US-Buyer Inc.', 'BUYER', 95),
    ('Viet-Supplier Ltd.', 'SUPPLIER', 85)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS FOR APPLICATION
-- ============================================================================

-- Function to get invoice with full details
CREATE OR REPLACE FUNCTION get_invoice_details(invoice_id UUID)
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    amount DECIMAL,
    status TEXT,
    supplier_name TEXT,
    buyer_name TEXT,
    aegis_payout_offer DECIMAL,
    aegis_discount_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.invoice_number,
        i.amount,
        i.status,
        s.name AS supplier_name,
        b.name AS buyer_name,
        i.aegis_payout_offer,
        i.aegis_discount_rate
    FROM invoices i
    JOIN companies s ON i.supplier_id = s.id
    JOIN companies b ON i.buyer_id = b.id
    WHERE i.id = invoice_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA VERSION
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_version (version) VALUES (1);

