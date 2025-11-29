import config from './config';

/**
 * Mock ADA sending for hackathon demo
 * @param recipientAddress - The address to send ADA to
 * @param amountAda - Amount in ADA
 * @returns Mock transaction hash
 */
export async function sendAda(
  recipientAddress: string,
  amountAda: number
): Promise<string> {
  console.log(`[MOCK] Sending ${amountAda} ADA to ${recipientAddress}`);
  console.log(`[MOCK] From address: ${config.ada.address}`);

  // Generate a mock transaction hash that looks real
  const mockTxHash = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`✅ [MOCK] Transaction "submitted": ${mockTxHash}`);
  console.log(`[MOCK] View on explorer: https://preprod.cardanoscan.io/transaction/${mockTxHash}`);

  return mockTxHash;
}
