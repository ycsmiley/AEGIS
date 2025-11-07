-- ============================================================================
-- Migration: Add AI Pricing Fields to Invoices
-- ============================================================================
-- This migration adds new fields to support the AI pricing agent functionality
-- ============================================================================

-- Add new columns for AI pricing and signature data
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS aegis_pricing_explanation TEXT,
ADD COLUMN IF NOT EXISTS aegis_repayment_amount DECIMAL(18, 2),
ADD COLUMN IF NOT EXISTS aegis_nonce BIGINT,
ADD COLUMN IF NOT EXISTS aegis_deadline BIGINT,
ADD COLUMN IF NOT EXISTS aegis_due_date BIGINT,
ADD COLUMN IF NOT EXISTS supplier_address TEXT,
ADD COLUMN IF NOT EXISTS buyer_address TEXT,
ADD COLUMN IF NOT EXISTS financing_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS repayment_tx_hash TEXT;

-- Add indexes for the new address fields
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_address ON invoices(supplier_address);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer_address ON invoices(buyer_address);
CREATE INDEX IF NOT EXISTS idx_invoices_financing_tx ON invoices(financing_tx_hash);

-- Update the constraint to include new pricing fields
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS valid_pricing;
ALTER TABLE invoices
ADD CONSTRAINT valid_pricing CHECK (
    (status IN ('APPROVED', 'FINANCED', 'PAID') AND aegis_payout_offer IS NOT NULL AND aegis_repayment_amount IS NOT NULL)
    OR (status IN ('PENDING', 'REJECTED'))
);

-- Add comment to explain new fields
COMMENT ON COLUMN invoices.aegis_pricing_explanation IS 'AI-generated explanation of the pricing calculation';
COMMENT ON COLUMN invoices.aegis_repayment_amount IS 'Total amount to be repaid (invoice amount)';
COMMENT ON COLUMN invoices.aegis_nonce IS 'Nonce used in EIP-712 signature';
COMMENT ON COLUMN invoices.aegis_deadline IS 'Unix timestamp when signature expires';
COMMENT ON COLUMN invoices.aegis_due_date IS 'Unix timestamp when repayment is due';
COMMENT ON COLUMN invoices.supplier_address IS 'Ethereum address of the supplier';
COMMENT ON COLUMN invoices.buyer_address IS 'Ethereum address of the buyer';
COMMENT ON COLUMN invoices.financing_tx_hash IS 'Transaction hash of the financing withdrawal';
COMMENT ON COLUMN invoices.repayment_tx_hash IS 'Transaction hash of the repayment';

-- Make supplier_address and buyer_address required for new invoices
-- (Existing rows can be NULL, but new rows must have these)
-- We don't enforce NOT NULL to avoid breaking existing data

-- Update schema version
INSERT INTO schema_version (version) VALUES (2) ON CONFLICT DO NOTHING;

-- ============================================================================
-- Optional: Migrate existing data
-- ============================================================================
-- If you have existing invoices that reference companies, you can migrate them:
/*
UPDATE invoices i
SET
    supplier_address = c.wallet_address
FROM companies c
WHERE i.supplier_id = c.id AND i.supplier_address IS NULL;

UPDATE invoices i
SET
    buyer_address = c.wallet_address
FROM companies c
WHERE i.buyer_id = c.id AND i.buyer_address IS NULL;
*/

-- ============================================================================
-- Update RLS policies for address-based access
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Suppliers can view their invoices" ON invoices;
DROP POLICY IF EXISTS "Buyers can view their invoices" ON invoices;

-- Create new policies that work with wallet addresses
CREATE POLICY "Suppliers can view their invoices" ON invoices
    FOR SELECT USING (
        supplier_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
        OR supplier_address IN (SELECT wallet_address FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Buyers can view their invoices" ON invoices
    FOR SELECT USING (
        buyer_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
        OR buyer_address IN (SELECT wallet_address FROM user_profiles WHERE id = auth.uid())
    );

-- Allow public read access for testing (remove in production)
CREATE POLICY "Public read for testing" ON invoices
    FOR SELECT USING (true);

CREATE POLICY "Public insert for testing" ON invoices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update for testing" ON invoices
    FOR UPDATE USING (true);

-- ============================================================================
-- Update views to include new fields
-- ============================================================================

CREATE OR REPLACE VIEW invoice_summary AS
SELECT
    i.id,
    i.invoice_number,
    i.amount,
    i.status,
    i.due_date,
    i.aegis_payout_offer,
    i.aegis_repayment_amount,
    i.aegis_discount_rate,
    i.aegis_risk_score,
    i.aegis_pricing_explanation,
    i.supplier_address,
    i.buyer_address,
    COALESCE(s.name, 'Direct') AS supplier_name,
    COALESCE(b.name, 'Direct') AS buyer_name,
    i.financing_tx_hash,
    i.repayment_tx_hash,
    i.created_at,
    i.updated_at
FROM invoices i
LEFT JOIN companies s ON i.supplier_id = s.id
LEFT JOIN companies b ON i.buyer_id = b.id;
