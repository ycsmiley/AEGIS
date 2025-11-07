require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

// Dummy private key for testing (Hardhat's default test account #0)
// This allows running tests without setting up .env file
// NEVER use this for real deployments!
const DUMMY_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Helper function to get private key
function getPrivateKey() {
  const privateKey = process.env.PRIVATE_KEY;
  
  // If no private key is set, return dummy key for local testing
  if (!privateKey) {
    return DUMMY_PRIVATE_KEY;
  }
  
  // Validate private key format
  if (privateKey.length !== 66 || !privateKey.startsWith("0x")) {
    console.warn("⚠️  WARNING: PRIVATE_KEY format is invalid. Using dummy key for testing.");
    return DUMMY_PRIVATE_KEY;
  }
  
  return privateKey;
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      accounts: [getPrivateKey()],
      chainId: 	5042002, // Update with official Arc Testnet Chain ID
      gasPrice: 0.001, // 0.001 USDC per gas unit (adjust as needed)
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
    ],
  },  
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};

