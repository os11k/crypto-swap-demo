const C = require("@emurgo/cardano-serialization-lib-nodejs");
const crypto = require('crypto');

const txBody = C.TransactionBody.new(
  C.TransactionInputs.new(),
  C.TransactionOutputs.new(),
  C.BigNum.from_str("1000000")
);

const dummyKey = C.PrivateKey.generate_ed25519();
const bodyBytes = txBody.to_bytes();

console.log("Testing hash approaches:\n");

// Cardano uses Blake2b-256 for transaction hashing
try {
  const hash = crypto.createHash('blake2b512').update(bodyBytes).digest().slice(0, 32);
  const txHash = C.TransactionHash.from_bytes(hash);
  const witness = C.make_vkey_witness(txHash, dummyKey);
  console.log("✅ blake2b512 (first 32 bytes) works!");
} catch (e) {
  console.log("❌ blake2b512 failed:", e.message);
}

try {
  const hash = crypto.createHash('sha256').update(bodyBytes).digest();
  const txHash = C.TransactionHash.from_bytes(hash);
  const witness = C.make_vkey_witness(txHash, dummyKey);
  console.log("✅ sha256 works!");
} catch (e) {
  console.log("❌ sha256 failed:", e.message);
}
