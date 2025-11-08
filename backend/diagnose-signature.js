/**
 * Diagnostic script to check signature configuration
 * Run with: node diagnose-signature.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function diagnose() {
  console.log('='.repeat(60));
  console.log('AEGIS SIGNATURE DIAGNOSTIC');
  console.log('='.repeat(60));

  // 1. Check environment variables
  console.log('\n1. Environment Variables:');
  console.log('-'.repeat(60));

  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  const aegisWalletAddress = process.env.AEGIS_SERVER_WALLET;
  const contractAddress = process.env.ARC_CONTRACT_ADDRESS;
  const chainId = process.env.ARC_CHAIN_ID || 421614;

  console.log('CONTRACT_ADDRESS:', contractAddress || '❌ NOT SET');
  console.log('CHAIN_ID:', chainId);
  console.log('AEGIS_SERVER_WALLET:', aegisWalletAddress || '❌ NOT SET');
  console.log('SERVER_WALLET_PRIVATE_KEY:', privateKey ? '✓ SET (length: ' + privateKey.length + ')' : '❌ NOT SET');

  if (!privateKey) {
    console.error('\n❌ ERROR: SERVER_WALLET_PRIVATE_KEY is not set in backend/.env');
    process.exit(1);
  }

  // 2. Derive address from private key
  console.log('\n2. Wallet Address Derivation:');
  console.log('-'.repeat(60));

  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey);
    console.log('Derived address from private key:', wallet.address);
  } catch (error) {
    console.error('❌ ERROR: Invalid private key format:', error.message);
    process.exit(1);
  }

  // 3. Compare addresses
  console.log('\n3. Address Verification:');
  console.log('-'.repeat(60));

  if (aegisWalletAddress) {
    const match = wallet.address.toLowerCase() === aegisWalletAddress.toLowerCase();
    console.log('AEGIS_SERVER_WALLET:', aegisWalletAddress);
    console.log('Derived from key:   ', wallet.address);
    console.log('Match:', match ? '✓ MATCH' : '❌ MISMATCH');

    if (!match) {
      console.error('\n❌ ERROR: AEGIS_SERVER_WALLET does not match the private key!');
      console.error('Fix: Update AEGIS_SERVER_WALLET to:', wallet.address);
    }
  } else {
    console.warn('⚠️  WARNING: AEGIS_SERVER_WALLET not set');
    console.log('Recommended: Add to backend/.env:');
    console.log(`AEGIS_SERVER_WALLET=${wallet.address}`);
  }

  // 4. Check contract's aegisServerWallet
  console.log('\n4. Smart Contract Configuration:');
  console.log('-'.repeat(60));

  if (!contractAddress) {
    console.warn('⚠️  WARNING: ARC_CONTRACT_ADDRESS not set, skipping contract check');
  } else {
    try {
      const rpcUrl = process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network';
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const contractABI = [
        'function aegisServerWallet() view returns (address)',
        'function getPoolStatus() view returns (uint256 total, uint256 available, uint256 utilized, uint256 financed)'
      ];

      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      console.log('Fetching from contract:', contractAddress);
      const contractAegisWallet = await contract.aegisServerWallet();
      const poolStatus = await contract.getPoolStatus();

      console.log('Contract aegisServerWallet:', contractAegisWallet);
      console.log('Derived from key:         ', wallet.address);

      const contractMatch = wallet.address.toLowerCase() === contractAegisWallet.toLowerCase();
      console.log('Match:', contractMatch ? '✓ MATCH' : '❌ MISMATCH');

      console.log('\nPool Status:');
      console.log('  Total Pool Size:', ethers.formatUnits(poolStatus.total, 18), 'USDC');
      console.log('  Available Liquidity:', ethers.formatUnits(poolStatus.available, 18), 'USDC');
      console.log('  Utilized:', ethers.formatUnits(poolStatus.utilized, 18), 'USDC');
      console.log('  Total Financed:', ethers.formatUnits(poolStatus.financed, 18), 'USDC');

      if (!contractMatch) {
        console.error('\n❌ CRITICAL ERROR: Contract aegisServerWallet does not match your private key!');
        console.error('This is why transactions are failing.');
        console.error('\nOptions to fix:');
        console.error('1. Update backend/.env to use the correct private key for:', contractAegisWallet);
        console.error('2. Or redeploy the contract with the current wallet:', wallet.address);
      }
    } catch (error) {
      console.error('❌ ERROR querying contract:', error.message);
      console.log('Make sure ARC_RPC_URL is set correctly');
    }
  }

  // 5. Test signature generation
  console.log('\n5. Test Signature Generation:');
  console.log('-'.repeat(60));

  const testData = {
    invoiceId: 'TEST-001',
    supplier: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    payoutAmount: 0.98,
    repaymentAmount: 1.0,
    daysUntilDue: 1,
  };

  const nonce = Date.now();
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const dueDate = Math.floor(Date.now() / 1000) + (testData.daysUntilDue * 24 * 60 * 60);

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
    invoiceId: ethers.id(testData.invoiceId),
    supplier: testData.supplier,
    payoutAmount: ethers.parseUnits(testData.payoutAmount.toString(), 18),
    repaymentAmount: ethers.parseUnits(testData.repaymentAmount.toString(), 18),
    dueDate: dueDate,
    nonce: nonce,
    deadline: deadline,
  };

  try {
    const signature = await wallet.signTypedData(domain, types, values);
    console.log('✓ Successfully generated test signature');
    console.log('Signature:', signature.substring(0, 20) + '...');

    // Verify the signature
    const recoveredAddress = ethers.verifyTypedData(domain, types, values, signature);
    console.log('Recovered address:', recoveredAddress);
    console.log('Match with wallet:', recoveredAddress.toLowerCase() === wallet.address.toLowerCase() ? '✓ MATCH' : '❌ MISMATCH');
  } catch (error) {
    console.error('❌ ERROR generating signature:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(60));
}

diagnose().catch(console.error);
