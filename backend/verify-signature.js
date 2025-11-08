/**
 * Verify that a signature in database can be recovered to correct address
 * Usage: node verify-signature.js <INVOICE_NUMBER>
 */

const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifySignature() {
  const invoiceNumber = process.argv[2];

  if (!invoiceNumber) {
    console.error('Usage: node verify-signature.js <INVOICE_NUMBER>');
    console.error('Example: node verify-signature.js INV-421834');
    process.exit(1);
  }

  console.log('\n🔐 VERIFYING SIGNATURE\n');
  console.log('Invoice Number:', invoiceNumber);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const contractAddress = process.env.ARC_CONTRACT_ADDRESS || '0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C';
  const chainId = process.env.ARC_CHAIN_ID || '421614';

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoiceNumber)
    .single();

  if (error || !invoice) {
    console.error('❌ Invoice not found:', error?.message);
    process.exit(1);
  }

  console.log('\n📋 Invoice Data:');
  console.log('  ID:', invoice.id);
  console.log('  Status:', invoice.status);
  console.log('  Supplier:', invoice.supplier_address);
  console.log('  Payout:', invoice.aegis_payout_offer, 'USDC');
  console.log('  Repayment:', invoice.aegis_repayment_amount, 'USDC');

  if (!invoice.aegis_signature) {
    console.log('\n❌ No signature found in database!');
    console.log('Invoice needs to be approved first.');
    process.exit(1);
  }

  console.log('\n🔍 Signature Data:');
  console.log('  Signature:', invoice.aegis_signature.substring(0, 20) + '...');
  console.log('  Nonce:', invoice.aegis_nonce);
  console.log('  Deadline:', invoice.aegis_deadline, '(' + new Date(Number(invoice.aegis_deadline) * 1000).toLocaleString() + ')');
  console.log('  Due Date:', invoice.aegis_due_date, '(' + new Date(Number(invoice.aegis_due_date) * 1000).toLocaleString() + ')');

  // Check if deadline expired
  const now = Math.floor(Date.now() / 1000);
  const isExpired = Number(invoice.aegis_deadline) < now;
  console.log('\n⏰ Deadline Check:');
  console.log('  Current Time:', now, '(' + new Date(now * 1000).toLocaleString() + ')');
  console.log('  Is Expired?', isExpired ? '❌ YES - EXPIRED!' : '✓ No');

  // Reconstruct EIP-712 signature
  console.log('\n🔧 Reconstructing EIP-712 Data:');
  console.log('  Chain ID:', chainId);
  console.log('  Contract:', contractAddress);

  const domain = {
    name: 'ArcPool',
    version: '1',
    chainId: Number(chainId),
    verifyingContract: contractAddress,
  };

  const types = {
    FinancingRequest: [
      { name: 'invoiceId', type: 'bytes32' },
      { name: 'supplier', type: 'address' },
      { name: 'payoutAmount', type: 'uint256' },
      { name: 'repaymentAmount', type: 'uint256' },
      { name: 'dueDate', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const values = {
    invoiceId: ethers.id(invoice.invoice_number),
    supplier: invoice.supplier_address,
    payoutAmount: ethers.parseUnits(invoice.aegis_payout_offer.toString(), 18),
    repaymentAmount: ethers.parseUnits(invoice.aegis_repayment_amount.toString(), 18),
    dueDate: BigInt(invoice.aegis_due_date),
    nonce: BigInt(invoice.aegis_nonce),
    deadline: BigInt(invoice.aegis_deadline),
  };

  console.log('\n📝 Signed Message Values:');
  console.log('  invoiceId:', values.invoiceId);
  console.log('  supplier:', values.supplier);
  console.log('  payoutAmount:', values.payoutAmount.toString(), 'wei');
  console.log('  repaymentAmount:', values.repaymentAmount.toString(), 'wei');
  console.log('  dueDate:', values.dueDate.toString());
  console.log('  nonce:', values.nonce.toString());
  console.log('  deadline:', values.deadline.toString());

  // Recover signer from signature
  try {
    const recoveredAddress = ethers.verifyTypedData(
      domain,
      types,
      values,
      invoice.aegis_signature
    );

    console.log('\n✅ Signature Recovery Successful!');
    console.log('\n🔑 Recovered Signer Address:');
    console.log('  ', recoveredAddress);

    console.log('\n🎯 Expected Address (from contract):');
    console.log('   0x782c3446aeDabdD934e97ee255D5C5c62fE289D3');

    const matches = recoveredAddress.toLowerCase() === '0x782c3446aeDabdD934e97ee255D5C5c62fE289D3'.toLowerCase();

    console.log('\n' + '='.repeat(60));
    if (matches) {
      console.log('✅ SIGNATURE IS VALID!');
      console.log('The signature was created by the correct wallet.');
      if (isExpired) {
        console.log('\n❌ BUT DEADLINE HAS EXPIRED!');
        console.log('The signature is valid but too old.');
        console.log('The contract will reject it because block.timestamp > deadline.');
        console.log('\nSOLUTION: Get buyer to re-approve the invoice for fresh signature.');
      } else {
        console.log('\nSignature is valid and not expired.');
        console.log('The contract should accept this transaction.');
        console.log('\nIf transaction still fails, check:');
        console.log('1. Gas limit is sufficient');
        console.log('2. Wallet has enough native USDC for gas');
        console.log('3. Contract has no other validation issues');
      }
    } else {
      console.log('❌ SIGNATURE MISMATCH!');
      console.log('\nThe signature was NOT created by the contract\'s aegisServerWallet.');
      console.log('This is why the transaction fails!');
      console.log('\nPossible causes:');
      console.log('1. Backend used wrong private key when signing');
      console.log('2. Backend used wrong ChainId (was it ' + chainId + '?)');
      console.log('3. Signature was created before backend configuration was fixed');
      console.log('\nSOLUTION:');
      console.log('1. Check backend .env has correct SERVER_WALLET_PRIVATE_KEY');
      console.log('2. Check ARC_CHAIN_ID=5042002 in backend .env');
      console.log('3. Get buyer to re-approve invoice to generate fresh signature');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Failed to recover signature:', error.message);
    console.log('\nThis means the signature is invalid or parameters are wrong.\n');
  }
}

verifySignature().catch(console.error);
