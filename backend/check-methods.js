const C = require('@emurgo/cardano-serialization-lib-nodejs');

// Create a minimal transaction body
const txBody = C.TransactionBody.new(
  C.TransactionInputs.new(),
  C.TransactionOutputs.new(),
  C.BigNum.from_str("1000000")
);

console.log("TransactionBody methods containing 'hash':");
Object.getOwnPropertyNames(Object.getPrototypeOf(txBody))
  .filter(m => m.toLowerCase().includes('hash'))
  .forEach(m => console.log("  -", m));

console.log("\nAll TransactionBody methods:");
Object.getOwnPropertyNames(Object.getPrototypeOf(txBody))
  .filter(m => !m.startsWith('_') && m !== 'constructor')
  .sort()
  .forEach(m => console.log("  -", m));

// Check if there's a built-in hash method
if (typeof txBody.hash === 'function') {
  console.log("\n✅ TransactionBody has a hash() method!");
  const hash = txBody.hash();
  console.log("Hash type:", hash.constructor.name);
  console.log("Hash bytes:", Buffer.from(hash.to_bytes()).toString('hex'));
}
