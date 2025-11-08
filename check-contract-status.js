// Check if invoice is actually financed on contract
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load ABI from deployment file
const deploymentPath = path.join(__dirname, 'contracts/deployments/arcTestnet-latest.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
const ArcPoolABI = deployment.abi;

async function checkInvoiceStatus(invoiceId) {
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
  const contractAddress = '0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C';
  const contract = new ethers.Contract(contractAddress, ArcPoolABI.abi, provider);

  // Calculate invoice hash (same as frontend)
  const invoiceHash = ethers.id(invoiceId);
  console.log('Invoice ID:', invoiceId);
  console.log('Invoice Hash:', invoiceHash);

  try {
    // Check if invoice is recorded in contract
    const isUsed = await contract.usedInvoices(invoiceHash);
    console.log('Is financed on contract:', isUsed);

    if (isUsed) {
      // Get financing record
      const record = await contract.financingRecords(invoiceHash);
      console.log('\nFinancing Record:');
      console.log('  Supplier:', record.supplier);
      console.log('  Payout:', ethers.formatUnits(record.payoutAmount, 18), 'USDC');
      console.log('  Repayment:', ethers.formatUnits(record.repaymentAmount, 18), 'USDC');
      console.log('  Due Date:', new Date(Number(record.dueDate) * 1000).toLocaleString());
      console.log('  Repaid:', record.repaid);
    } else {
      console.log('\n❌ Invoice NOT financed on contract!');
      console.log('Action needed: Supplier must call withdrawFinancing()');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage: node check-contract-status.js <invoice-id>
const invoiceId = process.argv[2];
if (!invoiceId) {
  console.error('Usage: node check-contract-status.js <invoice-id>');
  process.exit(1);
}

checkInvoiceStatus(invoiceId);
