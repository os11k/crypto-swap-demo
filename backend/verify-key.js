const C = require('@emurgo/cardano-serialization-lib-nodejs');
require('dotenv').config();

console.log("=== Checking Private Key ===\n");

const privateKey = C.PrivateKey.from_bech32(process.env.CARDANO_PRIVATE_KEY);
const publicKey = privateKey.to_public();
const publicKeyHash = publicKey.hash();

console.log("Public key (hex):", Buffer.from(publicKey.as_bytes()).toString('hex'));
console.log("Public key hash:", Buffer.from(publicKeyHash.to_bytes()).toString('hex'));

console.log("\n=== Checking Address ===\n");

const address = C.Address.from_bech32(process.env.CARDANO_ADDRESS);
console.log("Address:", process.env.CARDANO_ADDRESS);

// Try to get payment credential from address
const baseAddr = C.BaseAddress.from_address(address);
if (baseAddr) {
  const paymentCred = baseAddr.payment_cred();
  const paymentKeyHash = paymentCred.to_keyhash();

  console.log("Payment key hash from address:", Buffer.from(paymentKeyHash.to_bytes()).toString('hex'));
  console.log("\nDo they match?", Buffer.from(publicKeyHash.to_bytes()).toString('hex') === Buffer.from(paymentKeyHash.to_bytes()).toString('hex'));
}
