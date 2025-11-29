const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');
require('dotenv').config();

const privateKeyBech32 = process.env.CARDANO_PRIVATE_KEY;
const blockfrostKey = process.env.CARDANO_BLOCKFROST_KEY;

async function testCardanoKey() {
  try {
    console.log('Testing Cardano private key...\n');

    // Load private key
    const privateKey = CardanoWasm.PrivateKey.from_bech32(privateKeyBech32);
    console.log('✅ Private key loaded successfully');

    // Derive public key
    const publicKey = privateKey.to_public();
    console.log('✅ Public key derived');

    // Create payment credential
    const paymentKeyHash = publicKey.hash();

    // For base address, we need both payment and stake credentials
    // Let's try to derive the address

    // First, let's get the payment credential
    const paymentCredBytes = paymentKeyHash.to_bytes();
    console.log('Payment key hash:', Buffer.from(paymentCredBytes).toString('hex'));

    // Try to create the address - we'll use the same key for stake (simplified)
    const StakeCredential = CardanoWasm.StakeCredential;
    const BaseAddress = CardanoWasm.BaseAddress;

    const paymentCred = StakeCredential.from_keyhash(paymentKeyHash);
    const stakeCred = StakeCredential.from_keyhash(paymentKeyHash); // Using same for simplicity

    // Network ID for PreProd
    const networkId = 0; // 0 = testnet, 1 = mainnet

    const baseAddr = BaseAddress.new(networkId, paymentCred, stakeCred);
    const address = baseAddr.to_address();
    const addressBech32 = address.to_bech32();

    console.log('\n' + '='.repeat(80));
    console.log('Derived Address:', addressBech32);
    console.log('Expected Address: addr_test1qp05hujudu04ypvx0muxzg89mv9r03hxh9xssqag2thsje6nu2hglav905p5g39chdc85muusgrxdc8c3r0pyc3lfjjszc39v8');
    console.log('='.repeat(80) + '\n');

    // Now check the balance of this address
    console.log('Fetching balance from Blockfrost...\n');

    const response = await fetch(
      `https://cardano-preprod.blockfrost.io/api/v0/addresses/${addressBech32}`,
      {
        headers: { 'project_id': blockfrostKey }
      }
    );

    if (!response.ok) {
      console.error('Blockfrost error:', response.status, await response.text());
      return;
    }

    const addressInfo = await response.json();
    const lovelace = parseInt(addressInfo.amount[0].quantity);
    const ada = lovelace / 1_000_000;

    console.log('✅ Address balance:', ada, 'ADA');
    console.log('   (', lovelace, 'lovelace)');

    // Also check the expected address
    console.log('\nChecking expected address balance...');
    const expectedAddr = 'addr_test1qp05hujudu04ypvx0muxzg89mv9r03hxh9xssqag2thsje6nu2hglav905p5g39chdc85muusgrxdc8c3r0pyc3lfjjszc39v8';
    const response2 = await fetch(
      `https://cardano-preprod.blockfrost.io/api/v0/addresses/${expectedAddr}`,
      {
        headers: { 'project_id': blockfrostKey }
      }
    );

    const addressInfo2 = await response2.json();
    const lovelace2 = parseInt(addressInfo2.amount[0].quantity);
    const ada2 = lovelace2 / 1_000_000;

    console.log('✅ Expected address balance:', ada2, 'ADA');
    console.log('   (', lovelace2, 'lovelace)');

    if (addressBech32 === expectedAddr) {
      console.log('\n✅✅✅ ADDRESSES MATCH! The private key is correct! ✅✅✅');
    } else {
      console.log('\n⚠️  Addresses do not match - the key may derive a different address');
      console.log('   This could be due to different stake key derivation');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

testCardanoKey();
