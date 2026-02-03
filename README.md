# IPAM Frontend

Vue 3 frontend for the IPAM (IP Address Management) system.

## Prerequisites

- Node.js (v16 or higher)

## Installation

Install dependencies:

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The frontend will be available at:

- **URL:** http://localhost:3000
- **API Proxy:** All `/api/*` requests are proxied to `http://localhost:8000` (your gateway)

### Development Server Features

- **Hot Module Replacement (HMR)** - Changes reflect immediately
- **API Proxy** - `/api` requests are forwarded to `http://localhost:8000`
- **Port:** 3000 (configurable in `vite.config.js`)

## Production Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Configuration

### API Base URL

The API base URL is configured in `src/services/api.js`:

```javascript
const API_BASE_URL = "/api";
```

In development, Vite proxies `/api` to `http://localhost:8000` (configured in `vite.config.js`).

For production, ensure your web server (nginx, etc.) proxies `/api` to your gateway.

### Environment Variables

Currently, the frontend uses hardcoded API paths. To use environment variables:

1. Create `.env` file:

```env
VITE_API_BASE_URL=/api
VITE_GATEWAY_URL=http://localhost:8000
```

2. Update `vite.config.js` to use `import.meta.env.VITE_GATEWAY_URL`

3. Update `src/services/api.js` to use `import.meta.env.VITE_API_BASE_URL`

## Accessing the Audit Dashboard

1. **Login** as a user with `super_admin` role
2. Navigate to **Audit Dashboard** from the navigation menu (only visible to super-admins)

## Troubleshooting

### API requests failing

- Ensure your **gateway** is running on `http://localhost:8000`
- Check browser console for CORS or network errors

### Session tracking not working

- Ensure `X-Session-ID` header is being sent (check Network tab in DevTools)
- Verify the gateway forwards `X-Session-ID` to the IP management service
- Check that `audit_session_id` is stored in `localStorage` after login

### 401 errors on audit dashboard

- Verify you're logged in as a user with `role: 'super_admin'`
- Check that the backend `SuperAdminMiddleware` is working
