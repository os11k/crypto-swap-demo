import * as CML from '@dcspark/cardano-multiplatform-lib-nodejs';
import config from './config';

/**
 * Send ADA using Cardano Multiplatform Library
 * @param recipientAddress - The address to send ADA to
 * @param amountAda - Amount in ADA
 * @returns Transaction hash
 */
export async function sendAda(
  recipientAddress: string,
  amountAda: number
): Promise<string> {
  try {
    console.log(`Building Cardano transaction with CML: ${amountAda} ADA to ${recipientAddress}`);

    // Convert ADA to lovelace
    const lovelaceAmount = Math.floor(amountAda * 1_000_000);

    // Get UTXOs
    const utxosResponse = await fetch(
      `${config.ada.blockfrostUrl}/addresses/${config.ada.address}/utxos`,
      { headers: { 'project_id': config.ada.blockfrostApiKey } }
    );
    const utxos = await utxosResponse.json();

    console.log(`Found ${utxos.length} UTXOs`);

    // Get protocol parameters
    const paramsResponse = await fetch(
      `${config.ada.blockfrostUrl}/epochs/latest/parameters`,
      { headers: { 'project_id': config.ada.blockfrostApiKey } }
    );
    const protocolParams = await paramsResponse.json();

    // Build transaction
    const txBuilder = CML.TransactionBuilder.new(
      CML.TransactionBuilderConfig.new()
        .fee_algo(
          CML.LinearFee.new(
            CML.BigNum.from_str(protocolParams.min_fee_a.toString()),
            CML.BigNum.from_str(protocolParams.min_fee_b.toString())
          )
        )
        .pool_deposit(CML.BigNum.from_str(protocolParams.pool_deposit))
        .key_deposit(CML.BigNum.from_str(protocolParams.key_deposit))
        .max_value_size(parseInt(protocolParams.max_val_size))
        .max_tx_size(parseInt(protocolParams.max_tx_size))
        .coins_per_utxo_byte(CML.BigNum.from_str(protocolParams.coins_per_utxo_size))
        .build()
    );

    // Add output
    txBuilder.add_output(
      CML.TransactionOutput.new(
        CML.Address.from_bech32(recipientAddress),
        CML.Value.new(CML.BigNum.from_str(lovelaceAmount.toString()))
      )
    );

    // Add inputs
    const txInputs = CML.TransactionUnspentOutputs.new();
    for (const utxo of utxos) {
      const lovelace = utxo.amount.find((a: any) => a.unit === 'lovelace')?.quantity;
      if (!lovelace) continue;

      const input = CML.TransactionInput.new(
        CML.TransactionHash.from_bytes(Buffer.from(utxo.tx_hash, 'hex')),
        utxo.tx_index
      );

      const output = CML.TransactionOutput.new(
        CML.Address.from_bech32(config.ada.address),
        CML.Value.new(CML.BigNum.from_str(lovelace))
      );

      txInputs.add(CML.TransactionUnspentOutput.new(input, output));
    }

    txBuilder.add_inputs_from(txInputs, CML.CoinSelectionStrategyCIP2.LargestFirstMultiAsset);
    txBuilder.add_change_if_needed(CML.Address.from_bech32(config.ada.address));

    // Build transaction body
    const txBody = txBuilder.build();

    console.log('Transaction body built, creating witness...');

    // Sign transaction - CML might have better witness support
    const privateKey = CML.PrivateKey.from_bech32(config.ada.privateKey);

    // Try using make_vkey_witness with transaction body hash
    const txBodyHash = CML.hash_transaction(txBody);
    const vkeyWitness = CML.make_vkey_witness(txBodyHash, privateKey);

    const vkeyWitnesses = CML.Vkeywitnesses.new();
    vkeyWitnesses.add(vkeyWitness);

    const witnessSet = CML.TransactionWitnessSet.new();
    witnessSet.set_vkeys(vkeyWitnesses);

    const transaction = CML.Transaction.new(txBody, witnessSet, undefined);

    console.log('Transaction signed, submitting...');

    // Submit transaction
    const txBytes = transaction.to_bytes();
    const submitResponse = await fetch(
      `${config.ada.blockfrostUrl}/tx/submit`,
      {
        method: 'POST',
        headers: {
          'project_id': config.ada.blockfrostApiKey,
          'Content-Type': 'application/cbor'
        },
        body: txBytes
      }
    );

    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      throw new Error(`Failed to submit transaction: ${error}`);
    }

    const txHash = await submitResponse.text();
    console.log(`✅ Cardano transaction submitted: ${txHash}`);

    return txHash;

  } catch (error) {
    console.error('Error sending ADA with CML:', error);
    throw error;
  }
}
