import React, { useState } from "react";
import { Calendar, Info, DollarSign, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { useWallet } from "../contexts/WalletContext";
import { useToast } from "../contexts/ToastContext";
import { Types } from "aptos";

const moduleName = import.meta.env.VITE_API_MODULE_NAME;
const moduleAddress = import.meta.env.VITE_API_MODULE_ADDRESS;

const CreateMarket: React.FC = () => {
  const { account, wallet } = useWallet();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    company: "",
    bondId: "",
    question: "",
    description: "",
    deadline: "",
    category: "",
    couponRate: "",
    maturityDate: "",
    principalAmount: "",
    creditRating: "",
    // New fields for smart contract parameters
    totalRaise: "10", // Default 10 APT
    rateBps: "500", // Default 5% (500 basis points)
    minInvest: "0.0001", // Default minimum investment in APT
  });

  const [isCreating, setIsCreating] = useState(false);

  const categories = [
    { value: "", label: "Select Category" },
    { value: "technology", label: "Technology" },
    { value: "automotive", label: "Automotive" },
    { value: "entertainment", label: "Entertainment" },
    { value: "retail", label: "Retail" },
    { value: "real-estate", label: "Real Estate" },
    { value: "travel", label: "Travel & Hospitality" },
    { value: "energy", label: "Energy" },
    { value: "healthcare", label: "Healthcare" },
    { value: "financial", label: "Financial Services" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calcMaxInterest = (
    totalRaise: number,
    rateBps: number,
    startTs: number,
    endTs: number
  ): number => {
    const SECONDS_PER_YEAR = 31_536_000;
    const BPS_DENOM = 10_000;
    
    if (endTs <= startTs) {
      throw new Error("End timestamp must be after start timestamp");
    }
    
    const dur = endTs - startTs;
    const num = BigInt(totalRaise) * BigInt(rateBps) * BigInt(dur);
    const den = BigInt(SECONDS_PER_YEAR) * BigInt(BPS_DENOM);
    return Number(num / den);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet || !account) {
      showToast("error", "Please connect your wallet first");
      return;
    }

    // Validate required fields
    const requiredFields = [
      "company",
      "bondId", 
      "question",
      "deadline",
      "category",
      "totalRaise",
      "rateBps",
      "minInvest",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      showToast("error", "Please fill in all required fields");
      return;
    }

    // Validate numeric fields
    const totalRaiseAPT = parseFloat(formData.totalRaise);
    const rateBpsNum = parseInt(formData.rateBps);
    const minInvestAPT = parseFloat(formData.minInvest);

    if (isNaN(totalRaiseAPT) || totalRaiseAPT <= 0) {
      showToast("error", "Total raise must be a positive number");
      return;
    }

    if (isNaN(rateBpsNum) || rateBpsNum <= 0 || rateBpsNum > 10000) {
      showToast("error", "Interest rate must be between 1-10000 basis points (0.01%-100%)");
      return;
    }

    if (isNaN(minInvestAPT) || minInvestAPT <= 0) {
      showToast("error", "Minimum investment must be a positive number");
      return;
    }

    setIsCreating(true);

    try {
      // Calculate timestamps
      const currentTime = Math.floor(Date.now() / 1000);
      const startTs = currentTime + 60; // Start 1 minute from now
      const deadlineDate = new Date(formData.deadline);
      const endTs = Math.floor(deadlineDate.getTime() / 1000);

      // Validate timestamps
      if (endTs <= startTs) {
        throw new Error("Deadline must be in the future");
      }

      // Convert to octas (1 APT = 100,000,000 octas)
      const totalRaise = Math.floor(totalRaiseAPT * 100_000_000);
      const minInvest = Math.floor(minInvestAPT * 100_000_000);

      // Calculate required interest
      const interestAmount = calcMaxInterest(totalRaise, rateBpsNum, startTs, endTs);
      
      // Show interest requirement to user
      const interestInAPT = (interestAmount / 100_000_000).toFixed(6);
      showToast("info", `Interest reserve required: ${interestInAPT} APT`);
      
      console.log("Bond parameters:", {
        totalRaise,
        rateBps: rateBpsNum,
        startTs,
        endTs,
        minInvest,
        interestAmount,
        interestInAPT,
        startDate: new Date(startTs * 1000).toISOString(),
        endDate: new Date(endTs * 1000).toISOString(),
        duration: `${Math.floor((endTs - startTs) / 86400)} days`
      });

      // Try to initialize module first (optional)
      try {
        showToast("info", "Initializing module...");
        const initPayload: Types.TransactionPayload = {
          type: "entry_function_payload",
          function: `${moduleAddress}::${moduleName}::init_modules`,
          type_arguments: [],
          arguments: [],
        };

        await wallet.signAndSubmitTransaction({ payload: initPayload });
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("Module initialized successfully");
      } catch (initError: any) {
        console.warn("Module initialization failed (continuing anyway):", initError);
        // Continue - module might already be initialized
      }

      // Create bond transaction payload
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::${moduleName}::create_bond`,
        type_arguments: [],
        arguments: [
          totalRaise,
          rateBpsNum,
          startTs,
          endTs,
          minInvest,
          interestAmount,
          formData.company,
          formData.bondId,
          formData.question,
          formData.description || "",
          formData.deadline,
          formData.category,
          formData.couponRate || "0",
          formData.maturityDate || "",
          formData.principalAmount || "0",
          formData.creditRating || "B1",
        ],
      };

      console.log("Transaction payload:", payload);

      // Sign and submit transaction
      showToast("info", "Please approve the transaction in your wallet...");
      const response = await wallet.signAndSubmitTransaction({ payload });
      
      if (!response?.hash) {
        throw new Error("No transaction hash received");
      }

      showToast("info", "Transaction submitted. Waiting for confirmation...");
      
      // Simple wait for devnet
      await new Promise(resolve => setTimeout(resolve, 5000));

      showToast("success", `Bond market created successfully! TX: ${response.hash}`);
      console.log(`Transaction hash: ${response.hash}`);

      // Reset form
      setFormData({
        company: "",
        bondId: "",
        question: "",
        description: "",
        deadline: "",
        category: "",
        couponRate: "",
        maturityDate: "",
        principalAmount: "",
        creditRating: "",
        totalRaise: "10",
        rateBps: "500",
        minInvest: "0.0001",
      });

    } catch (error: any) {
      console.error("Transaction failed:", error);
      
      // Better error handling
      let errorMessage = "Transaction failed";
      if (error.message?.includes("INSUFFICIENT_BALANCE") || error.message?.includes("insufficient")) {
        errorMessage = `Insufficient balance. You need more APT to cover the interest reserve (${interestInAPT} APT).`;
      } else if (error.message?.includes("invalid_argument")) {
        errorMessage = "Invalid parameters. Please check your input values.";
      } else if (error.message?.includes("RESOURCE_ALREADY_EXISTS")) {
        errorMessage = "Module resource conflict. Please try again.";
      } else if (error.message?.includes("end_ts > start_ts")) {
        errorMessage = "Invalid timestamps. Please ensure deadline is in the future.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast("error", errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate estimated interest requirement in real-time
  const getEstimatedInterest = () => {
    if (formData.totalRaise && formData.rateBps && formData.deadline) {
      try {
        const totalRaiseOctas = parseFloat(formData.totalRaise) * 100_000_000;
        const rateBps = parseInt(formData.rateBps);
        const currentTime = Math.floor(Date.now() / 1000);
        const deadlineTs = Math.floor(new Date(formData.deadline).getTime() / 1000);
        
        if (deadlineTs > currentTime) {
          const interest = calcMaxInterest(totalRaiseOctas, rateBps, currentTime + 60, deadlineTs);
          return (interest / 100_000_000).toFixed(6);
        }
      } catch (e) {
        // Ignore calculation errors during input
      }
    }
    return "0.000000";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Bond Market
          </h1>
          <p className="text-gray-600">
            Set up a new market for corporate bond investments on Aptos Devnet
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                Devnet Notice
              </h3>
              <p className="text-sm text-amber-700">
                You're creating a bond market on Aptos Devnet. Make sure you have sufficient devnet APT 
                to cover the interest reserve. The required amount will be calculated based on your parameters.
              </p>
            </div>
          </div>
        </div>

        {/* Live Interest Calculator */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800 mb-1">
                Estimated Interest Reserve
              </h3>
              <p className="text-sm text-green-700">
                Based on current parameters: <strong>{getEstimatedInterest()} APT</strong>
              </p>
            </div>
          </div>
        </div>

        {!account ? (
          /* Connect Wallet Prompt */
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-gray-400 mb-6">
              <DollarSign className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              You need to connect your wallet to create bond markets
            </p>
          </div>
        ) : (
          /* Create Market Form */
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="e.g., Tesla Inc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bond ID *
                  </label>
                  <input
                    type="text"
                    name="bondId"
                    value={formData.bondId}
                    onChange={handleInputChange}
                    placeholder="e.g., TSLA-2027-5.3%"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Question *
                  </label>
                  <input
                    type="text"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    placeholder="e.g., Will Tesla's bond provide stable returns?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Provide additional context about this bond investment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Bond Parameters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Bond Parameters
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Raise (APT) *
                  </label>
                  <input
                    type="number"
                    name="totalRaise"
                    value={formData.totalRaise}
                    onChange={handleInputChange}
                    placeholder="10"
                    step="0.000001"
                    min="0.000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Amount to raise in APT tokens</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (Basis Points) *
                  </label>
                  <input
                    type="number"
                    name="rateBps"
                    value={formData.rateBps}
                    onChange={handleInputChange}
                    placeholder="500"
                    min="1"
                    max="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">500 BPS = 5% annually</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Investment (APT) *
                  </label>
                  <input
                    type="number"
                    name="minInvest"
                    value={formData.minInvest}
                    onChange={handleInputChange}
                    placeholder="0.0001"
                    step="0.000001"
                    min="0.000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum amount investors can invest</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Market Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Market Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Deadline *
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} // Tomorrow
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bond Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Bond Details (Optional)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coupon Rate
                  </label>
                  <input
                    type="text"
                    name="couponRate"
                    value={formData.couponRate}
                    onChange={handleInputChange}
                    placeholder="e.g., 5.300%"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maturity Date
                  </label>
                  <input
                    type="date"
                    name="maturityDate"
                    value={formData.maturityDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Principal Amount
                  </label>
                  <input
                    type="text"
                    name="principalAmount"
                    value={formData.principalAmount}
                    onChange={handleInputChange}
                    placeholder="e.g., $1,800,000,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Rating
                  </label>
                  <input
                    type="text"
                    name="creditRating"
                    value={formData.creditRating}
                    onChange={handleInputChange}
                    placeholder="e.g., B1/B+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {isCreating ? "Creating Bond Market..." : "Create Bond Market"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateMarket;

// import React, { useState } from "react";
// import { Calendar, Info, DollarSign, Clock, AlertCircle } from "lucide-react";
// import { useWallet } from "../contexts/WalletContext";
// import { useToast } from "../contexts/ToastContext";
// import { Types } from "aptos";

// const moduleName = import.meta.env.VITE_API_MODULE_NAME;
// const moduleAddress = import.meta.env.VITE_API_MODULE_ADDRESS;

// const CreateMarket: React.FC = () => {
//   const { account, wallet } = useWallet();
//   const { showToast } = useToast();

//   const [formData, setFormData] = useState({
//     company: "",
//     bondId: "",
//     question: "",
//     description: "",
//     deadline: "",
//     category: "",
//     couponRate: "",
//     maturityDate: "",
//     principalAmount: "",
//     creditRating: "",
//   });

//   const [isCreating, setIsCreating] = useState(false);

//   const categories = [
//     { value: "", label: "Select Category" },
//     { value: "technology", label: "Technology" },
//     { value: "automotive", label: "Automotive" },
//     { value: "entertainment", label: "Entertainment" },
//     { value: "retail", label: "Retail" },
//     { value: "real-estate", label: "Real Estate" },
//     { value: "travel", label: "Travel & Hospitality" },
//     { value: "energy", label: "Energy" },
//     { value: "healthcare", label: "Healthcare" },
//     { value: "financial", label: "Financial Services" },
//   ];

//   const handleInputChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const calcMaxInterest = (
//     totalRaise: number,
//     rateBps: number,
//     startTs: number,
//     endTs: number
//   ): number => {
//     const SECONDS_PER_YEAR = 31_536_000;
//     const BPS_DENOM = 10_000;
    
//     if (endTs <= startTs) {
//       throw new Error("End timestamp must be after start timestamp");
//     }
    
//     const dur = endTs - startTs;
//     const num = BigInt(totalRaise) * BigInt(rateBps) * BigInt(dur);
//     const den = BigInt(SECONDS_PER_YEAR) * BigInt(BPS_DENOM);
//     return Number(num / den);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!wallet || !account) {
//       showToast("error", "Please connect your wallet first");
//       return;
//     }

//     // Validate required fields
//     const requiredFields = [
//       "company",
//       "bondId", 
//       "question",
//       "deadline",
//       "category",
//     ];
//     const missingFields = requiredFields.filter(
//       (field) => !formData[field as keyof typeof formData]
//     );

//     if (missingFields.length > 0) {
//       showToast("error", "Please fill in all required fields");
//       return;
//     }

//     setIsCreating(true);

//     try {
//       // Calculate timestamps
//       const currentTime = Math.floor(Date.now() / 1000);
//       const startTs = currentTime + 60; // Start 1 minute from now
//       const deadlineDate = new Date(formData.deadline);
//       const endTs = Math.floor(deadlineDate.getTime() / 1000);

//       // Validate timestamps
//       if (endTs <= startTs) {
//         throw new Error("Deadline must be in the future");
//       }

//       // Bond parameters
//       const totalRaise = 1_000_000_000; // 10 APT in octas
//       const rateBps = 500; // 5% annual rate
//       const minInvest = 10_000; // 0.0001 APT minimum investment

//       // Calculate required interest
//       const interestAmount = calcMaxInterest(totalRaise, rateBps, startTs, endTs);
      
//       // Show interest requirement to user
//       const interestInAPT = (interestAmount / 100_000_000).toFixed(6);
//       showToast("info", `Interest reserve required: ${interestInAPT} APT`);
      
//       console.log("Bond parameters:", {
//         totalRaise,
//         rateBps,
//         startTs,
//         endTs,
//         minInvest,
//         interestAmount,
//         interestInAPT,
//         startDate: new Date(startTs * 1000).toISOString(),
//         endDate: new Date(endTs * 1000).toISOString(),
//         duration: `${Math.floor((endTs - startTs) / 86400)} days`
//       });

//       // Try to initialize module first (optional)
//       try {
//         showToast("info", "Initializing module...");
//         const initPayload: Types.TransactionPayload = {
//           type: "entry_function_payload",
//           function: `${moduleAddress}::${moduleName}::init_modules`,
//           type_arguments: [],
//           arguments: [],
//         };

//         await wallet.signAndSubmitTransaction({ payload: initPayload });
//         await new Promise(resolve => setTimeout(resolve, 3000));
//         console.log("Module initialized successfully");
//       } catch (initError: any) {
//         console.warn("Module initialization failed (continuing anyway):", initError);
//         // Continue - module might already be initialized
//       }

//       // Create bond transaction payload
//       const payload: Types.TransactionPayload = {
//         type: "entry_function_payload",
//         function: `${moduleAddress}::${moduleName}::create_bond`,
//         type_arguments: [],
//         arguments: [
//           totalRaise.toString(),
//           rateBps.toString(),
//           startTs.toString(),
//           endTs.toString(),
//           minInvest.toString(),
//           interestAmount.toString(),
//           formData.company,
//           formData.bondId,
//           formData.question,
//           formData.description || "",
//           formData.deadline,
//           formData.category,
//           formData.couponRate || "0",
//           formData.maturityDate || "",
//           formData.principalAmount || "0",
//           formData.creditRating || "B1",
//         ],
//       };

//       console.log("Transaction payload:", payload);

//       // Sign and submit transaction
//       showToast("info", "Please approve the transaction in your wallet...");
//       const response = await wallet.signAndSubmitTransaction({ payload });
      
//       if (!response?.hash) {
//         throw new Error("No transaction hash received");
//       }

//       showToast("info", "Transaction submitted. Waiting for confirmation...");
      
//       // Simple wait for devnet
//       await new Promise(resolve => setTimeout(resolve, 5000));

//       showToast("success", `Bond market created successfully! TX: ${response.hash}`);
//       console.log(`Transaction hash: ${response.hash}`);

//       // Reset form
//       setFormData({
//         company: "",
//         bondId: "",
//         question: "",
//         description: "",
//         deadline: "",
//         category: "",
//         couponRate: "",
//         maturityDate: "",
//         principalAmount: "",
//         creditRating: "",
//       });

//     } catch (error: any) {
//       console.error("Transaction failed:", error);
      
//       // Better error handling
//       let errorMessage = "Transaction failed";
//       if (error.message?.includes("INSUFFICIENT_BALANCE") || error.message?.includes("insufficient")) {
//         errorMessage = `Insufficient balance. You need more APT to cover the interest reserve (${(calcMaxInterest(1_000_000_000, 500, Math.floor(Date.now() / 1000) + 60, Math.floor(new Date(formData.deadline).getTime() / 1000)) / 100_000_000).toFixed(6)} APT).`;
//       } else if (error.message?.includes("invalid_argument")) {
//         errorMessage = "Invalid parameters. Please check your input values.";
//       } else if (error.message?.includes("RESOURCE_ALREADY_EXISTS")) {
//         errorMessage = "Module resource conflict. Please try again.";
//       } else if (error.message?.includes("end_ts > start_ts")) {
//         errorMessage = "Invalid timestamps. Please ensure deadline is in the future.";
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       showToast("error", errorMessage);
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Create Bond Market
//           </h1>
//           <p className="text-gray-600">
//             Set up a new market for corporate bond investments on Aptos Devnet
//           </p>
//         </div>

//         {/* Warning Box */}
//         <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
//           <div className="flex items-start">
//             <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
//             <div>
//               <h3 className="text-sm font-medium text-amber-800 mb-1">
//                 Devnet Notice
//               </h3>
//               <p className="text-sm text-amber-700">
//                 You're creating a bond market on Aptos Devnet. Make sure you have sufficient devnet APT 
//                 to cover the interest reserve. The required amount will be calculated based on your deadline.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Bond Parameters Info */}
//         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
//           <div className="flex items-start">
//             <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
//             <div>
//               <h3 className="text-sm font-medium text-blue-800 mb-1">
//                 Bond Parameters
//               </h3>
//               <ul className="text-sm text-blue-700 space-y-1">
//                 <li>• Network: Aptos Devnet</li>
//                 <li>• Total Raise: 10 APT (1,000,000,000 octas)</li>
//                 <li>• Interest Rate: 5% annually (500 BPS)</li>
//                 <li>• Minimum Investment: 0.0001 APT (10,000 octas)</li>
//                 <li>• Interest reserve calculated dynamically based on deadline</li>
//               </ul>
//             </div>
//           </div>
//         </div>

//         {!account ? (
//           /* Connect Wallet Prompt */
//           <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
//             <div className="text-gray-400 mb-6">
//               <DollarSign className="w-16 h-16 mx-auto" />
//             </div>
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">
//               Connect Your Wallet
//             </h2>
//             <p className="text-gray-600 mb-6">
//               You need to connect your wallet to create bond markets
//             </p>
//           </div>
//         ) : (
//           /* Create Market Form */
//           <form onSubmit={handleSubmit} className="space-y-8">
//             {/* Basic Information */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
//                 <Info className="w-5 h-5 mr-2" />
//                 Basic Information
//               </h2>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Company Name *
//                   </label>
//                   <input
//                     type="text"
//                     name="company"
//                     value={formData.company}
//                     onChange={handleInputChange}
//                     placeholder="e.g., Tesla Inc."
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Bond ID *
//                   </label>
//                   <input
//                     type="text"
//                     name="bondId"
//                     value={formData.bondId}
//                     onChange={handleInputChange}
//                     placeholder="e.g., TSLA-2027-5.3%"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Investment Question *
//                   </label>
//                   <input
//                     type="text"
//                     name="question"
//                     value={formData.question}
//                     onChange={handleInputChange}
//                     placeholder="e.g., Will Tesla's bond provide stable returns?"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Description
//                   </label>
//                   <textarea
//                     name="description"
//                     value={formData.description}
//                     onChange={handleInputChange}
//                     rows={3}
//                     placeholder="Provide additional context about this bond investment..."
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Market Settings */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
//                 <Clock className="w-5 h-5 mr-2" />
//                 Bond Settings
//               </h2>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Investment Deadline *
//                   </label>
//                   <input
//                     type="date"
//                     name="deadline"
//                     value={formData.deadline}
//                     onChange={handleInputChange}
//                     min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} // Tomorrow
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Category *
//                   </label>
//                   <select
//                     name="category"
//                     value={formData.category}
//                     onChange={handleInputChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   >
//                     {categories.map((category) => (
//                       <option key={category.value} value={category.value}>
//                         {category.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* Bond Details */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
//                 <Calendar className="w-5 h-5 mr-2" />
//                 Bond Details (Optional)
//               </h2>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Coupon Rate
//                   </label>
//                   <input
//                     type="text"
//                     name="couponRate"
//                     value={formData.couponRate}
//                     onChange={handleInputChange}
//                     placeholder="e.g., 5.300%"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Maturity Date
//                   </label>
//                   <input
//                     type="date"
//                     name="maturityDate"
//                     value={formData.maturityDate}
//                     onChange={handleInputChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Principal Amount
//                   </label>
//                   <input
//                     type="text"
//                     name="principalAmount"
//                     value={formData.principalAmount}
//                     onChange={handleInputChange}
//                     placeholder="e.g., $1,800,000,000"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Credit Rating
//                   </label>
//                   <input
//                     type="text"
//                     name="creditRating"
//                     value={formData.creditRating}
//                     onChange={handleInputChange}
//                     placeholder="e.g., B1/B+"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Submit Button */}
//             <div className="flex justify-end">
//               <button
//                 type="submit"
//                 disabled={isCreating}
//                 className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
//               >
//                 {isCreating ? "Creating Bond Market..." : "Create Bond Market"}
//               </button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CreateMarket;