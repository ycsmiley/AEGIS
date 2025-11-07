require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
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
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.circle.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614, // Update with official Arc Testnet Chain ID
      gasPrice: 1000000, // 0.001 USDC per gas unit (adjust as needed)
    },
  },
  etherscan: {
    apiKey: {
      arcTestnet: process.env.ARC_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 421614,
        urls: {
          apiURL: "https://api-testnet.arc.circle.com/api",
          browserURL: "https://explorer.testnet.arc.circle.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};

