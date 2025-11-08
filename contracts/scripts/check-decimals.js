const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Arc Testnet native currency decimals...\n");

  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);

  console.log("📊 Test Results:");
  console.log("================");
  console.log("Signer Address:", signer.address);
  console.log("Raw Balance (wei):", balance.toString());
  console.log("");

  // Test different decimal interpretations
  console.log("💰 Balance Interpretations:");
  console.log("---------------------------");
  console.log("With 18 decimals (ETH standard):", ethers.formatUnits(balance, 18), "USDC");
  console.log("With 6 decimals (USDC ERC20):", ethers.formatUnits(balance, 6), "USDC");
  console.log("");

  // Test parsing
  console.log("🧪 Parsing Test (5 USDC):");
  console.log("---------------------------");
  const amount18 = ethers.parseUnits("5", 18);
  const amount6 = ethers.parseUnits("5", 6);

  console.log("parseUnits('5', 18):", amount18.toString(), "wei");
  console.log("parseUnits('5', 6):", amount6.toString(), "wei");
  console.log("");
  console.log("Ratio (18 decimals / 6 decimals):", (Number(amount18) / Number(amount6)).toLocaleString());
  console.log("");

  // Check which is correct based on actual balance
  if (balance > 0n) {
    const balance18 = Number(ethers.formatUnits(balance, 18));
    const balance6 = Number(ethers.formatUnits(balance, 6));

    console.log("✅ Recommendation:");
    console.log("---------------------------");
    if (balance18 < 1000000000) {
      console.log("Arc Testnet appears to use **18 decimals** (standard ETH/native token format)");
      console.log(`Your balance: ${balance18.toLocaleString()} USDC`);
    } else {
      console.log("Arc Testnet appears to use **6 decimals** (USDC ERC20 format)");
      console.log(`Your balance: ${balance6.toLocaleString()} USDC`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
