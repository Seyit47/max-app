# MAX Web Chat (GREEN-API)

A browser client for sending and receiving text messages in the MAX messenger through [GREEN-API](https://green-api.com/v3/docs/api/). It has no backend: the browser calls GREEN-API directly.

Built with React, TypeScript, Vite and the MAX UI component library [`@maxhub/max-ui`](https://github.com/max-messenger/max-ui).

## Running locally

Requires Node.js 22.12 or newer.

```sh
npm i
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173) and sign in with your instance's **idInstance**, **apiTokenInstance** and **apiUrl** from [console.green-api.com](https://console.green-api.com). The instance must be authorized, have incoming message notifications enabled, and have an empty webhook URL.

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Run the unit tests |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Run ESLint |
