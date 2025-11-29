const C = require('@emurgo/cardano-serialization-lib-nodejs');
const crypto = require('crypto');
require('dotenv').config();

async function testTransaction() {
  try {
    // Get protocol parameters
    const paramsResponse = await fetch(
      'https://cardano-preprod.blockfrost.io/api/v0/epochs/latest/parameters',
      { headers: { 'project_id': process.env.CARDANO_BLOCKFROST_KEY } }
    );
    const protocolParams = await paramsResponse.json();

    // Get UTXOs
    const utxosResponse = await fetch(
      `https://cardano-preprod.blockfrost.io/api/v0/addresses/${process.env.CARDANO_ADDRESS}/utxos`,
      { headers: { 'project_id': process.env.CARDANO_BLOCKFROST_KEY } }
    );
    const utxos = await utxosResponse.json();

    console.log("UTXOs found:", utxos.length);
    console.log("First UTXO:", JSON.stringify(utxos[0], null, 2));

    // Initialize transaction builder
    const txBuilder = C.TransactionBuilder.new(
      C.TransactionBuilderConfigBuilder.new()
        .fee_algo(
          C.LinearFee.new(
            C.BigNum.from_str(protocolParams.min_fee_a.toString()),
            C.BigNum.from_str(protocolParams.min_fee_b.toString())
          )
        )
        .pool_deposit(C.BigNum.from_str(protocolParams.pool_deposit))
        .key_deposit(C.BigNum.from_str(protocolParams.key_deposit))
        .max_value_size(parseInt(protocolParams.max_val_size))
        .max_tx_size(parseInt(protocolParams.max_tx_size))
        .coins_per_utxo_byte(C.BigNum.from_str(protocolParams.coins_per_utxo_size))
        .build()
    );

    // Add output - send 5 ADA to same address (test transaction)
    const outputAddr = C.Address.from_bech32(process.env.CARDANO_ADDRESS);
    const outputAmount = C.BigNum.from_str("5000000"); // 5 ADA
    txBuilder.add_output(
      C.TransactionOutput.new(outputAddr, C.Value.new(outputAmount))
    );

    // Add inputs
    const txInputs = C.TransactionUnspentOutputs.new();

    // Just use first UTXO for simplicity
    const utxo = utxos[0];
    const lovelace = utxo.amount.find(a => a.unit === 'lovelace')?.quantity;

    const input = C.TransactionInput.new(
      C.TransactionHash.from_bytes(Buffer.from(utxo.tx_hash, 'hex')),
      utxo.tx_index
    );

    const output = C.TransactionOutput.new(
      C.Address.from_bech32(process.env.CARDANO_ADDRESS),
      C.Value.new(C.BigNum.from_str(lovelace))
    );

    txInputs.add(C.TransactionUnspentOutput.new(input, output));

    // Add inputs to transaction
    txBuilder.add_inputs_from(
      txInputs,
      C.CoinSelectionStrategyCIP2.LargestFirstMultiAsset
    );

    // Add change
    txBuilder.add_change_if_needed(C.Address.from_bech32(process.env.CARDANO_ADDRESS));

    // Build transaction body
    const txBody = txBuilder.build();

    console.log("\n=== Transaction Body Built ===");
    console.log("Inputs:", txBody.inputs().len());
    console.log("Outputs:", txBody.outputs().len());
    console.log("Fee:", txBody.fee().to_str());

    // Create transaction hash for signing
    const bodyBytes = txBody.to_bytes();
    const bodyHash = crypto.createHash('blake2b512').update(bodyBytes).digest().slice(0, 32);
    const txBodyHash = C.TransactionHash.from_bytes(bodyHash);

    console.log("\nTx body hash:", Buffer.from(txBodyHash.to_bytes()).toString('hex'));

    // Sign transaction
    const privateKey = C.PrivateKey.from_bech32(process.env.CARDANO_PRIVATE_KEY);
    const vkeyWitnesses = C.Vkeywitnesses.new();
    const vkeyWitness = C.make_vkey_witness(txBodyHash, privateKey);
    vkeyWitnesses.add(vkeyWitness);

    // Check the witness
    const vkey = vkeyWitness.vkey();
    const signature = vkeyWitness.signature();

    console.log("\n=== Witness Created ===");
    console.log("VKey (public key):", Buffer.from(vkey.public_key().as_bytes()).toString('hex'));
    console.log("Signature:", Buffer.from(signature.to_bytes()).toString('hex').substring(0, 64) + "...");

    // Assemble final transaction
    const witnessSet = C.TransactionWitnessSet.new();
    witnessSet.set_vkeys(vkeyWitnesses);

    const transaction = C.Transaction.new(txBody, witnessSet, undefined);

    console.log("\n=== Transaction Ready ===");
    console.log("Transaction size:", transaction.to_bytes().length, "bytes");
    console.log("Transaction hex (first 100 chars):", Buffer.from(transaction.to_bytes()).toString('hex').substring(0, 100) + "...");

    // Don't submit, just show it's ready
    console.log("\n✅ Transaction built successfully!");

  } catch (error) {
    console.error("Error:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

testTransaction();
