# MAX Web Chat (GREEN-API)

A minimal browser client for sending and receiving text messages in the MAX messenger through [GREEN-API](https://green-api.com/v3/docs/api/) (MAX v3). There is no backend: the browser calls GREEN-API directly (the API allows CORS).

Built with Vite, React, TypeScript and the official MAX component library [`@maxhub/max-ui`](https://github.com/max-messenger/max-ui). It follows the system light/dark theme and switches to a single-pane layout on narrow screens.

## Setup

```sh
npm i && npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the Vitest unit tests |
| `npm run lint` | ESLint |

## Getting your credentials

Sign in to [console.green-api.com](https://console.green-api.com), open your MAX instance, and copy:

- **idInstance**: the instance number.
- **apiTokenInstance**: the instance API token.
- **apiUrl**: the API host shown next to the instance. The app fills in `https://{first 4 digits of idInstance}.api.green-api.com` for you; change it if the console shows something else.

The instance must be **authorized** (linked to a MAX account). The login form calls `getStateInstance` and only lets you in when the state is `authorized`.

### Required instance settings

In the instance settings in the console:

1. **Enable incoming message notifications** ("Receive notifications about incoming messages and files").
2. **Leave the webhook URL empty.** This app reads notifications with `receiveNotification` (HTTP polling), which GREEN-API refuses while a webhook URL is set. If you clear it, wait about 1 minute before trying again. The app shows a banner when it hits this error.

## How it works

- **Sending** is optimistic. The message appears right away as *sending*, then turns *sent* once `sendMessage` returns an `idMessage`, or *failed* with a Retry button.
- **Receiving** is a long-poll loop (`receiveNotification`, 20 s timeout). Every notification is acknowledged with `deleteNotification`, including event types the app ignores. Otherwise the queue would stall on it. Network errors retry with backoff (3 s, doubling, capped at 30 s). A 401/403 signs you out.
- **New chats** start from the **+** button: pick a country and enter the phone number. All 40 countries where MAX allows registration are listed (per MAX's 5 March 2026 expansion), and the number follows that country's rules: it is formatted as you type (Russia `999 123-45-67`), capped at the right length, and must be in one of the country's mobile ranges (MAX registers by SMS). A domestic trunk prefix such as Russia's `8` or Malaysia's `0` is dropped. Typing or pasting a full `+…` number selects the country automatically. The rules are generated from libphonenumber metadata and stored in `src/utils/countries.ts`, so there is no extra runtime dependency. The number is sent to `checkAccount` in international format (`+7 999 123-45-67` → `79991234567`). You can't start a chat with your own number: the app reads the signed-in account with `getAccountSettings` at login and rejects that number, or any number `checkAccount` resolves to your own chat. The footer shows which account you're signed in as. Messages from unknown senders create a chat automatically.

## Limitations

- **Messages are kept only for the session.** Credentials and history live in `sessionStorage`: they survive a page reload but are gone when the tab closes. Nothing is fetched from the server's history.
- **Use one tab per instance.** Each tab consumes the same notification queue, so two tabs (or another integration polling the same instance) steal each other's incoming messages.
- **Text only.** Incoming images, files, stickers, etc. are shown as placeholders such as `[imageMessage]`, and only text can be sent (up to 4000 characters, the `sendMessage` limit).
- **Numbers outside Russia and Belarus may be rejected by GREEN-API.** The app accepts all 40 MAX countries, but GREEN-API documents `checkAccount` only for `+7` and `+375` numbers. If it rejects a number, the new-chat form says so. MAX itself also only lets users from different countries message each other after both have added each other's numbers to their contacts.
- Only incoming messages from other people appear. Messages you send from the MAX app on your phone are not mirrored here.
- The API token is stored in `sessionStorage` in plain text, like any browser-only client. Use it on a device you trust.

## Project layout

```
src/
  api/          GREEN-API client (no React): createClient(), GreenApiError, types
  state/        reducer (pure), store (context + sessionStorage sync), parseNotification
  hooks/        usePolling (receive loop), useSendMessage (optimistic send)
  components/   LoginPage, Sidebar, NewChatForm, ChatList, ChatWindow, MessageList,
                MessageBubble, Composer, ConnectionStatus, ChatAvatar, icons
  utils/        phone normalization, time formatting
```

Unit tests cover the reducer, the notification parser and phone normalization (`src/**/*.test.ts`).
