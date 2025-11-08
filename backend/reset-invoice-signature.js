/**
 * Reset signature for a specific invoice
 * Usage: node reset-invoice-signature.js <INVOICE_NUMBER>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function resetSignature() {
  const invoiceNumber = process.argv[2];

  if (!invoiceNumber) {
    console.error('Usage: node reset-invoice-signature.js <INVOICE_NUMBER>');
    console.error('Example: node reset-invoice-signature.js INV-421834');
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n🔄 Resetting signature for invoice:', invoiceNumber);

  // Clear signature
  const { error } = await supabase
    .from('invoices')
    .update({
      aegis_signature: null,
      aegis_nonce: null,
      aegis_deadline: null,
      aegis_due_date: null,
    })
    .eq('invoice_number', invoiceNumber);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log('✅ Signature cleared!');
  console.log('\nNext steps:');
  console.log('1. Make sure backend .env has correct SERVER_WALLET_PRIVATE_KEY');
  console.log('2. Restart backend: npm run start:dev');
  console.log('3. Click "Accept Offer" - it will request fresh signature\n');
}

resetSignature().catch(console.error);
