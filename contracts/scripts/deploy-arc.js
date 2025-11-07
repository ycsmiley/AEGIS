const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ArcPool to Arc Testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check deployer balance (USDC on Arc)
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatUnits(balance, 6), "USDC\n");

  // Get Aegis server wallet address
  const aegisServerWallet = process.env.AEGIS_SERVER_WALLET;
  if (!aegisServerWallet) {
    throw new Error("AEGIS_SERVER_WALLET not set in .env");
  }
  console.log("🤖 Aegis Server Wallet:", aegisServerWallet);

  // Optional: Initial liquidity (in USDC with 6 decimals)
  const initialLiquidity = process.env.INITIAL_LIQUIDITY || "0";
  console.log("💧 Initial Liquidity:", hre.ethers.formatUnits(initialLiquidity, 6), "USDC\n");

  // Deploy ArcPool
  console.log("⏳ Deploying ArcPool contract...");
  const ArcPool = await hre.ethers.getContractFactory("ArcPool");
  const arcPool = await ArcPool.deploy(aegisServerWallet, {
    value: initialLiquidity,
  });

  await arcPool.waitForDeployment();
  const arcPoolAddress = await arcPool.getAddress();

  console.log("✅ ArcPool deployed to:", arcPoolAddress);

  // Verify pool status
  const poolStatus = await arcPool.getPoolStatus();
  console.log("\n📊 Initial Pool Status:");
  console.log("   Total Pool Size:", hre.ethers.formatUnits(poolStatus[0], 6), "USDC");
  console.log("   Available Liquidity:", hre.ethers.formatUnits(poolStatus[1], 6), "USDC");
  console.log("   Utilized:", hre.ethers.formatUnits(poolStatus[2], 6), "USDC");
  console.log("   Total Financed:", hre.ethers.formatUnits(poolStatus[3], 6), "USDC");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      ArcPool: arcPoolAddress,
    },
    deployer: deployer.address,
    aegisServerWallet: aegisServerWallet,
    initialLiquidity: hre.ethers.formatUnits(initialLiquidity, 6),
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to file
  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  // Also save as latest
  const latestPath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", filename);
  console.log("\n🎉 Deployment complete!\n");

  // Instructions for next steps
  console.log("📋 Next Steps:");
  console.log("1. Update frontend .env.local:");
  console.log(`   NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=${arcPoolAddress}`);
  console.log("\n2. Update backend .env:");
  console.log(`   ARC_CONTRACT_ADDRESS=${arcPoolAddress}`);
  console.log("\n3. Verify contract (optional):");
  console.log(`   npx hardhat verify --network arcTestnet ${arcPoolAddress} "${aegisServerWallet}"`);

  // Wait for verification if on testnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await arcPool.deploymentTransaction().wait(5);
    console.log("✅ Block confirmations complete");

    try {
      console.log("\n🔍 Verifying contract on block explorer...");
      await hre.run("verify:verify", {
        address: arcPoolAddress,
        constructorArguments: [aegisServerWallet],
      });
      console.log("✅ Contract verified successfully");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later with:");
      console.log(`   npx hardhat verify --network ${hre.network.name} ${arcPoolAddress} "${aegisServerWallet}"`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

