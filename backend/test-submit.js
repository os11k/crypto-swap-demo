const C = require('@emurgo/cardano-serialization-lib-nodejs');
const crypto = require('crypto');
require('dotenv').config();

async function submitTestTx() {
  try {
    const paramsResponse = await fetch(
      'https://cardano-preprod.blockfrost.io/api/v0/epochs/latest/parameters',
      { headers: { 'project_id': process.env.CARDANO_BLOCKFROST_KEY } }
    );
    const protocolParams = await paramsResponse.json();

    const utxosResponse = await fetch(
      `https://cardano-preprod.blockfrost.io/api/v0/addresses/${process.env.CARDANO_ADDRESS}/utxos`,
      { headers: { 'project_id': process.env.CARDANO_BLOCKFROST_KEY } }
    );
    const utxos = await utxosResponse.json();

    const txBuilder = C.TransactionBuilder.new(
      C.TransactionBuilderConfigBuilder.new()
        .fee_algo(C.LinearFee.new(
          C.BigNum.from_str(protocolParams.min_fee_a.toString()),
          C.BigNum.from_str(protocolParams.min_fee_b.toString())
        ))
        .pool_deposit(C.BigNum.from_str(protocolParams.pool_deposit))
        .key_deposit(C.BigNum.from_str(protocolParams.key_deposit))
        .max_value_size(parseInt(protocolParams.max_val_size))
        .max_tx_size(parseInt(protocolParams.max_tx_size))
        .coins_per_utxo_byte(C.BigNum.from_str(protocolParams.coins_per_utxo_size))
        .build()
    );

    // Send 2 ADA to the other test address as a small test
    const recipientAddr = 'addr_test1qp05hujudu04ypvx0muxzg89mv9r03hxh9xssqag2thsje6nu2hglav905p5g39chdc85muusgrxdc8c3r0pyc3lfjjszc39v8';
    txBuilder.add_output(
      C.TransactionOutput.new(
        C.Address.from_bech32(recipientAddr),
        C.Value.new(C.BigNum.from_str("2000000")) // 2 ADA
      )
    );

    const txInputs = C.TransactionUnspentOutputs.new();
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
    txBuilder.add_inputs_from(txInputs, C.CoinSelectionStrategyCIP2.LargestFirstMultiAsset);
    txBuilder.add_change_if_needed(C.Address.from_bech32(process.env.CARDANO_ADDRESS));

    const txBody = txBuilder.build();
    const bodyBytes = txBody.to_bytes();
    const bodyHash = crypto.createHash('blake2b512').update(bodyBytes).digest().slice(0, 32);
    const txBodyHash = C.TransactionHash.from_bytes(bodyHash);

    const privateKey = C.PrivateKey.from_bech32(process.env.CARDANO_PRIVATE_KEY);
    const vkeyWitnesses = C.Vkeywitnesses.new();
    const vkeyWitness = C.make_vkey_witness(txBodyHash, privateKey);
    vkeyWitnesses.add(vkeyWitness);

    const witnessSet = C.TransactionWitnessSet.new();
    witnessSet.set_vkeys(vkeyWitnesses);

    const transaction = C.Transaction.new(txBody, witnessSet, undefined);
    const txBytes = transaction.to_bytes();

    console.log("Submitting transaction...");
    console.log("Size:", txBytes.length, "bytes");

    const submitResponse = await fetch(
      'https://cardano-preprod.blockfrost.io/api/v0/tx/submit',
      {
        method: 'POST',
        headers: {
          'project_id': process.env.CARDANO_BLOCKFROST_KEY,
          'Content-Type': 'application/cbor'
        },
        body: txBytes
      }
    );

    const result = await submitResponse.text();
    console.log("\nResponse status:", submitResponse.status);
    console.log("Response:", result);

    if (submitResponse.ok) {
      console.log("\n✅ Transaction submitted successfully!");
      console.log("TX Hash:", result);
    } else {
      console.log("\n❌ Transaction submission failed");
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

submitTestTx();
