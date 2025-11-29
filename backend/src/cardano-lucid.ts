import { Blockfrost, Lucid } from 'lucid-cardano';
import config from './config.js';

/**
 * Send ADA using Lucid library
 * @param recipientAddress - The address to send ADA to
 * @param amountAda - Amount in ADA
 * @returns Transaction hash
 */
export async function sendAda(
  recipientAddress: string,
  amountAda: number
): Promise<string> {
  try {
    console.log(`Building Cardano transaction with Lucid: ${amountAda} ADA to ${recipientAddress}`);

    // Initialize Lucid with Blockfrost provider
    const lucid = await Lucid.new(
      new Blockfrost(
        config.ada.blockfrostUrl,
        config.ada.blockfrostApiKey
      ),
      'Preprod' // Network
    );

    // Lucid can work with bech32 private keys directly
    // Try using the bech32 key as-is
    lucid.selectWalletFromPrivateKey(config.ada.privateKey);

    // Convert ADA to lovelace (1 ADA = 1,000,000 lovelace)
    const lovelaceAmount = BigInt(Math.floor(amountAda * 1_000_000));

    // Build transaction
    const tx = await lucid
      .newTx()
      .payToAddress(recipientAddress, { lovelace: lovelaceAmount })
      .complete();

    console.log(`Transaction built, signing...`);

    // Sign transaction
    const signedTx = await tx.sign().complete();

    console.log(`Transaction signed, submitting...`);

    // Submit transaction
    const txHash = await signedTx.submit();

    console.log(`✅ Cardano transaction submitted: ${txHash}`);

    return txHash;

  } catch (error) {
    console.error('Error sending ADA with Lucid:', error);
    throw error;
  }
}
