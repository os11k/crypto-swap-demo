import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Exchange rate: 1 ADA = 0.0005 ETH
  exchangeRate: 0.0005,

  // Order expiry time in milliseconds (30 minutes)
  orderExpiryTime: 30 * 60 * 1000,

  // Ethereum configuration (Sepolia testnet)
  eth: {
    rpcUrl: process.env.ETH_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    privateKey: process.env.ETH_PRIVATE_KEY || '',
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
    // This is the escrow wallet address that will be generated from the private key
  },

  // Cardano configuration (PreProd testnet)
  ada: {
    // For simplicity, we'll use blockfrost API
    blockfrostApiKey: process.env.CARDANO_BLOCKFROST_KEY || '',
    blockfrostUrl: 'https://cardano-preprod.blockfrost.io/api/v0',
    // Wallet address and keys
    address: process.env.CARDANO_ADDRESS || '',
    privateKey: process.env.CARDANO_PRIVATE_KEY || '',
  },

  // Server configuration
  port: 3001,
};

export default config;
