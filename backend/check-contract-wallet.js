/**
 * Check the aegisServerWallet configured in the deployed contract
 * Usage: node check-contract-wallet.js <CONTRACT_ADDRESS>
 */

const { ethers } = require('ethers');

async function checkContract() {
  const contractAddress = process.argv[2];

  if (!contractAddress) {
    console.error('Usage: node check-contract-wallet.js <CONTRACT_ADDRESS>');
    console.error('Example: node check-contract-wallet.js 0x80809...cD14C');
    process.exit(1);
  }

  console.log('='.repeat(70));
  console.log('CHECKING CONTRACT CONFIGURATION');
  console.log('='.repeat(70));
  console.log('\nContract Address:', contractAddress);

  try {
    const rpcUrl = 'https://rpc.testnet.arc.network';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const contractABI = [
      'function aegisServerWallet() view returns (address)',
      'function getPoolStatus() view returns (uint256 total, uint256 available, uint256 utilized, uint256 financed)',
      'function isInvoiceFinanced(bytes32 invoiceId) view returns (bool)',
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    console.log('\nFetching contract configuration...\n');

    // Get aegisServerWallet
    const aegisWallet = await contract.aegisServerWallet();
    console.log('✓ Contract aegisServerWallet:', aegisWallet);

    // Get pool status
    const poolStatus = await contract.getPoolStatus();
    console.log('\n📊 Pool Status:');
    console.log('  Total Pool Size:', ethers.formatUnits(poolStatus.total, 18), 'USDC');
    console.log('  Available Liquidity:', ethers.formatUnits(poolStatus.available, 18), 'USDC');
    console.log('  Utilized:', ethers.formatUnits(poolStatus.utilized, 18), 'USDC');
    console.log('  Total Financed:', ethers.formatUnits(poolStatus.financed, 18), 'USDC');

    console.log('\n' + '='.repeat(70));
    console.log('IMPORTANT:');
    console.log('Your backend SERVER_WALLET_PRIVATE_KEY must derive to:', aegisWallet);
    console.log('Otherwise, all transactions will fail signature verification!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nMake sure:');
    console.error('1. The contract address is correct');
    console.error('2. The contract is deployed on Arc Testnet');
    console.error('3. Your internet connection is working');
    process.exit(1);
  }
}

checkContract().catch(console.error);
