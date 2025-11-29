'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [direction, setDirection] = useState<'ADA_TO_ETH' | 'ETH_TO_ADA'>('ADA_TO_ETH');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0.0005); // Fallback rate

  // Fetch live exchange rate from Kraken API on component mount
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/exchange-rate');
        const data = await response.json();
        if (data.rate) {
          setExchangeRate(data.rate);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        // Keep using fallback rate
      }
    };

    fetchExchangeRate();
    // Refresh rate every 30 seconds
    const interval = setInterval(fetchExchangeRate, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateOutput = () => {
    if (!amount || isNaN(parseFloat(amount))) return '0';
    const inputAmount = parseFloat(amount);
    if (direction === 'ADA_TO_ETH') {
      return (inputAmount * exchangeRate).toFixed(6);
    } else {
      return (inputAmount / exchangeRate).toFixed(2);
    }
  };

  const handleSwap = () => {
    setDirection(direction === 'ADA_TO_ETH' ? 'ETH_TO_ADA' : 'ADA_TO_ETH');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          amount: parseFloat(amount),
          recipientAddress,
        }),
      });

      const data = await response.json();
      if (data.orderId) {
        router.push(`/order/${data.orderId}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const fromCrypto = direction === 'ADA_TO_ETH' ? 'ADA' : 'ETH';
  const toCrypto = direction === 'ADA_TO_ETH' ? 'ETH' : 'ADA';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          PreProd ADA ⇄ Sepolia ETH
        </h1>
        <p className="text-center text-sm text-gray-400 mb-8">
          Testnet Swap Platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">You Send</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 pr-20 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                placeholder="0.00"
                required
              />
              <div className="absolute right-3 top-3 font-semibold text-blue-400">
                {fromCrypto}
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-colors shadow-lg hover:shadow-blue-500/50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">You Receive</label>
            <div className="relative">
              <input
                type="text"
                value={calculateOutput()}
                readOnly
                className="w-full px-4 py-3 pr-20 bg-gray-900 border border-gray-600 rounded-lg text-white"
                placeholder="0.00"
              />
              <div className="absolute right-3 top-3 font-semibold text-blue-400">
                {toCrypto}
              </div>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="text-center text-sm text-gray-400 bg-gray-900 py-2 px-4 rounded-lg border border-gray-700">
            Rate: 1 ADA = {exchangeRate.toFixed(8)} ETH
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Recipient {toCrypto} Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm placeholder-gray-500"
              placeholder={toCrypto === 'ETH' ? '0x...' : 'addr_test...'}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Order...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-700 pt-4">
          ⚠️ Testnet Only: PreProd ADA • Sepolia ETH
        </div>
      </div>
    </div>
  );
}
