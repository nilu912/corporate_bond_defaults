import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Users, DollarSign, ArrowRight, BarChart3 } from 'lucide-react';

const Home: React.FC = () => {
  const stats = [
    { label: 'Total Volume', value: '$2.4M', icon: DollarSign, change: '+12.5%' },
    { label: 'Active Markets', value: '24', icon: BarChart3, change: '+3' },
    { label: 'Total Users', value: '1,247', icon: Users, change: '+89' },
    { label: 'Accuracy Rate', value: '78.4%', icon: TrendingUp, change: '+2.1%' },
  ];

  const featuredMarkets = [
    {
      id: 1,
      company: 'Tesla Inc.',
      bondId: 'TSLA-2027-5.3%',
      question: 'Will Tesla default on its 2027 bond before maturity?',
      yesPrice: 0.23,
      noPrice: 0.77,
      volume: '$45K',
      deadline: '2025-12-31',
      participants: 127
    },
    {
      id: 2,
      company: 'WeWork Inc.',
      bondId: 'WE-2026-7.875%',
      question: 'Will WeWork default on its 2026 bond before maturity?',
      yesPrice: 0.68,
      noPrice: 0.32,
      volume: '$32K',
      deadline: '2026-08-15',
      participants: 89
    },
    {
      id: 3,
      company: 'AMC Entertainment',
      bondId: 'AMC-2025-10.5%',
      question: 'Will AMC default on its 2025 bond before maturity?',
      yesPrice: 0.45,
      noPrice: 0.55,
      volume: '$28K',
      deadline: '2025-06-30',
      participants: 156
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-600 rounded-full shadow-lg">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Predict Corporate Bond
              <span className="text-blue-600"> Defaults</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join the future of decentralized finance. Use collective intelligence to predict 
              corporate bond defaults and earn rewards for accurate predictions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/markets"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold flex items-center justify-center gap-2"
              >
                Explore Markets <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/create"
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold"
              >
                Create Market
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
                <div className="text-xs text-emerald-600 font-medium">{stat.change}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose BondPredict?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines blockchain technology with financial expertise to create 
              the most accurate prediction markets for bond defaults.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-emerald-100 rounded-full">
                  <Shield className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Decentralized & Secure</h3>
              <p className="text-gray-600">
                Built on blockchain technology ensuring transparency, immutability, and security 
                for all predictions and transactions.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-blue-100 rounded-full">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Data-Driven Insights</h3>
              <p className="text-gray-600">
                Access real-time market sentiment and historical data to make informed 
                predictions about corporate bond defaults.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-orange-100 rounded-full">
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Earn Rewards</h3>
              <p className="text-gray-600">
                Get rewarded for accurate predictions. The more precise your forecasts, 
                the higher your earnings from the prediction pools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Markets</h2>
              <p className="text-gray-600">Popular prediction markets with high activity</p>
            </div>
            <Link
              to="/markets"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              View All Markets
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredMarkets.map((market) => (
              <div key={market.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{market.company}</h3>
                      <p className="text-sm text-gray-500">{market.bondId}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{market.volume}</div>
                      <div className="text-xs text-gray-500">Volume</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6 text-sm leading-relaxed">{market.question}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">{(market.yesPrice * 100).toFixed(0)}¢</div>
                      <div className="text-xs text-red-700">YES</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <div className="text-lg font-bold text-emerald-600">{(market.noPrice * 100).toFixed(0)}¢</div>
                      <div className="text-xs text-emerald-700">NO</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>{market.participants} participants</span>
                    <span>Ends {new Date(market.deadline).toLocaleDateString()}</span>
                  </div>
                  
                  <Link
                    to={`/market/${market.id}`}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center block font-medium"
                  >
                    Trade Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;