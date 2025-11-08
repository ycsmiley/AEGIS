/**
 * Check if an invoice is already financed on-chain
 * Usage: node check-invoice-status.js <INVOICE_NUMBER>
 */

const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkInvoiceStatus() {
  const invoiceNumber = process.argv[2];

  if (!invoiceNumber) {
    console.error('Usage: node check-invoice-status.js <INVOICE_NUMBER>');
    console.error('Example: node check-invoice-status.js INV-421834');
    process.exit(1);
  }

  console.log('\n🔍 CHECKING INVOICE STATUS ON-CHAIN\n');
  console.log('Invoice Number:', invoiceNumber);

  // Connect to contract
  const rpcUrl = process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network';
  const contractAddress = process.env.ARC_CONTRACT_ADDRESS || '0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C';

  console.log('Contract Address:', contractAddress);
  console.log('RPC URL:', rpcUrl);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const contractABI = [
      'function usedInvoices(bytes32) view returns (bool)',
      'function financingRecords(bytes32) view returns (bytes32 invoiceId, address supplier, uint256 payoutAmount, uint256 repaymentAmount, uint256 dueDate, uint256 timestamp, bool repaid)',
      'function getPoolStatus() view returns (uint256 total, uint256 available, uint256 utilized, uint256 financed)',
      'function aegisServerWallet() view returns (address)',
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Calculate invoice hash (same way as frontend)
    const invoiceHash = ethers.id(invoiceNumber);
    console.log('\nInvoice Hash:', invoiceHash);

    // Check if invoice is already used
    console.log('\n📋 Contract State:');
    const isUsed = await contract.usedInvoices(invoiceHash);
    console.log('  Is invoice already financed?', isUsed ? '❌ YES - ALREADY USED!' : '✓ No');

    if (isUsed) {
      // Get financing record
      const record = await contract.financingRecords(invoiceHash);
      console.log('\n💰 Financing Record:');
      console.log('  Supplier:', record.supplier);
      console.log('  Payout Amount:', ethers.formatUnits(record.payoutAmount, 18), 'USDC');
      console.log('  Repayment Amount:', ethers.formatUnits(record.repaymentAmount, 18), 'USDC');
      console.log('  Due Date:', new Date(Number(record.dueDate) * 1000).toLocaleString());
      console.log('  Financed At:', new Date(Number(record.timestamp) * 1000).toLocaleString());
      console.log('  Repaid?', record.repaid ? 'Yes' : 'No');
    }

    // Check pool status
    const poolStatus = await contract.getPoolStatus();
    console.log('\n💧 Pool Liquidity:');
    console.log('  Total Pool Size:', ethers.formatUnits(poolStatus.total, 18), 'USDC');
    console.log('  Available Liquidity:', ethers.formatUnits(poolStatus.available, 18), 'USDC');
    console.log('  Utilized:', ethers.formatUnits(poolStatus.utilized, 18), 'USDC');

    // Check aegis wallet
    const aegisWallet = await contract.aegisServerWallet();
    console.log('\n🔐 Contract Configuration:');
    console.log('  Aegis Server Wallet:', aegisWallet);

    // Check database
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', invoiceNumber)
        .single();

      if (!error && invoice) {
        console.log('\n📊 Database Status:');
        console.log('  Status:', invoice.status);
        console.log('  Has Signature?', invoice.aegis_signature ? 'Yes' : 'No');
        console.log('  Financing TX Hash:', invoice.financing_tx_hash || 'None');

        if (invoice.financing_tx_hash) {
          console.log('\n🔗 View on Explorer:');
          console.log(`  https://explorer.testnet.arc.network/tx/${invoice.financing_tx_hash}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));

    if (isUsed) {
      console.log('❌ PROBLEM IDENTIFIED:');
      console.log('This invoice has ALREADY been financed on-chain!');
      console.log('The contract prevents double-spending by rejecting used invoices.');
      console.log('\nThe database status might be out of sync with blockchain state.');
    } else {
      console.log('✓ Invoice has NOT been financed yet.');
      console.log('The rejection is due to another reason.');
      console.log('\nPossible causes:');
      console.log('1. Signature verification failed (wrong signer)');
      console.log('2. Signature expired (deadline passed)');
      console.log('3. Insufficient pool liquidity');
      console.log('4. Other contract validation failed');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nMake sure:');
    console.error('1. ARC_RPC_URL is set correctly in .env');
    console.error('2. ARC_CONTRACT_ADDRESS is set correctly');
    console.error('3. Your internet connection is working\n');
  }
}

checkInvoiceStatus().catch(console.error);
