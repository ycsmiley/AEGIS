/**
 * Check deployment readiness
 * Usage: npx hardhat run scripts/check-deployment.js --network arcTestnet
 */

const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking deployment readiness...\n");
  console.log("=".repeat(60));

  let allChecksPass = true;

  // 1. Check deployer account
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("✅ Deployer Account");
    console.log(`   Address: ${deployer.address}`);

    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceFormatted = hre.ethers.formatEther(balance);
    console.log(`   Balance: ${balanceFormatted} ARC`);

    if (balance === 0n) {
      console.log("   ⚠️  WARNING: Zero balance! You need ARC tokens for gas.");
      allChecksPass = false;
    } else if (balance < hre.ethers.parseEther("0.01")) {
      console.log("   ⚠️  WARNING: Low balance. Recommend at least 0.01 ARC.");
    }
  } catch (error) {
    console.log("❌ Deployer Account");
    console.log(`   Error: ${error.message}`);
    allChecksPass = false;
  }

  console.log("");

  // 2. Check Aegis Server Wallet
  const aegisWallet = process.env.AEGIS_SERVER_WALLET;

  if (!aegisWallet || aegisWallet === "0x..." || aegisWallet.length !== 42) {
    console.log("❌ Aegis Server Wallet");
    console.log("   Error: AEGIS_SERVER_WALLET not configured in .env");
    console.log("   Please set: AEGIS_SERVER_WALLET=0xYourAddress");
    allChecksPass = false;
  } else {
    console.log("✅ Aegis Server Wallet");
    console.log(`   Address: ${aegisWallet}`);

    // Validate address format
    if (!hre.ethers.isAddress(aegisWallet)) {
      console.log("   ⚠️  WARNING: Invalid Ethereum address format!");
      allChecksPass = false;
    }
  }

  console.log("");

  // 3. Check network configuration
  try {
    const network = await hre.ethers.provider.getNetwork();
    console.log("✅ Network Configuration");
    console.log(`   Network: ${hre.network.name}`);
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   RPC URL: ${hre.network.config.url}`);

    if (network.chainId !== 5042002n) {
      console.log("   ⚠️  WARNING: Chain ID is not Arc Testnet (expected: 5042002)");
    }
  } catch (error) {
    console.log("❌ Network Configuration");
    console.log(`   Error: ${error.message}`);
    console.log("   Check your RPC URL and network settings");
    allChecksPass = false;
  }

  console.log("");

  // 4. Check private key configuration
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.log("❌ Private Key");
    console.log("   Error: PRIVATE_KEY not set in .env");
    allChecksPass = false;
  } else if (privateKey.length !== 66 || !privateKey.startsWith("0x")) {
    console.log("❌ Private Key");
    console.log("   Error: Invalid private key format");
    console.log("   Expected: 0x followed by 64 hex characters");
    allChecksPass = false;
  } else {
    console.log("✅ Private Key");
    console.log("   Format: Valid (64 hex chars)");
  }

  console.log("");

  // 5. Check initial liquidity (optional)
  const initialLiquidity = process.env.INITIAL_LIQUIDITY || "0";
  console.log("ℹ️  Initial Liquidity (Optional)");
  console.log(`   Amount: ${hre.ethers.formatUnits(initialLiquidity, 6)} USDC`);

  console.log("");
  console.log("=".repeat(60));

  // Summary
  if (allChecksPass) {
    console.log("✅ ALL CHECKS PASSED");
    console.log("\nYou are ready to deploy! Run:");
    console.log("  npx hardhat run scripts/deploy-arc.js --network arcTestnet");
  } else {
    console.log("❌ SOME CHECKS FAILED");
    console.log("\nPlease fix the issues above before deploying.");
    console.log("Refer to DEPLOYMENT_GUIDE.md for detailed instructions.");
    process.exit(1);
  }

  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Check failed with error:");
    console.error(error);
    process.exit(1);
  });
