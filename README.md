---
title: Smart Billing
emoji: 🛒
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Smart Retail Billing System

A full-stack mini project demonstrating a retail billing system with ML-based recommendations, concurrent transaction handling, and QR code verification.

## Tech Stack
- Frontend: React.js
- Backend: Node.js with Express
- Database: SQLite
- ML Module: Python (Apriori algorithm using mlxtend)

## Features
- **Multi-Role User Authentication**:
  - Customer Registration/Login
  - **Guest Login**: One-click bypass for quick store access.
  - **Owner Login & Dashboard**: Dedicated interface for managing the store inventory (add products, update stock/prices).
- Product listing with categories (Groceries, Sports, Medical, Electrical, Beauty)
- Filter products by category
- Shopping cart with quantity selector
- Checkout with SQL transactions
- **OTP-based QR Code verification** - Each purchase generates a unique 6-digit OTP embedded in QR
- ML-based product recommendations (shows after adding items to cart)
- Recommendations visible on browse products page
- Concurrent transaction handling with transactions
- Beautiful and responsive UI with modern CSS
- All prices in Indian Rupees (₹)

## Setup Instructions

### Prerequisites
- Node.js
- Python 3

### Backend Setup
1. Navigate to `backend` folder
2. Run `npm install`
3. Run `node init.js` to initialize the SQLite database
4. Run `npm start`

### Frontend Setup
1. Navigate to `frontend` folder
2. Run `npm install`
3. Run `npm run dev` (Vite proxies `/api` to the backend on port 5001)

### ML Setup
1. Navigate to `ml` folder
2. Run `pip install -r requirements.txt`

### Database
- The database is automatically initialized with sample data when running `init.js`.

## OTP & QR Code Verification System
- After each purchase, a unique 6-digit OTP is generated
- The OTP is encoded in the QR code along with Order ID and total amount
- At the gate verification page:
  - Scan the QR code to retrieve the OTP and order details
  - Or paste the QR data manually
  - Enter the OTP to confirm access
  - "Access Granted" message indicates successful verification

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/products
- POST /api/checkout
- POST /api/verify-qr
- POST /api/recommendations
- GET /api/health (status, start time and uptime; polled by the UI's status indicator)

## Deployment
Pushing to `main` runs `.github/workflows/huggingface.yml`, which force-pushes the repo to the
Hugging Face Space (`smartbill-keshu/me`). The Space builds the `Dockerfile` and serves the app on port 7860.
The workflow can also be started manually from the Actions tab ("Run workflow"); it deploys whichever branch you pick.

## OS Concepts Demonstrated
- Asynchronous processing
- Critical section (transaction handling)
- Race condition prevention with transactions
- Race condition prevention

## Folder Structure
```
smart-retail-billing-system/
├── backend/
│   ├── server.js
│   ├── init.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── App.jsx
│   └── package.json
├── ml/
│   ├── recommend.py
│   └── requirements.txt
├── database/
│   ├── schema.sql
│   └── smart_retail.db
└── README.md
```