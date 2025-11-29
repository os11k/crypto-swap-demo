import { sendAda } from './src/cardano-lucid.js';
import config from './src/config.js';

async function testSendAda() {
  console.log('=== Testing ADA Send ===\n');

  console.log('From address:', config.ada.address);
  console.log('To address: addr_test1qp05hujudu04ypvx0muxzg89mv9r03hxh9xssqag2thsje6nu2hglav905p5g39chdc85muusgrxdc8c3r0pyc3lfjjszc39v8');
  console.log('Amount: 2 ADA\n');

  try {
    const recipientAddress = 'addr_test1qp05hujudu04ypvx0muxzg89mv9r03hxh9xssqag2thsje6nu2hglav905p5g39chdc85muusgrxdc8c3r0pyc3lfjjszc39v8';
    const amount = 2; // 2 ADA test

    console.log('Calling sendAda()...\n');
    const txHash = await sendAda(recipientAddress, amount);

    console.log('\n✅ SUCCESS!');
    console.log('Transaction Hash:', txHash);
    console.log('View on explorer: https://preprod.cardanoscan.io/transaction/' + txHash);

  } catch (error: any) {
    console.error('\n❌ FAILED!');
    console.error('Error:', error.message);

    if (error.message.includes('InvalidWitnessesUTXOW')) {
      console.error('\n📝 This is the witness/signature error we need to fix');
    }
  }
}

testSendAda();
