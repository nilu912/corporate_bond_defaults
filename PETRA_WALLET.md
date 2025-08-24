# Petra Wallet Integration Guide

## Overview

This project integrates with the Petra Wallet, a popular wallet for the Aptos blockchain. The integration allows users to connect their wallet, view their account address, and disconnect when needed.

## Prerequisites

- Users must have the [Petra Wallet extension](https://petra.app/) installed in their browser
- The application must be running in a browser environment that supports browser extensions

## Features

- Connect to Petra Wallet
- Display connected account address
- Disconnect from wallet
- Auto-detect if wallet is already connected on page load

## Implementation Details

The wallet connection is implemented in the `Home.tsx` component. The integration uses the following key functions:

- `window.aptos.connect()`: Connects to the Petra wallet
- `window.aptos.disconnect()`: Disconnects from the wallet
- `window.aptos.isConnected()`: Checks if the wallet is already connected
- `window.aptos.account()`: Gets the current account information

## Type Definitions

Type definitions for the Petra wallet are defined in `pages/types/petra.ts`. These types ensure proper TypeScript support for the wallet integration.

## Usage

1. Install the Petra Wallet extension in your browser
2. Visit the application
3. Click the "Connect Petra Wallet" button
4. Approve the connection in the Petra Wallet popup
5. Your wallet address will be displayed and you can now interact with the application
6. To disconnect, click the "Disconnect Wallet" button

## Troubleshooting

If you encounter issues with the wallet connection:

1. Make sure the Petra Wallet extension is installed and enabled
2. Check if you're logged into your wallet
3. Try refreshing the page
4. Check the browser console for any error messages