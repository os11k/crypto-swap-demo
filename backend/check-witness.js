const C = require('@emurgo/cardano-serialization-lib-nodejs');
const crypto = require('crypto');

const txBody = C.TransactionBody.new(
  C.TransactionInputs.new(),
  C.TransactionOutputs.new(),
  C.BigNum.from_str("1000000")
);

const dummyKey = C.PrivateKey.generate_ed25519();

console.log("Testing make_vkey_witness with different inputs:\n");

// Try 1: TransactionHash from Blake2b
try {
  const bodyBytes = txBody.to_bytes();
  const bodyHash = crypto.createHash('blake2b512').update(bodyBytes).digest().slice(0, 32);
  const txHash = C.TransactionHash.from_bytes(bodyHash);
  const witness = C.make_vkey_witness(txHash, dummyKey);
  console.log("✅ TransactionHash from Blake2b512 works");
} catch (e) {
  console.log("❌ TransactionHash from Blake2b512:", e.message);
}

// Try 2: Check if there's a make_icarus_bootstrap_witness or similar
console.log("\nChecking for other witness creation functions:");
Object.keys(C).filter(k => k.toLowerCase().includes('witness')).forEach(k => {
  if (typeof C[k] === 'function' && k.startsWith('make_')) {
    console.log("  -", k);
  }
});

// Try 3: Check if we need to use Vkeywitness.new() directly
console.log("\nVkeywitness static methods:");
console.log(Object.getOwnPropertyNames(C.Vkeywitness).filter(m => !m.startsWith('__')));
