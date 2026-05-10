# ShopFlow — Distributed E-Commerce System

A full-stack distributed e-commerce platform with gRPC cache nodes, consistent hashing, real-time WebSocket updates, and Razorpay payment integration.

---

## 🏗️ Architecture Overview

```
Browser (React + Redux)
        │
        ▼
   API Gateway (Express :5000)
        │         │          │
        │         │          └── WebSocket (Socket.IO)
        │         │
        │    Auth Routes (/api/auth)
        │    Product Routes (/api/products)
        │    Order Routes (/api/orders)
        │    Payment Routes (/api/payment)
        │
        ▼
Consistent Hash Ring
   ┌────┼────┐
   ▼    ▼    ▼
Cache1 Cache2 Cache3   ← gRPC LRU Cache Nodes
(50052)(50053)(50054)
        │
        ▼
    MongoDB
```

---

## 📁 Project Structure

```
distributed-ecom-system/
├── frontend/my_ecom/          # React + Vite frontend
│   └── src/
│       ├── components/        # All UI components
│       ├── redux/             # RTK store, slices
│       ├── services/          # Axios + Razorpay service layer
│       ├── socket/            # Socket.IO client
│       └── config/            # App config
│
└── backend/
    ├── proto/cache.proto      # gRPC proto definition
    ├── hashing/               # Consistent hash ring
    ├── node/                  # LRU cache + gRPC server
    ├── gateway/               # Main API gateway + routes
    ├── auth/                  # JWT auth routes
    ├── payment/               # Razorpay integration
    ├── websocket/             # Socket.IO server
    ├── proxy/                 # Lightweight reverse proxy
    ├── docker-compose.yml
    └── Dockerfile
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (test keys from [dashboard.razorpay.com](https://dashboard.razorpay.com))

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Edit with your keys
```

Edit `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/ecom_distributed
JWT_SECRET=your_secret_here
RAZORPAY_KEY_ID=rzp_test_XXXXXXXX
RAZORPAY_KEY_SECRET=your_secret
```

**Start all services (manual):**
```bash
# Terminal 1 — Cache Node 1
CACHE_NODE_PORT=50052 node node/cacheNode.js

# Terminal 2 — Cache Node 2
CACHE_NODE_PORT=50053 node node/cacheNode.js

# Terminal 3 — Cache Node 3
CACHE_NODE_PORT=50054 node node/cacheNode.js

# Terminal 4 — API Gateway
node gateway/gateway.js
```

**Or with Docker:**
```bash
docker-compose up --build
```

---

### 2. Frontend Setup

```bash
cd frontend/my_ecom
npm install
cp .env.example .env   # Edit VITE_RAZORPAY_KEY_ID
npm run dev
```

Edit `frontend/my_ecom/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXX
```

App runs at **http://localhost:5173**

---

## 💳 Razorpay Integration

The payment flow works in 4 steps:

1. **Create Order** — Backend creates a Razorpay order via `/api/payment/create-order`
2. **Checkout UI** — Razorpay's hosted checkout modal opens in the browser
3. **Verify** — Backend verifies HMAC-SHA256 signature via `/api/payment/verify`
4. **Confirm** — Order marked as paid; stock decremented; WebSocket event emitted

### Test Cards (Razorpay Test Mode)
| Card Number | Expiry | CVV |
|---|---|---|
| 4111 1111 1111 1111 | Any future | Any |
| 5267 3181 8797 5449 | Any future | Any |

UPI Test: `success@razorpay`

---

## 🔑 Key Features

| Feature | Details |
|---|---|
| **Distributed Cache** | 3 gRPC LRU nodes with consistent hashing |
| **Cache Routing** | Consistent hash ring with 150 virtual nodes |
| **Real-time** | Socket.IO — order status, notifications |
| **Auth** | JWT with bcrypt, Google OAuth support |
| **Payments** | Razorpay — create, verify, refund, webhook |
| **State** | Redux Toolkit — cart, user, products |
| **Persistence** | Cart in localStorage, JWT in localStorage |

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/oauth/google
GET  /api/auth/profile
PUT  /api/auth/profile
PUT  /api/auth/change-password
```

### Products
```
GET    /api/products?page&limit&category&search&sort
GET    /api/products/:id
GET    /api/products/meta/categories
POST   /api/products          (admin)
PUT    /api/products/:id      (admin)
DELETE /api/products/:id      (admin)
```

### Orders
```
POST /api/orders
GET  /api/orders/myorders
GET  /api/orders/:id
PUT  /api/orders/:id/pay
GET  /api/orders              (admin)
PUT  /api/orders/:id/status   (admin)
```

### Payment
```
POST /api/payment/create-order
POST /api/payment/verify
POST /api/payment/refund
GET  /api/payment/details/:paymentId
POST /api/payment/webhook
```

### System
```
GET /api/health
GET /api/cache/stats
```

---

## 🐳 Docker

```bash
cd backend
docker-compose up --build
```

Services started:
- `ecom_mongodb` — MongoDB on 27017
- `ecom_cache_1/2/3` — gRPC cache nodes on 50052/53/54
- `ecom_gateway` — API gateway on 5000
- `ecom_proxy` — Reverse proxy on 4000

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `GATEWAY_PORT` | API gateway port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret |
| `CACHE_NODES` | Comma-separated gRPC cache addresses |
| `CLIENT_URL` | Frontend URL for CORS |

### Frontend (`frontend/my_ecom/.env`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_WS_URL` | WebSocket server URL |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key (same as backend) |
