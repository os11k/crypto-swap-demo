const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');
const bip39 = require('bip39');

const mnemonic = 'prefer conduct baby file avoid lumber grief purse reward photo emerge margin image mansion right oval mask voyage firm guide burden jaguar husband state';
const harden = (num) => 0x80000000 + num;

const targetAddress1 = 'addr_test1qp05hujudu04ypvx0muxzg89mv9r03hxh9xssqag2thsje6nu2hglav905p5g39chdc85muusgrxdc8c3r0pyc3lfjjszc39v8';
const targetAddress2 = 'addr_test1qqf6m8mxy96nwlnmw5njx5tj27zx4f2vtrxxp4w4n7clvsvht839hxqr0ggl3uw8w690qt380akusdlfgnez8zatm59sr8cpuv';

console.log('Testing which address our private key can control...\n');

const entropy = bip39.mnemonicToEntropy(mnemonic);
const entropyBytes = Buffer.from(entropy, 'hex');
const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(entropyBytes, Buffer.from(''));

// Try different derivation paths
let found = false;

// Try different accounts (0-4)
for (let accountIndex = 0; accountIndex < 5 && !found; accountIndex++) {
  const accountKey = rootKey.derive(harden(1852)).derive(harden(1815)).derive(harden(accountIndex));

  // Try different address indices (0-9)
  for (let addrIndex = 0; addrIndex < 10 && !found; addrIndex++) {
    // Try different chains (0 = external, 1 = internal/change)
    for (let chain = 0; chain < 2 && !found; chain++) {
      try {
        const addressKey = accountKey.derive(chain).derive(addrIndex);
        const paymentPrivKey = addressKey.to_raw_key();
        const paymentPubKey = paymentPrivKey.to_public();

        // Also derive stake key
        const stakeKey = accountKey.derive(2).derive(0);
        const stakePrivKey = stakeKey.to_raw_key();
        const stakePubKey = stakePrivKey.to_public();

        // Build base address
        const paymentKeyHash = paymentPubKey.hash();
        const stakeKeyHash = stakePubKey.hash();

        const paymentCred = CardanoWasm.Credential.from_keyhash(paymentKeyHash);
        const stakeCred = CardanoWasm.Credential.from_keyhash(stakeKeyHash);

        const baseAddr = CardanoWasm.BaseAddress.new(
          0, // testnet
          paymentCred,
          stakeCred
        );

        const address = baseAddr.to_address().to_bech32();

        // Check if this matches either target address
        if (address === targetAddress1 || address === targetAddress2) {
          console.log('✅✅✅ MATCH FOUND! ✅✅✅\n');
          console.log('Derivation Path: m/1852\'/1815\'/' + accountIndex + '\'/' + chain + '/' + addrIndex);
          console.log('Address:', address);
          console.log('\nPrivate Key (Payment):');
          console.log(paymentPrivKey.to_bech32());
          console.log('\nPrivate Key (Stake):');
          console.log(stakePrivKey.to_bech32());

          if (address === targetAddress1) {
            console.log('\n🎯 This is the FIRST address (114,762 ADA)');
          } else {
            console.log('\n🎯 This is the SECOND address (74,798 ADA)');
          }

          found = true;
        }
      } catch (err) {
        // Skip if derivation fails
      }
    }
  }
}

if (!found) {
  console.log('❌ No match found in first 5 accounts, 10 addresses per account');
  console.log('\nThe private key we have is:');
  const acc0 = rootKey.derive(harden(1852)).derive(harden(1815)).derive(harden(0));
  const pay0 = acc0.derive(0).derive(0).to_raw_key();
  console.log(pay0.to_bech32());
  console.log('\nThis should control SOME address derived from your seed, but we need to find which one.');
}
