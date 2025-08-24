import { Link } from 'react-router-dom';
import { Search, Filter, TrendingUp, TrendingDown, Clock, Users, Loader2, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AptosClient, Types } from "aptos";
import { useWallet } from "../contexts/WalletContext";

// Types for the bond data structure matching your smart contract
interface BondInfo {
  id: string;
  issuer: string;
  total_raise: string;
  rate_bps: string;
  start_ts: string;
  end_ts: string;
  min_invest: string;
  raised: string;
  canceled: boolean;
  investor_count: string;
  company: string;
  bondId: string;
  question: string;
  description: string;
  deadline: string;
  category: string;
  couponRate: string;
  maturityDate: string;
  principalAmount: string;
  creditRating: string;
}

interface MarketData {
  id: number;
  company: string;
  bondId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  volumeRaw: number;
  deadline: string;
  participants: number;
  category: string;
  trend: 'up' | 'down';
  couponRate: string;
  creditRating: string;
  totalRaise: string;
  raised: string;
  isActive: boolean;
  issuer: string;
}

const MODULE_NAME = import.meta.env.VITE_API_MODULE_NAME;
const MODULE_ADDRESS = import.meta.env.VITE_API_MODULE_ADDRESS;
const NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";

const Markets: React.FC = () => {
  const { account } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('volume');
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchScope, setSearchScope] = useState<'contract' | 'user' | 'all'>('all');

  const client = new AptosClient(NODE_URL);

  useEffect(() => {
    fetchBondsFromAptos();
  }, [account, searchScope]);

  const fetchBondsFromContract = async (bondOwnerAddr: string): Promise<BondInfo[]> => {
    try {
      console.log(`Fetching bonds from: ${bondOwnerAddr}`);
      
      // Check if BondStore exists at this address
      const resources = await client.getAccountResources(bondOwnerAddr);
      const bondStoreResource = resources.find(resource => 
        resource.type.includes('BondStore') || resource.type.includes('prediction_market')
      );

      if (!bondStoreResource) {
        console.log(`No BondStore found at ${bondOwnerAddr}`);
        return [];
      }

      console.log(`Found BondStore at ${bondOwnerAddr}:`, bondStoreResource.type);

      const payload: Types.ViewRequest = {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_all_bonds`,
        type_arguments: [],
        arguments: [bondOwnerAddr],
      };

      const bondsResponse = await client.view(payload);
      console.log(`Bonds response from ${bondOwnerAddr}:`, bondsResponse);

      if (!bondsResponse || !Array.isArray(bondsResponse[0])) {
        return [];
      }

      return bondsResponse[0] as BondInfo[];
    } catch (err) {
      console.log(`Error fetching from ${bondOwnerAddr}:`, err);
      return [];
    }
  };

  const fetchBondsFromAptos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== Starting bond fetch ===');
      console.log('Contract Address:', MODULE_ADDRESS);
      console.log('Module Name:', MODULE_NAME);
      console.log('Search Scope:', searchScope);
      console.log('User Account:', account?.address);

      let allBonds: BondInfo[] = [];
      const searchAddresses: string[] = [];

      // Determine which addresses to search
      if (searchScope === 'contract' || searchScope === 'all') {
        searchAddresses.push(MODULE_ADDRESS);
      }
      
      if ((searchScope === 'user' || searchScope === 'all') && account?.address) {
        searchAddresses.push(account.address);
      }

      // If no specific scope and no user connected, search contract
      if (searchAddresses.length === 0) {
        searchAddresses.push(MODULE_ADDRESS);
      }

      console.log('Searching addresses:', searchAddresses);

      // Fetch bonds from all relevant addresses
      for (const address of searchAddresses) {
        const bonds = await fetchBondsFromContract(address);
        console.log(`Found ${bonds.length} bonds from ${address}`);
        allBonds = [...allBonds, ...bonds];
      }

      console.log(`Total bonds found: ${allBonds.length}`);
      console.log('All bonds data:', allBonds);

      if (allBonds.length === 0) {
        console.log('No bonds found anywhere');
        setMarkets([]);
        return;
      }

      // Transform bonds data to market data
      const transformedMarkets = allBonds
        .filter(bond => bond && !bond.canceled)
        .map((bond, index) => transformBondToMarket(bond, index));

      console.log('Transformed markets:', transformedMarkets);
      setMarkets(transformedMarkets);

    } catch (err: any) {
      console.error('Error fetching bonds:', err);
      
      let errorMessage = 'Failed to fetch bonds from blockchain';
      
      if (err.message?.includes('RESOURCE_NOT_FOUND')) {
        errorMessage = 'BondStore resource not found. Please create a bond first to initialize the store.';
      } else if (err.message?.includes('FUNCTION_NOT_FOUND')) {
        errorMessage = 'View function not found. Please check if the contract is deployed correctly.';
      } else if (err.message?.includes('Move abort')) {
        errorMessage = 'Contract execution failed. The contract may not be properly initialized.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const transformBondToMarket = (bond: BondInfo, index: number): MarketData => {
    // Calculate some mock prediction market data
    const mockYesPrice = 0.2 + (Math.random() * 0.6); // Random between 0.2-0.8
    const mockNoPrice = 1 - mockYesPrice;
    const mockVolume = Math.floor(Math.random() * 100000) + 10000;
    
    // Calculate time until deadline
    const deadlineTime = new Date(bond.deadline).getTime();
    const now = new Date().getTime();
    const isActive = deadlineTime > now && !bond.canceled;
    
    return {
      id: parseInt(bond.id),
      company: bond.company,
      bondId: bond.bondId,
      question: bond.question,
      yesPrice: mockYesPrice,
      noPrice: mockNoPrice,
      volume: `$${mockVolume.toLocaleString()}`,
      volumeRaw: mockVolume,
      deadline: bond.deadline,
      participants: parseInt(bond.investor_count) || 0,
      category: bond.category.toLowerCase(),
      trend: Math.random() > 0.5 ? 'up' : 'down',
      couponRate: bond.couponRate,
      creditRating: bond.creditRating,
      totalRaise: formatAPT(parseInt(bond.total_raise)), // Convert from octas to APT
      raised: formatAPT(parseInt(bond.raised)), // Convert from octas to APT
      isActive,
      issuer: bond.issuer
    };
  };

  const formatAPT = (octas: number): string => {
    const apt = octas / 100_000_000; // Convert octas to APT
    return `${apt.toFixed(6)} APT`;
  };

  const filteredMarkets = markets
    .filter(market => 
      market.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.bondId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.question.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(market => filterCategory === 'all' || market.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.volumeRaw - a.volumeRaw;
        case 'participants':
          return b.participants - a.participants;
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'raised':
          return parseFloat(b.raised.split(' ')[0]) - parseFloat(a.raised.split(' ')[0]);
        default:
          return 0;
      }
    });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'technology', label: 'Technology' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'retail', label: 'Retail' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'energy', label: 'Energy' },
    { value: 'travel', label: 'Travel & Hospitality' }
  ];

  // Debug information component
  const DebugInfo = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-medium text-blue-800 mb-2">Debug Information</h4>
      <div className="text-sm text-blue-700 space-y-1">
        <div>Contract Address: <code className="bg-blue-100 px-1 rounded text-xs">{MODULE_ADDRESS}</code></div>
        <div>Module Name: <code className="bg-blue-100 px-1 rounded text-xs">{MODULE_NAME}</code></div>
        <div>Connected Account: <code className="bg-blue-100 px-1 rounded text-xs">{account?.address || 'None'}</code></div>
        <div>Search Scope: <code className="bg-blue-100 px-1 rounded text-xs">{searchScope}</code></div>
        <div>Markets Found: <code className="bg-blue-100 px-1 rounded text-xs">{markets.length}</code></div>
        <div>Node URL: <code className="bg-blue-100 px-1 rounded text-xs">{NODE_URL}</code></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading bonds from Aptos blockchain...</p>
              <p className="text-gray-500 text-sm mt-2">Searching: {searchScope}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DebugInfo />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">Error Loading Bonds</h3>
            <p className="text-red-600 mb-4">{error}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">Troubleshooting Steps</h4>
              <ul className="text-yellow-700 text-sm space-y-1 list-disc ml-4">
                <li>Try creating a bond first if none exist</li>
                <li>Check different search scopes using the buttons above</li>
                <li>Verify the contract is deployed at the correct address</li>
                <li>Make sure your wallet is connected if searching user bonds</li>
              </ul>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={fetchBondsFromAptos}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
              <Link 
                to="/create-market" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Bond
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Prediction Markets</h1>
              <p className="text-gray-600">Discover and trade on corporate bond default predictions</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchBondsFromAptos}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <Link 
                to="/create-market" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Bond
              </Link>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Showing {markets.length} bond{markets.length !== 1 ? 's' : ''} from Aptos blockchain
          </div>
        </div>

        {/* Search Scope Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Search bonds from:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSearchScope('all')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  searchScope === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Accounts
              </button>
              <button
                onClick={() => setSearchScope('contract')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  searchScope === 'contract' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Contract Only
              </button>
              {account && (
                <button
                  onClick={() => setSearchScope('user')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    searchScope === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  My Bonds Only
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Show debug info in development */}
        {process.env.NODE_ENV === 'development' && <DebugInfo />}

        {/* Important Notice */}
        {markets.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-800 mb-1">
                  No Bonds Found
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  No bonds were found in the current search scope. This could mean:
                </p>
                <ul className="text-sm text-amber-700 list-disc ml-4 space-y-1">
                  <li>No bonds have been created yet</li>
                  <li>Bonds were created by a different account</li>
                  <li>The BondStore hasn't been initialized</li>
                  <li>You're searching in the wrong scope</li>
                </ul>
                <p className="text-sm text-amber-700 mt-3">
                  Try switching search scopes or create a new bond to get started.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {markets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search companies or bonds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="volume">Sort by Volume</option>
                <option value="participants">Sort by Participants</option>
                <option value="deadline">Sort by Deadline</option>
                <option value="raised">Sort by Amount Raised</option>
              </select>

              {/* Status Filter */}
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        )}

        {/* Markets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <div key={market.id} className={`bg-white rounded-lg shadow-sm border ${market.isActive ? 'border-gray-100' : 'border-red-200 bg-red-50'} hover:shadow-lg transition-shadow overflow-hidden`}>
              <div className="p-6">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-3">
                  {!market.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                  <span className="text-xs text-gray-500">ID: {market.id}</span>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{market.company}</h3>
                    <p className="text-sm text-gray-500">{market.bondId}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {market.couponRate} • {market.creditRating}
                    </p>
                    <p className="text-xs text-gray-400">
                      Issuer: {market.issuer.slice(0, 8)}...{market.issuer.slice(-6)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {market.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                {/* Question */}
                <p className="text-gray-700 mb-6 text-sm leading-relaxed line-clamp-3">{market.question}</p>

                {/* Funding Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Raised: {market.raised}</span>
                    <span>Target: {market.totalRaise}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((parseFloat(market.raised.split(' ')[0]) / parseFloat(market.totalRaise.split(' ')[0])) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-lg font-bold text-red-600">{(market.yesPrice * 100).toFixed(0)}¢</div>
                    <div className="text-xs text-red-700 font-medium">YES</div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-600">{(market.noPrice * 100).toFixed(0)}¢</div>
                    <div className="text-xs text-emerald-700 font-medium">NO</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{market.volume}</div>
                    <div className="text-xs text-gray-500">Volume</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center justify-center">
                      <Users className="w-3 h-3 mr-1" />
                      {market.participants}
                    </div>
                    <div className="text-xs text-gray-500">Investors</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center justify-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.max(0, Math.ceil((new Date(market.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}d
                    </div>
                    <div className="text-xs text-gray-500">Remaining</div>
                  </div>
                </div>

                {/* Trade Button */}
                <Link
                  to={`/market/${market.id}`}
                  className={`w-full py-3 px-4 rounded-lg transition-colors text-center block font-medium ${
                    market.isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={!market.isActive ? (e) => e.preventDefault() : undefined}
                >
                  {market.isActive ? 'Trade Now' : 'Expired'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMarkets.length === 0 && markets.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No markets found</h3>
            <p className="text-gray-500 mb-4">
              No bonds have been created yet or they're not in the current search scope
            </p>
            <div className="flex justify-center space-x-3">
              <Link 
                to="/create-market" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Bond
              </Link>
              <button
                onClick={() => setSearchScope('all')}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Search All Accounts
              </button>
            </div>
          </div>
        )}

        {/* No results after filtering */}
        {filteredMarkets.length === 0 && markets.length > 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching results</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Markets;