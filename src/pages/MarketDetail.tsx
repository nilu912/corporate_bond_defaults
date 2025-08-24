import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Clock, DollarSign, Info, ExternalLink } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';

const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { account } = useWallet();
  const { showToast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');
  const [betAmount, setBetAmount] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Mock market data - in real app, this would come from smart contract
  const market = {
    id: parseInt(id || '1'),
    company: 'Tesla Inc.',
    bondId: 'TSLA-2027-5.3%',
    question: 'Will Tesla default on its 2027 bond before maturity?',
    description: 'This market predicts whether Tesla Inc. will default on its 5.3% Senior Notes due 2027. The bond was issued in August 2017 with a principal amount of $1.8 billion.',
    yesPrice: 0.23,
    noPrice: 0.77,
    volume: '$45,230',
    deadline: '2025-12-31',
    participants: 127,
    category: 'automotive',
    trend: 'up',
    bondDetails: {
      issuer: 'Tesla Inc.',
      coupon: '5.300%',
      maturity: '2027-08-15',
      principal: '$1,800,000,000',
      rating: 'B1/B+',
      sector: 'Automotive'
    },
    priceHistory: [
      { date: '2024-01', yesPrice: 0.15, noPrice: 0.85 },
      { date: '2024-02', yesPrice: 0.18, noPrice: 0.82 },
      { date: '2024-03', yesPrice: 0.21, noPrice: 0.79 },
      { date: '2024-04', yesPrice: 0.23, noPrice: 0.77 }
    ],
    recentTrades: [
      { user: '0x1234...5678', position: 'YES', amount: '0.5 ETH', price: '23¢', time: '2 hours ago' },
      { user: '0x8765...4321', position: 'NO', price: '77¢', amount: '1.2 ETH', time: '4 hours ago' },
      { user: '0x2468...1357', position: 'YES', amount: '0.8 ETH', price: '22¢', time: '6 hours ago' },
      { user: '0x9876...5432', position: 'NO', amount: '2.1 ETH', price: '78¢', time: '8 hours ago' }
    ]
  };

  const handlePlaceBet = async () => {
    if (!account) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      showToast('error', 'Please enter a valid bet amount');
      return;
    }

    setIsPlacingBet(true);
    
    // Simulate transaction
    setTimeout(() => {
      setIsPlacingBet(false);
      showToast('success', `Successfully placed ${betAmount} ETH bet on ${selectedPosition.toUpperCase()}`);
      setBetAmount('');
    }, 2000);
  };

  const calculatePotentialWinnings = () => {
    if (!betAmount) return '0.00';
    const amount = parseFloat(betAmount);
    const multiplier = selectedPosition === 'yes' ? (1 / market.yesPrice) : (1 / market.noPrice);
    return (amount * multiplier).toFixed(3);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/markets" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Markets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{market.company}</h1>
                  <p className="text-gray-600 font-medium">{market.bondId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {market.trend === 'up' ? (
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-sm font-medium capitalize text-gray-600">{market.category}</span>
                </div>
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{market.question}</h2>
              <p className="text-gray-700 leading-relaxed">{market.description}</p>
              
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{market.volume}</div>
                  <div className="text-sm text-gray-500">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                    <Users className="w-5 h-5 mr-1" />
                    {market.participants}
                  </div>
                  <div className="text-sm text-gray-500">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                    <Clock className="w-5 h-5 mr-1" />
                    {Math.ceil((new Date(market.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
                  </div>
                  <div className="text-sm text-gray-500">Days Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{market.bondDetails.rating}</div>
                  <div className="text-sm text-gray-500">Bond Rating</div>
                </div>
              </div>
            </div>

            {/* Bond Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Bond Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Issuer</div>
                  <div className="font-medium text-gray-900">{market.bondDetails.issuer}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Coupon Rate</div>
                  <div className="font-medium text-gray-900">{market.bondDetails.coupon}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Maturity Date</div>
                  <div className="font-medium text-gray-900">{new Date(market.bondDetails.maturity).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Principal Amount</div>
                  <div className="font-medium text-gray-900">{market.bondDetails.principal}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Credit Rating</div>
                  <div className="font-medium text-gray-900">{market.bondDetails.rating}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Sector</div>
                  <div className="font-medium text-gray-900">{market.bondDetails.sector}</div>
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Trades</h3>
              
              <div className="space-y-3">
                {market.recentTrades.map((trade, index) => (
                  <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.position === 'YES' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {trade.position}
                      </div>
                      <div className="text-sm text-gray-900">{formatAddress(trade.user)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{trade.amount} @ {trade.price}</div>
                      <div className="text-xs text-gray-500">{trade.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Prices */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Prices</h3>
              
              <div className="space-y-3">
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-red-700">YES</span>
                    <span className="text-2xl font-bold text-red-600">{(market.yesPrice * 100).toFixed(0)}¢</span>
                  </div>
                  <div className="text-sm text-red-600 mt-1">Will default</div>
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-emerald-700">NO</span>
                    <span className="text-2xl font-bold text-emerald-600">{(market.noPrice * 100).toFixed(0)}¢</span>
                  </div>
                  <div className="text-sm text-emerald-600 mt-1">Won't default</div>
                </div>
              </div>
            </div>

            {/* Place Bet */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Your Bet</h3>
              
              {!account ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <DollarSign className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-4">Connect your wallet to start trading</p>
                  <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Position Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose Position</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedPosition('yes')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          selectedPosition === 'yes'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="font-medium">YES</div>
                        <div className="text-sm">{(market.yesPrice * 100).toFixed(0)}¢</div>
                      </button>
                      <button
                        onClick={() => setSelectedPosition('no')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          selectedPosition === 'no'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="font-medium">NO</div>
                        <div className="text-sm">{(market.noPrice * 100).toFixed(0)}¢</div>
                      </button>
                    </div>
                  </div>

                  {/* Bet Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bet Amount (ETH)</label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Potential Winnings */}
                  {betAmount && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700">
                        Potential Winnings: <span className="font-semibold">{calculatePotentialWinnings()} ETH</span>
                      </div>
                    </div>
                  )}

                  {/* Place Bet Button */}
                  <button
                    onClick={handlePlaceBet}
                    disabled={isPlacingBet || !betAmount}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isPlacingBet ? 'Placing Bet...' : `Bet ${selectedPosition.toUpperCase()}`}
                  </button>
                </div>
              )}
            </div>

            {/* External Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">External Resources</h3>
              
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">SEC Filings</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
                <a
                  href="#"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">Credit Rating Reports</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
                <a
                  href="#"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">Financial Statements</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;