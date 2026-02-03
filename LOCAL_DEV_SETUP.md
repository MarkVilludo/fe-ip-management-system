# Local Development Setup (Without Docker)

This guide explains how to run the frontend and backend services locally for testing.

## Prerequisites

- Node.js (v16+)
- PHP 8.2+
- Composer
- SQLite (or MySQL if preferred)

## Configure Environment Variables

1. Copy the sample file and adjust it for your local setup:
   ```bash
   cp .env.example .env
   ```
2. Update the URLs inside `.env` if your containers/services expose different hosts or ports.
   - `VITE_AUTH_SERVICE_URL` – auth service or gateway handling `/api/auth/*`
   - `VITE_IP_SERVICE_URL` – IP management service that handles `/api/ip/*`
   - `VITE_GATEWAY_URL` – optional gateway/load balancer for the remaining `/api/*` routes
   - `VITE_API_BASE_URL` – keep `/api` to keep using the Vite proxy, or point directly to a backend URL when running without the dev server

## Running Services Locally

### 1. Auth Service (Port 8000)

```bash
cd ipam-auth-service
composer install
php artisan migrate
php artisan serve --port=8000
```

**Auth service runs on:** `http://localhost:8000`

### 2. IP Management Service (Port 8001)

```bash
cd ipam-ip-management-service
composer install
php artisan migrate
php artisan serve --port=8001
```

**IP service runs on:** `http://localhost:8001`

**Important:** Make sure `IP_SERVICE_URL` in `ipam-auth-service/.env` points to:

```env
IP_SERVICE_URL=http://127.0.0.1:8001
```

### 3. Frontend (Port 3000)

```bash
cd ipam-frontend
yarn install
yarn dev
```

**Frontend runs on:** `http://localhost:3000`

## How the Proxy Works

The Vite dev server proxies API requests:

| Frontend Request                            | Proxied To                               | Service      |
| ------------------------------------------- | ---------------------------------------- | ------------ |
| `http://localhost:3000/api/auth/login`      | `http://localhost:8000/api/auth/login`   | Auth Service |
| `http://localhost:3000/api/ip/ip-addresses` | `http://localhost:8001/api/ip-addresses` | IP Service   |
| `http://localhost:3000/api/ip/audit-logs`   | `http://localhost:8001/api/audit-logs`   | IP Service   |

**Note:** The `/api/ip/...` prefix is **stripped** when forwarding to the IP service (it expects `/api/...`).

## Testing the Setup

1. **Start all services:**

   - Terminal 1: `cd ipam-auth-service && php artisan serve --port=8000`
   - Terminal 2: `cd ipam-ip-management-service && php artisan serve --port=8001`
   - Terminal 3: `cd ipam-frontend && yarn dev`

2. **Open browser:** `http://localhost:3000`

3. **Test login:**

   - Register a new user or use existing credentials
   - Login should work and redirect to dashboard

4. **Check Network tab:**
   - You'll see requests to `localhost:3000/api/...`
   - These are proxied to the backend services automatically

## Troubleshooting

### 500 Error on Login

1. **Check auth service is running:**

   ```bash
   curl http://localhost:8000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"password"}'
   ```

2. **Check IP service is running:**

   ```bash
   curl http://localhost:8001/api/up
   ```

3. **Check auth service logs:**

   ```bash
   tail -f ipam-auth-service/storage/logs/laravel.log
   ```

4. **Verify JWT secret matches:**
   - Both services should use the same `JWT_SECRET` in their `.env` files

### CORS Errors

- The Vite proxy handles CORS automatically
- If you see CORS errors, check that the proxy is working (check Network tab → request should show `localhost:3000`)

### Session ID Not Working

- Check browser DevTools → Network → Headers
- Look for `X-Session-ID` header in requests
- Verify it's being sent (should be a UUID)

## Port Configuration

If you need to use different ports, update:

1. **Frontend `.env`** (`ipam-frontend/.env`):

   ```env
   VITE_AUTH_SERVICE_URL=http://127.0.0.1:YOUR_AUTH_PORT
   VITE_IP_SERVICE_URL=http://127.0.0.1:YOUR_IP_PORT
   VITE_GATEWAY_URL=http://127.0.0.1:YOUR_GATEWAY_PORT
   ```

2. **Auth service** (run with different port):

   ```bash
   php artisan serve --port=YOUR_AUTH_PORT
   ```

3. **IP service** (run with different port):

   ```bash
   php artisan serve --port=YOUR_IP_PORT
   ```

4. **Auth service .env** (`IP_SERVICE_URL`):
   ```env
   IP_SERVICE_URL=http://127.0.0.1:YOUR_IP_PORT
   ```
