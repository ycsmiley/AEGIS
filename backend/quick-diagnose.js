/**
 * Quick diagnostic - Check if backend wallet matches contract
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function quickCheck() {
  console.log('\n🔍 QUICK DIAGNOSTIC CHECK\n');

  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  const chainId = process.env.ARC_CHAIN_ID;
  const contractAddress = process.env.ARC_CONTRACT_ADDRESS;

  if (!privateKey) {
    console.error('❌ SERVER_WALLET_PRIVATE_KEY not set in .env');
    console.log('\nPlease create backend/.env with:');
    console.log('SERVER_WALLET_PRIVATE_KEY=0x...');
    console.log('ARC_CHAIN_ID=5042002');
    console.log('ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C');
    return;
  }

  // Derive wallet address from private key
  const wallet = new ethers.Wallet(privateKey);

  console.log('✅ Configuration:');
  console.log('   Chain ID:', chainId || '❌ NOT SET (will default to 421614 - WRONG!)');
  console.log('   Contract Address:', contractAddress || '❌ NOT SET');
  console.log('   Backend Wallet:', wallet.address);
  console.log('\n📋 Expected Configuration:');
  console.log('   Chain ID: 5042002');
  console.log('   Contract Address: 0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C');
  console.log('   Contract expects wallet: 0x782c3446aedabdd934e97ee255d5c5c62fe289d3');

  console.log('\n🎯 Verification:');

  // Check ChainId
  if (chainId === '5042002') {
    console.log('   ✓ Chain ID is correct');
  } else {
    console.log('   ❌ Chain ID is WRONG! Set ARC_CHAIN_ID=5042002 in .env');
  }

  // Check contract address
  if (contractAddress === '0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C') {
    console.log('   ✓ Contract address is correct');
  } else {
    console.log('   ❌ Contract address is WRONG!');
  }

  // Check wallet address
  if (wallet.address.toLowerCase() === '0x782c3446aedabdd934e97ee255d5c5c62fe289d3'.toLowerCase()) {
    console.log('   ✓ Wallet address MATCHES contract expectation!');
    console.log('\n✅ All configuration looks good!');
    console.log('   If transactions still fail, the issue is elsewhere.\n');
  } else {
    console.log('   ❌ Wallet address MISMATCH!');
    console.log('      Your wallet:', wallet.address);
    console.log('      Contract expects: 0x782c3446aedabdd934e97ee255d5c5c62fe289d3');
    console.log('\n🔧 FIX: You need to use the private key for 0x782c3446aedabdd934e97ee255d5c5c62fe289d3');
    console.log('   OR redeploy the contract with your current wallet address.\n');
  }
}

quickCheck().catch(console.error);
