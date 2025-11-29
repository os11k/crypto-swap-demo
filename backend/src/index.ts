import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { createOrder, getOrder, updateOrderStatus, getPendingOrders, expireOldOrders, markAsDepositedIfPending, markAsProcessingIfDeposited } from './db.js';
import config from './config.js';
import { ethers } from 'ethers';
import { sendAda } from './cardano-lucid.js'; // Using Lucid for real ADA sending

const app = express();

app.use(cors());
app.use(express.json());

// Initialize ETH wallet
let ethWallet: ethers.Wallet;
let ethProvider: ethers.JsonRpcProvider;

try {
  ethProvider = new ethers.JsonRpcProvider(config.eth.rpcUrl);
  if (config.eth.privateKey) {
    ethWallet = new ethers.Wallet(config.eth.privateKey, ethProvider);
    console.log('ETH Escrow Address:', ethWallet.address);
  }
} catch (error) {
  console.error('Failed to initialize ETH wallet:', error);
}

// Create new swap order
app.post('/api/orders', (req, res) => {
  try {
    const { direction, amount, recipientAddress } = req.body;

    if (!direction || !amount || !recipientAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = uuidv4();
    const outputAmount =
      direction === 'ADA_TO_ETH'
        ? amount * config.exchangeRate
        : amount / config.exchangeRate;

    // Determine deposit address based on direction
    const depositAddress =
      direction === 'ADA_TO_ETH'
        ? config.ada.address || 'addr_test1...' // Cardano PreProd address
        : ethWallet?.address || '0x...'; // Ethereum Sepolia address

    const order = {
      id: orderId,
      direction: direction as 'ADA_TO_ETH' | 'ETH_TO_ADA',
      amount: parseFloat(amount),
      recipient_address: recipientAddress,
      deposit_address: depositAddress,
      status: 'pending' as const,
      output_amount: outputAmount,
      expires_at: Date.now() + config.orderExpiryTime,
    };

    createOrder(order);

    res.json({
      orderId: order.id,
      depositAddress: order.deposit_address,
      expiresAt: new Date(order.expires_at).toISOString(),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order details
app.get('/api/orders/:id', (req, res) => {
  try {
    const order = getOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      id: order.id,
      direction: order.direction,
      amount: order.amount,
      recipientAddress: order.recipient_address,
      depositAddress: order.deposit_address,
      status: order.status,
      outputAmount: order.output_amount,
      expiresAt: new Date(order.expires_at).toISOString(),
      depositTxHash: order.deposit_tx_hash,
      outputTxHash: order.output_tx_hash,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Monitor chains and process swaps
const monitorChains = async () => {
  try {
    // Expire old orders
    expireOldOrders();

    const pendingOrders = getPendingOrders();

    for (const order of pendingOrders) {
      if (order.direction === 'ETH_TO_ADA') {
        // Monitor Sepolia for ETH deposits
        await checkEthDeposit(order);
      } else {
        // Monitor PreProd for ADA deposits
        await checkAdaDeposit(order);
      }
    }
  } catch (error) {
    console.error('Error monitoring chains:', error);
  }
};

const checkEthDeposit = async (order: any) => {
  try {
    if (!ethWallet || !ethProvider) {
      console.log('ETH wallet not configured');
      return;
    }

    if (order.status === 'pending') {
      console.log(`Checking ETH deposit for order ${order.id}...`);

      try {
        // Use Etherscan API V2 to efficiently get transactions to escrow address
        // This is 1000x faster than scanning blocks with RPC (1 API call vs 500+)
        const orderCreatedTimestamp = Math.floor(order.created_at / 1000); // Convert to seconds

        // Sepolia chainid = 11155111
        const etherscanUrl = `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${ethWallet.address}&startblock=0&endblock=99999999&sort=desc&apikey=${config.eth.etherscanApiKey}`;

        const response = await fetch(etherscanUrl);
        if (!response.ok) {
          console.error('Etherscan API error:', response.status);
          return;
        }

        const data = await response.json();

        if (data.status !== '1' || !data.result) {
          console.error('Etherscan API response error:', data.message);
          return;
        }

        // Check transactions for matching deposit
        for (const tx of data.result) {
          // Only check incoming transactions
          if (tx.to.toLowerCase() !== ethWallet.address.toLowerCase()) continue;

          // Only check transactions after order was created
          const txTimestamp = parseInt(tx.timeStamp);
          if (txTimestamp < orderCreatedTimestamp) continue;

          // Check if amount matches (convert from wei to ETH)
          const ethAmount = parseFloat(ethers.formatEther(tx.value));

          // Does the amount match our order? (within 0.001 ETH tolerance)
          if (Math.abs(ethAmount - order.amount) < 0.001) {
            console.log(`✅ ETH deposit detected! ${ethAmount} ETH in tx ${tx.hash}`);

            // Atomic update: only mark as deposited if still pending (prevents double processing)
            const updated = markAsDepositedIfPending(order.id, tx.hash);

            if (updated) {
              console.log(`✅ Order ${order.id} marked as deposited`);
            } else {
              console.log(`⚠️  Order ${order.id} already processed - skipping`);
            }
            return;
          }
        }
      } catch (error) {
        console.error('Error checking ETH deposit:', error);
      }
    }

    if (order.status === 'deposited' || order.status === 'processing') {
      // Execute the swap - send ADA to recipient
      await executeAdaSwap(order);
    }
  } catch (error) {
    console.error('Error checking ETH deposit:', error);
  }
};

const checkAdaDeposit = async (order: any) => {
  try {
    if (!config.ada.blockfrostApiKey) {
      console.log('Cardano Blockfrost not configured');
      return;
    }

    if (order.status === 'pending') {
      console.log(`Checking ADA deposit for order ${order.id}...`);

      // Check for incoming transactions using Blockfrost
      const response = await fetch(
        `${config.ada.blockfrostUrl}/addresses/${config.ada.address}/transactions?order=desc&count=10`,
        {
          headers: {
            'project_id': config.ada.blockfrostApiKey
          }
        }
      );

      if (!response.ok) {
        console.error('Blockfrost API error:', response.status);
        return;
      }

      const transactions = await response.json();

      // Check recent transactions for matching amount
      for (const tx of transactions) {
        // Get transaction details to check timestamp
        const txInfo = await fetch(
          `${config.ada.blockfrostUrl}/txs/${tx.tx_hash}`,
          {
            headers: {
              'project_id': config.ada.blockfrostApiKey
            }
          }
        );

        if (!txInfo.ok) continue;

        const txData = await txInfo.json();
        const txTimestamp = txData.block_time * 1000; // Convert to milliseconds

        // Only check transactions that happened AFTER the order was created
        if (txTimestamp < order.created_at) {
          continue; // Skip old transactions
        }

        const txDetails = await fetch(
          `${config.ada.blockfrostUrl}/txs/${tx.tx_hash}/utxos`,
          {
            headers: {
              'project_id': config.ada.blockfrostApiKey
            }
          }
        );

        if (!txDetails.ok) continue;

        const utxos = await txDetails.json();

        // Check if this transaction sent ADA to our address
        for (const output of utxos.outputs) {
          if (output.address === config.ada.address) {
            const lovelaceAmount = parseInt(output.amount.find((a: any) => a.unit === 'lovelace')?.quantity || '0');
            const adaAmount = lovelaceAmount / 1000000;

            // Check if amount matches order (within 0.1 ADA tolerance for fees)
            if (Math.abs(adaAmount - order.amount) < 0.1) {
              console.log(`✅ ADA deposit detected! ${adaAmount} ADA in tx ${tx.tx_hash}`);

              // Atomic update: only mark as deposited if still pending (prevents double processing)
              const updated = markAsDepositedIfPending(order.id, tx.tx_hash);

              if (updated) {
                console.log(`✅ Order ${order.id} marked as deposited`);
              } else {
                console.log(`⚠️  Order ${order.id} already processed - skipping`);
              }
              return;
            }
          }
        }
      }
    }

    if (order.status === 'deposited' || order.status === 'processing') {
      // Execute the swap - send ETH to recipient
      await executeEthSwap(order);
    }
  } catch (error) {
    console.error('Error checking ADA deposit:', error);
  }
};

const executeEthSwap = async (order: any) => {
  try {
    if (!ethWallet) {
      console.error('ETH wallet not configured');
      return;
    }

    console.log(`Executing ETH swap for order ${order.id}...`);

    // Atomic lock: Only proceed if order is 'deposited' (not already processing)
    const canProcess = markAsProcessingIfDeposited(order.id);

    if (!canProcess) {
      console.log(`⚠️  Order ${order.id} already being processed - skipping`);
      return;
    }

    // Send ETH to recipient
    const tx = await ethWallet.sendTransaction({
      to: order.recipient_address,
      value: ethers.parseEther(order.output_amount.toString()),
    });

    console.log(`ETH transaction sent: ${tx.hash}`);

    await tx.wait();

    console.log(`ETH swap completed for order ${order.id}`);

    updateOrderStatus(order.id, 'completed', order.deposit_tx_hash, tx.hash);
  } catch (error) {
    console.error('Error executing ETH swap:', error);
  }
};

const executeAdaSwap = async (order: any) => {
  try {
    console.log(`Executing ADA swap for order ${order.id}...`);

    // Atomic lock: Only proceed if order is 'deposited' (not already processing)
    const canProcess = markAsProcessingIfDeposited(order.id);

    if (!canProcess) {
      console.log(`⚠️  Order ${order.id} already being processed - skipping`);
      return;
    }

    // Send ADA to recipient
    console.log(`Sending ${order.output_amount} ADA to ${order.recipient_address}...`);

    const txHash = await sendAda(order.recipient_address, order.output_amount);

    console.log(`✅ ADA swap completed for order ${order.id}`);
    console.log(`   Transaction hash: ${txHash}`);

    updateOrderStatus(order.id, 'completed', order.deposit_tx_hash, txHash);
  } catch (error) {
    console.error('Error executing ADA swap:', error);
  }
};

// Start monitoring interval (check every 10 seconds)
setInterval(monitorChains, 10000);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Testing endpoint to manually mark order as deposited (for demo purposes)
app.post('/api/orders/:id/test-deposit', (req, res) => {
  try {
    const order = getOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not pending' });
    }

    const mockTxHash = 'test_deposit_' + Math.random().toString(36).substring(7);
    updateOrderStatus(order.id, 'deposited', mockTxHash);

    res.json({
      success: true,
      message: 'Order marked as deposited. Swap will execute automatically.',
      depositTxHash: mockTxHash
    });
  } catch (error) {
    console.error('Error in test deposit:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 Crypto Swap Backend running on port ${PORT}`);
  console.log(`📡 ETH Escrow: ${ethWallet?.address || 'Not configured'}`);
  console.log(`📡 ADA Escrow: ${config.ada.address || 'Not configured'}\n`);
});
