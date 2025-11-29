import { MeshWallet, BlockfrostProvider, Transaction } from '@meshsdk/core';
import config from './config';

/**
 * Send ADA using Mesh SDK
 * @param recipientAddress - The address to send ADA to
 * @param amountAda - Amount in ADA
 * @returns Transaction hash
 */
export async function sendAda(
  recipientAddress: string,
  amountAda: number
): Promise<string> {
  try {
    console.log(`Building Cardano transaction with Mesh: ${amountAda} ADA to ${recipientAddress}`);

    // Initialize Blockfrost provider
    const blockfrostProvider = new BlockfrostProvider(config.ada.blockfrostApiKey);

    // Convert private key from bech32 to hex for Mesh
    const CardanoWasm = await import('@emurgo/cardano-serialization-lib-nodejs');
    const privateKey = CardanoWasm.PrivateKey.from_bech32(config.ada.privateKey);
    const privateKeyHex = Buffer.from(privateKey.as_bytes()).toString('hex');

    // Create wallet from private key
    const wallet = new MeshWallet({
      networkId: 0, // 0 = testnet, 1 = mainnet
      fetcher: blockfrostProvider,
      submitter: blockfrostProvider,
      key: {
        type: 'root',
        bech32: config.ada.privateKey
      }
    });

    // Convert ADA to lovelace
    const lovelaceAmount = String(Math.floor(amountAda * 1_000_000));

    // Build transaction
    const tx = new Transaction({ initiator: wallet });
    tx.sendLovelace(recipientAddress, lovelaceAmount);

    console.log(`Transaction built, signing and submitting...`);

    // Sign and submit transaction
    const unsignedTx = await tx.build();
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);

    console.log(`✅ Cardano transaction submitted: ${txHash}`);

    return txHash;

  } catch (error) {
    console.error('Error sending ADA with Mesh:', error);
    throw error;
  }
}
