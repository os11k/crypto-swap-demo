'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';

interface Order {
  id: string;
  direction: 'ADA_TO_ETH' | 'ETH_TO_ADA';
  amount: number;
  recipientAddress: string;
  depositAddress: string;
  status: 'pending' | 'deposited' | 'processing' | 'completed' | 'expired';
  outputAmount: number;
  expiresAt: string;
  depositTxHash?: string;
  outputTxHash?: string;
}

export default function OrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/orders/${orderId}`);
        const data = await response.json();
        setOrder(data);

        // Generate QR code
        const qr = await QRCode.toDataURL(data.depositAddress);
        setQrCode(qr);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!order) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(order.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-300">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-xl text-red-400">Order not found</div>
      </div>
    );
  }

  const fromCrypto = order.direction === 'ADA_TO_ETH' ? 'ADA' : 'ETH';
  const toCrypto = order.direction === 'ADA_TO_ETH' ? 'ETH' : 'ADA';

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
    deposited: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
    processing: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
    completed: 'bg-green-500/20 text-green-400 border border-green-500/50',
    expired: 'bg-red-500/20 text-red-400 border border-red-500/50',
  };

  const statusText = {
    pending: 'Waiting for deposit',
    deposited: 'Deposit received',
    processing: 'Processing swap',
    completed: 'Swap completed',
    expired: 'Order expired',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-200 mb-2">Order #{orderId.slice(0, 8)}</h1>
            <div className={`inline-block px-4 py-2 rounded-full font-semibold ${statusColors[order.status]}`}>
              {statusText[order.status]}
            </div>
          </div>

          {order.status === 'pending' && (
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-300 mb-1">Time remaining</div>
              <div className="text-3xl font-bold text-blue-400">{timeLeft}</div>
            </div>
          )}

          <div className="border-t border-gray-700 pt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-400">You send</div>
                <div className="text-xl font-bold text-gray-200">
                  {order.amount} {fromCrypto}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">You receive</div>
                <div className="text-xl font-bold text-gray-200">
                  {order.outputAmount} {toCrypto}
                </div>
              </div>
            </div>

            {order.status === 'pending' && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <div className="text-sm font-medium text-gray-300 mb-3">
                      Send exactly {order.amount} {fromCrypto} to:
                    </div>
                    {qrCode && (
                      <img src={qrCode} alt="Deposit address QR" className="mx-auto mb-4 w-48 h-48 bg-white p-2 rounded-lg" />
                    )}
                    <div className="bg-gray-900 rounded-lg p-3 break-all font-mono text-sm border border-gray-600 text-gray-200">
                      {order.depositAddress}
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.depositAddress)}
                      className="mt-3 text-blue-400 hover:text-blue-300 font-medium text-sm"
                    >
                      📋 Copy Address
                    </button>
                  </div>
                  <div className="text-xs text-center text-gray-400 mt-4">
                    ⚠️ Send only {fromCrypto} to this address. Sending other currencies will result in loss of funds.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-300 mb-2">
                    {toCrypto} will be sent to:
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 break-all font-mono text-sm border border-gray-600 text-gray-200">
                    {order.recipientAddress}
                  </div>
                </div>
              </div>
            )}

            {order.status === 'completed' && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-lg font-semibold text-gray-200 mb-2">
                    Swap Completed Successfully!
                  </div>
                  <div className="text-sm text-gray-400">
                    {order.outputAmount} {toCrypto} sent to your address
                  </div>
                </div>

                {order.outputTxHash && (
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-2">Output Transaction</div>
                    <div className="bg-gray-900 rounded-lg p-3 break-all font-mono text-xs border border-gray-600 text-gray-200">
                      {order.outputTxHash}
                    </div>
                  </div>
                )}

                {order.depositTxHash && (
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-2">Deposit Transaction</div>
                    <div className="bg-gray-900 rounded-lg p-3 break-all font-mono text-xs border border-gray-600 text-gray-200">
                      {order.depositTxHash}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(order.status === 'deposited' || order.status === 'processing') && (
              <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">⏳</div>
                <div className="text-lg font-semibold text-gray-200 mb-2">
                  Processing your swap...
                </div>
                <div className="text-sm text-gray-400">
                  Your {toCrypto} will be sent shortly
                </div>
              </div>
            )}

            {order.status === 'expired' && (
              <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">⏰</div>
                <div className="text-lg font-semibold text-gray-200 mb-2">Order Expired</div>
                <div className="text-sm text-gray-400">
                  This order has expired. Please create a new order.
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <a
              href="/"
              className="block text-center text-blue-400 hover:text-blue-300 font-medium"
            >
              ← Create new swap
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
