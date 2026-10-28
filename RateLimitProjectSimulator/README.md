# PulseGuard — API Gateway Rate Limiting & Abuse Prevention Simulator

An interactive, production-grade **MERN Stack** simulation suite designed to demonstrate and visualize API rate limiting, sliding window log algorithms, token bucket mechanics, abuse detection, and API gateway reverse-proxy enforcement.

![Architecture: MERN](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-blue?style=for-the-badge)
![Status: Production Ready](https://img.shields.io/badge/Status-Operational-emerald?style=for-the-badge)

---

## 🌟 Core Features & Concepts

### 1. Rate Limiting (5 Requests / User / Minute by Default)
* Enforces strict per-user request quotas with configurable time windows.
* Blocks requests beyond the limit with **HTTP 429 Too Many Requests**.
* Implements standard RFC 6585 rate limiting response headers:
  * `X-RateLimit-Limit`: Maximum requests permitted per window.
  * `X-RateLimit-Remaining`: Slots left before throttling begins.
  * `X-RateLimit-Reset`: Millisecond Epoch timestamp when quota refreshes.
  * `Retry-After`: Exact seconds until the next request will be allowed.
  * `X-RateLimit-Algorithm`: Active rate limiting algorithm.

### 2. Supported Rate Limiting Algorithms
* **Sliding Window Log (Default)**: Keeps exact millisecond timestamps of incoming requests. Drops timestamps older than `now - windowMs`. Provides 100% boundary accuracy, eliminating the 2x edge-burst loophole of naive fixed windows.
* **Sliding Window Counter**: Smooth approximation combining current window count and previous window count with fractional weighting. Highly memory efficient $O(1)$.
* **Token Bucket**: Accumulates tokens at a constant refill rate $R$ up to capacity $B$. Accommodates bursts while strictly limiting sustained throughput.
* **Fixed Window Counter**: Classic discrete boundary counter (e.g., reset at the minute mark) demonstrating edge boundary vulnerability.

### 3. Abuse Prevention & Security Firewall
* **Rapid Micro-Burst Detection**: Flags potential DDoS flood attacks when a client dispatches $> 7$ requests within 350ms.
* **Consecutive 429 Auto-Quarantine**: Automatically places clients into a 45-second quarantine if they generate 6 consecutive throttled requests without respecting `Retry-After`.
* **Client Blacklist Console**: Allows administrators to view, add, and remove temporary or permanent IP / User / API Key bans with real-time countdown timers.
* **HTTP 403 Forbidden Gatekeeper**: Blocks blacklisted entities at the gateway edge before hitting upstream endpoints.

### 4. Interactive Live Dashboard & Real-Time Telemetry
* **Real-Time WebSockets (Socket.io)**: Instantly streams live traffic events to connected dashboards without polling lag.
* **Interactive Sliding Window Timeline**: Visual representation of the sliding $[T - 60s, T]$ interval with dynamic dots and quota slot allocation blocks.
* **Traffic Load Generator**: Buttons for single request dispatch, Rapid Burst (5x), Exceed Quota (8x), DDoS Flood (15x), and continuous background traffic loops.
* **Deep Request Inspector**: Modal to view request metadata, standard headers, and full JSON payloads.
* **Rule Manager**: In-memory and MongoDB persisted rate limit policies configurable per route.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 (Stable), Vite, Lucide Icons, Pure Vanilla CSS | Cyberpunk glassmorphism dashboard, animated sliding window canvas, real-time KPI metrics |
| **Backend** | Node.js (v22), Express 4 (Stable), Morgan, CORS, UUID | API Gateway middleware, rate limit algorithms, simulated target APIs, admin telemetry |
| **Database** | MongoDB / Mongoose with Automatic In-Memory Mongo Engine | Mongoose Document models for `RequestLog`, `RateLimitRule`, `BannedClient` with automatic fail-safe fallback |
| **Real-Time** | Socket.io 4.8 | Bidirectional event streaming for request ingress, quota changes, and security alerts |

---

## 🚀 Quick Start & Running Locally

### 1. Start the Backend API Gateway Server
```powershell
cd "d:\New folder\RateLimitProjectSimulator\server"
node src/index.js
```
* Backend runs on **`http://localhost:5000`**
* Target rate-limited APIs: `http://localhost:5000/api/v1/public/quotes`
* Admin telemetry APIs: `http://localhost:5000/api/admin/metrics`

### 2. Start the Frontend Dashboard
```powershell
cd "d:\New folder\RateLimitProjectSimulator\client"
npm run dev
```
* Frontend runs on **`http://localhost:3000`**

---

## 🧪 Terminal / cURL Verification

You can directly test rate limiting enforcement from your terminal or PowerShell:

```bash
# First 5 requests will return HTTP 200 OK
curl -i -X GET "http://localhost:5000/api/v1/public/quotes?userId=alice"

# 6th request within 60s will return HTTP 429 Too Many Requests
curl -i -X GET "http://localhost:5000/api/v1/public/quotes?userId=alice"
```

**Sample 429 Response:**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1728456034120
X-RateLimit-Algorithm: sliding-window-log
Retry-After: 35
Content-Type: application/json

{
  "error": "Too Many Requests",
  "statusCode": 429,
  "message": "Rate limit exceeded. Allowed: 5 requests per 60s.",
  "algorithm": "sliding-window-log",
  "limit": 5,
  "remaining": 0,
  "retryAfter": 35,
  "resetTime": 1728456034120,
  "clientId": "alice",
  "endpoint": "/api/v1/public/quotes"
}
```
