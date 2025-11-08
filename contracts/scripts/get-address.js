/**
 * Get wallet address from private key
 * Usage: npx hardhat run scripts/get-address.js
 */

const hre = require("hardhat");

async function main() {
  console.log("🔑 Wallet Address Tool\n");
  console.log("=".repeat(60));

  // Get private key from env
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.log("❌ Error: No private key found");
    console.log("\nPlease set one of these in your .env file:");
    console.log("  - SERVER_WALLET_PRIVATE_KEY (backend Aegis server wallet)");
    console.log("  - PRIVATE_KEY (contracts deployment wallet)");
    console.log("\nOr run with private key:");
    console.log("  PRIVATE_KEY=0x... npx hardhat run scripts/get-address.js");
    process.exit(1);
  }

  if (privateKey.length !== 66 || !privateKey.startsWith("0x")) {
    console.log("❌ Error: Invalid private key format");
    console.log("Expected: 0x followed by 64 hex characters");
    process.exit(1);
  }

  try {
    // Create wallet from private key
    const wallet = new hre.ethers.Wallet(privateKey);

    console.log("✅ Wallet Information:\n");
    console.log(`Address: ${wallet.address}`);
    console.log(`Public Key: ${wallet.publicKey}`);

    console.log("\n" + "=".repeat(60));
    console.log("📋 Configuration:\n");
    console.log("Add this to your contracts/.env:");
    console.log(`AEGIS_SERVER_WALLET=${wallet.address}`);
    console.log("\nAdd this to your backend/.env:");
    console.log(`AEGIS_SERVER_WALLET=${wallet.address}`);
    console.log(`SERVER_WALLET_PRIVATE_KEY=${privateKey}`);
    console.log("\n" + "=".repeat(60));

    // Check balance on Arc Testnet (if connected)
    try {
      const provider = new hre.ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network"
      );
      const balance = await provider.getBalance(wallet.address);
      console.log("\n💰 Arc Testnet Balance:");
      console.log(`   ${hre.ethers.formatEther(balance)} ARC`);

      if (balance === 0n) {
        console.log("\n⚠️  This wallet has no ARC tokens.");
        console.log("   Get test tokens from Arc Testnet Faucet.");
      }
    } catch (error) {
      console.log("\n⚠️  Could not check Arc Testnet balance");
      console.log(`   Error: ${error.message}`);
    }

  } catch (error) {
    console.log("❌ Error creating wallet from private key");
    console.log(`   ${error.message}`);
    process.exit(1);
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
