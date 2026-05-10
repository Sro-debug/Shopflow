# ShopFlow — Quick Start Guide

## Option A: Docker (recommended — one command)

```bash
# 1. Clone / unzip the project
cd distributed-ecom-system

# 2. Set your Razorpay keys in backend/.env
#    (copy from backend/.env.example)
cp backend/.env.example backend/.env
nano backend/.env          # set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET + JWT_SECRET

# 3. Start everything
docker-compose -f backend/docker-compose.yml up --build

# 4. Seed the database (in a new terminal)
docker exec ecom_gateway node seed.js

# 5. Start the frontend
cd frontend/my_ecom
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Option B: Manual (no Docker)

### Prerequisites
- Node.js 18+ 
- MongoDB running locally on port 27017

### Step 1 — Install dependencies
```bash
npm run install:all        # from project root
# or manually:
cd backend && npm install
cd ../frontend/my_ecom && npm install
```

### Step 2 — Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env — minimum required:
#   MONGO_URI=mongodb://localhost:27017/ecom_distributed
#   JWT_SECRET=any_long_random_string
#   RAZORPAY_KEY_ID=rzp_test_...
#   RAZORPAY_KEY_SECRET=...

cp frontend/my_ecom/.env.example frontend/my_ecom/.env
# Edit frontend/.env:
#   VITE_RAZORPAY_KEY_ID=rzp_test_...   (same key_id as backend)
```

### Step 3 — Seed the database
```bash
cd backend && node seed.js
# Creates: admin@shopflow.com / admin123
#          user@shopflow.com  / user123
#          12 sample products
```

### Step 4 — Start gRPC cache nodes (3 terminals)
```bash
# Terminal 1
cd backend && CACHE_NODE_PORT=50052 node node/cacheNode.js

# Terminal 2
cd backend && CACHE_NODE_PORT=50053 node node/cacheNode.js

# Terminal 3
cd backend && CACHE_NODE_PORT=50054 node node/cacheNode.js
```

### Step 5 — Start API gateway
```bash
# Terminal 4
cd backend && npm run dev    # uses nodemon for hot-reload
# or: node gateway/gateway.js
```

### Step 6 — Start frontend
```bash
# Terminal 5
cd frontend/my_ecom && npm run dev
```

### Open **http://localhost:5173** 🚀

---

## Ports reference

| Service          | Port  |
|------------------|-------|
| Frontend (Vite)  | 5173  |
| API Gateway      | 5000  |
| Proxy            | 4000  |
| Cache Node 1     | 50052 |
| Cache Node 2     | 50053 |
| Cache Node 3     | 50054 |
| MongoDB          | 27017 |

---

## Razorpay test credentials

| Field       | Value                        |
|-------------|------------------------------|
| Card number | `4111 1111 1111 1111`        |
| Expiry      | Any future date              |
| CVV         | Any 3 digits                 |
| UPI         | `success@razorpay`           |

Get your test keys at: **https://dashboard.razorpay.com/app/keys**

---

## Useful endpoints

```
GET  http://localhost:5000/api/health        # system health + cache node status
GET  http://localhost:5000/api/cache/stats   # per-node LRU stats + hash ring distribution
```

---

## Troubleshooting

**"Missing required environment variables"**  
→ Copy `.env.example` to `.env` and fill in all values.

**"gRPC connection refused"**  
→ Start the 3 cache nodes before the gateway.

**MongoDB connection error**  
→ Make sure `mongod` is running: `brew services start mongodb-community` (macOS) or `sudo systemctl start mongod` (Linux).

**Razorpay "Invalid key" error**  
→ Make sure `VITE_RAZORPAY_KEY_ID` in frontend `.env` matches `RAZORPAY_KEY_ID` in backend `.env`.

**Port already in use**  
→ Change `GATEWAY_PORT` / `PROXY_PORT` / `CACHE_NODE_PORT` in `.env`.
