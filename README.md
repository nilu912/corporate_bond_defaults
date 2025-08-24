# BondPredict - Corporate Bond Market Platform

A decentralized platform for creating and managing corporate bonds built on the **Aptos blockchain** using **Move smart contracts**.

---

## 🚀 Features

- **On-chain Bond Markets**: Create and manage corporate bonds securely  
- **Smart Contract Integration**: Automated bond creation and management  
- **Petra Wallet Integration**: Seamless wallet connection and transaction management  
- **Real-time Bond Data**: Live issuance and activity tracking  
- **Responsive Design**: Optimized for desktop and mobile devices  
- **Professional UI/UX**: Financial-grade interface with clean data visualization  

---

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS  
- **Icons**: Lucide React  
- **Routing**: React Router DOM  
- **Blockchain**: Aptos, Move Smart Contracts  
- **Wallet**: Petra Wallet Integration  
- **Build Tool**: Vite  

---

## 📋 Prerequisites

- Node.js 16+  
- [Petra Wallet](https://petra.app/) browser extension  
- Basic understanding of cryptocurrency and the Aptos blockchain  

---

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🎯 Core Functionality

### Home Page
- Platform overview and statistics
- Featured bond listings
- Key performance metrics

### Markets
- Browse all available bonds
- Filter, search, and sort
- View issuance details and metadata

### Bond Detail
- Comprehensive bond information
- Issuer details and external resources
- View recent activity

### Create Bond
- Create new corporate bonds on-chain
- Set bond parameters and deadlines
- Bond information input (issuer, amount, rate, duration)
- Market creation fee (0.1 APT)

## 📊 Smart Contract Features

### Bond Creation
- Companies and bond identification
- Prediction questions and deadlines
- Automated pool management

## 🔐 Security Features

- Smart contract validation (Move language)
- Secure wallet integration (Petra)
- Input sanitization
- Error handling and user feedback

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
```

Deploy the `dist` folder to your preferred hosting service (Netlify, Vercel, etc.).

### Smart Contract Deployment

1. Compile the Move contract:
```bash
aptos move compile
```

2. Deploy to Aptos testnet:
```bash
aptos move publish --package-dir <your-package-path> --profile default
```

3. Update contract address in `src/utils/aptos.ts`

---

Built with ❤️ for the future of decentralized finance.# corporate_bond
