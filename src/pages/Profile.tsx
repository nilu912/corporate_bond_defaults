import React, { useState } from 'react';
import { User, TrendingUp, DollarSign, Award, Clock, BarChart3 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

const Profile: React.FC = () => {
  const { account, balance } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'history'>('overview');

  const userStats = {
    totalVolume: '$12,450',
    activeBets: 8,
    winRate: 73.2,
    totalProfit: '+$2,340',
    accuracy: 78.4,
    rank: 142
  };

  const activePositions = [
    {
      id: 1,
      company: 'Tesla Inc.',
      bondId: 'TSLA-2027-5.3%',
      position: 'NO',
      amount: '1.2 ETH',
      currentValue: '1.48 ETH',
      pnl: '+23.3%',
      deadline: '2025-12-31'
    },
    {
      id: 2,
      company: 'WeWork Inc.',
      bondId: 'WE-2026-7.875%',
      position: 'YES',
      amount: '0.8 ETH',
      currentValue: '0.74 ETH',
      pnl: '-7.5%',
      deadline: '2026-08-15'
    },
    {
      id: 3,
      company: 'AMC Entertainment',
      bondId: 'AMC-2025-10.5%',
      position: 'NO',
      amount: '2.1 ETH',
      currentValue: '2.31 ETH',
      pnl: '+10.0%',
      deadline: '2025-06-30'
    }
  ];

  const tradingHistory = [
    {
      id: 1,
      company: 'Netflix Inc.',
      bondId: 'NFLX-2025-4.875%',
      position: 'NO',
      amount: '1.5 ETH',
      result: 'Won',
      pnl: '+0.85 ETH',
      date: '2024-03-15'
    },
    {
      id: 2,
      company: 'Spotify',
      bondId: 'SPOT-2024-0%',
      position: 'YES',
      amount: '0.6 ETH',
      result: 'Lost',
      pnl: '-0.6 ETH',
      date: '2024-03-10'
    },
    {
      id: 3,
      company: 'Uber Technologies',
      bondId: 'UBER-2026-7.5%',
      position: 'NO',
      amount: '2.0 ETH',
      result: 'Won',
      pnl: '+1.2 ETH',
      date: '2024-03-05'
    }
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-gray-400 mb-6">
              <User className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">You need to connect your wallet to view your profile</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{formatAddress(account)}</h1>
                <p className="text-gray-600">Balance: {balance} ETH</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">{userStats.totalProfit}</div>
              <div className="text-sm text-gray-500">Total P&L</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">{userStats.totalVolume}</div>
            <div className="text-xs text-gray-500">Total Volume</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <BarChart3 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">{userStats.activeBets}</div>
            <div className="text-xs text-gray-500">Active Bets</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">{userStats.winRate}%</div>
            <div className="text-xs text-gray-500">Win Rate</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">{userStats.accuracy}%</div>
            <div className="text-xs text-gray-500">Accuracy</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">#{userStats.rank}</div>
            <div className="text-xs text-gray-500">Global Rank</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">127</div>
            <div className="text-xs text-gray-500">Days Active</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('positions')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'positions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Positions
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Trading History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recent Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last 7 days</span>
                        <span className="text-emerald-600 font-medium">+12.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last 30 days</span>
                        <span className="text-emerald-600 font-medium">+23.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">All time</span>
                        <span className="text-emerald-600 font-medium">+87.2%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Portfolio Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Positions</span>
                        <span className="font-medium">3.1 ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available Balance</span>
                        <span className="font-medium">{balance} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Portfolio</span>
                        <span className="font-medium">{(parseFloat(balance) + 3.1).toFixed(2)} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'positions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Positions</h3>
                <div className="space-y-4">
                  {activePositions.map((position) => (
                    <div key={position.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{position.company}</h4>
                          <p className="text-sm text-gray-500">{position.bondId}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          position.position === 'YES'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {position.position}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Invested</div>
                          <div className="font-medium">{position.amount}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Current Value</div>
                          <div className="font-medium">{position.currentValue}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">P&L</div>
                          <div className={`font-medium ${
                            position.pnl.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {position.pnl}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Deadline</div>
                          <div className="font-medium">{new Date(position.deadline).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading History</h3>
                <div className="space-y-4">
                  {tradingHistory.map((trade) => (
                    <div key={trade.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{trade.company}</h4>
                          <p className="text-sm text-gray-500">{trade.bondId}</p>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-xs font-medium mb-1 ${
                            trade.result === 'Won'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {trade.result}
                          </div>
                          <div className="text-sm text-gray-500">{new Date(trade.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Position</div>
                          <div className="font-medium">{trade.position}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Amount</div>
                          <div className="font-medium">{trade.amount}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">P&L</div>
                          <div className={`font-medium ${
                            trade.pnl.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {trade.pnl}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;