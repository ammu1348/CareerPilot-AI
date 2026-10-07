# CareerPilot AI frontend

React and Vite client for CareerPilot AI. For the complete setup, backend configuration, privacy behavior, and API documentation, see the [repository README](../README.md).

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
```

By default, Vite proxies `/api` to the backend at `http://127.0.0.1:8000`. Override the target with `API_PROXY_TARGET`, or point the browser directly at a hosted API with `VITE_API_URL`.
