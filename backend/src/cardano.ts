import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import config from './config';
import * as crypto from 'crypto';

/**
 * Build and send a Cardano transaction
 * @param recipientAddress - The address to send ADA to
 * @param amountAda - Amount in ADA (will be converted to lovelace)
 * @returns Transaction hash
 */
export async function sendAda(
  recipientAddress: string,
  amountAda: number
): Promise<string> {
  try {
    // Convert ADA to lovelace (1 ADA = 1,000,000 lovelace)
    const lovelaceAmount = Math.floor(amountAda * 1_000_000);

    console.log(`Building Cardano transaction: ${amountAda} ADA (${lovelaceAmount} lovelace) to ${recipientAddress}`);

    // Get UTXOs from our address
    const utxosResponse = await fetch(
      `${config.ada.blockfrostUrl}/addresses/${config.ada.address}/utxos`,
      {
        headers: { 'project_id': config.ada.blockfrostApiKey }
      }
    );

    if (!utxosResponse.ok) {
      throw new Error(`Failed to fetch UTXOs: ${utxosResponse.status}`);
    }

    const utxos = await utxosResponse.json();

    if (!utxos || utxos.length === 0) {
      throw new Error('No UTXOs available in wallet');
    }

    console.log(`Found ${utxos.length} UTXOs in wallet`);

    // Get latest protocol parameters
    const paramsResponse = await fetch(
      `${config.ada.blockfrostUrl}/epochs/latest/parameters`,
      {
        headers: { 'project_id': config.ada.blockfrostApiKey }
      }
    );

    const protocolParams = await paramsResponse.json();

    // Initialize transaction builder
    const txBuilder = CardanoWasm.TransactionBuilder.new(
      CardanoWasm.TransactionBuilderConfigBuilder.new()
        .fee_algo(
          CardanoWasm.LinearFee.new(
            CardanoWasm.BigNum.from_str(protocolParams.min_fee_a.toString()),
            CardanoWasm.BigNum.from_str(protocolParams.min_fee_b.toString())
          )
        )
        .pool_deposit(CardanoWasm.BigNum.from_str(protocolParams.pool_deposit))
        .key_deposit(CardanoWasm.BigNum.from_str(protocolParams.key_deposit))
        .max_value_size(parseInt(protocolParams.max_val_size))
        .max_tx_size(parseInt(protocolParams.max_tx_size))
        .coins_per_utxo_byte(CardanoWasm.BigNum.from_str(protocolParams.coins_per_utxo_size))
        .build()
    );

    // Add output (recipient)
    txBuilder.add_output(
      CardanoWasm.TransactionOutput.new(
        CardanoWasm.Address.from_bech32(recipientAddress),
        CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(lovelaceAmount.toString()))
      )
    );

    // Add inputs (UTXOs)
    const txInputs = CardanoWasm.TransactionUnspentOutputs.new();

    for (const utxo of utxos) {
      const lovelace = utxo.amount.find((a: any) => a.unit === 'lovelace')?.quantity;
      if (!lovelace) continue;

      const input = CardanoWasm.TransactionInput.new(
        CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxo.tx_hash, 'hex')),
        utxo.tx_index
      );

      const output = CardanoWasm.TransactionOutput.new(
        CardanoWasm.Address.from_bech32(config.ada.address),
        CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(lovelace))
      );

      txInputs.add(CardanoWasm.TransactionUnspentOutput.new(input, output));
    }

    // Add inputs to transaction
    txBuilder.add_inputs_from(
      txInputs,
      CardanoWasm.CoinSelectionStrategyCIP2.LargestFirstMultiAsset
    );

    // Set change address (our address)
    txBuilder.add_change_if_needed(CardanoWasm.Address.from_bech32(config.ada.address));

    // Build transaction body
    const txBody = txBuilder.build();

    // Create transaction hash for signing (Cardano uses Blake2b-256)
    const bodyBytes = txBody.to_bytes();
    const bodyHash = crypto.createHash('blake2b512').update(bodyBytes).digest().slice(0, 32);
    const txBodyHash = CardanoWasm.TransactionHash.from_bytes(bodyHash);

    // Sign transaction
    // Note: You need to provide the private key (signing key)
    if (!config.ada.privateKey) {
      throw new Error('Cardano private key not configured');
    }

    const privateKey = CardanoWasm.PrivateKey.from_bech32(config.ada.privateKey);
    const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
    const vkeyWitness = CardanoWasm.make_vkey_witness(txBodyHash, privateKey);
    vkeyWitnesses.add(vkeyWitness);

    // Assemble final transaction
    const witnessSet = CardanoWasm.TransactionWitnessSet.new();
    witnessSet.set_vkeys(vkeyWitnesses);

    const transaction = CardanoWasm.Transaction.new(txBody, witnessSet, undefined);

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

    const submittedTxHash = await submitResponse.text();
    console.log(`✅ Cardano transaction submitted: ${submittedTxHash}`);

    return submittedTxHash;

  } catch (error) {
    console.error('Error sending ADA:', error);
    throw error;
  }
}
