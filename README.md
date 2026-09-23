# OHC Dashboard

Lightweight local dashboard for the [OnlineHashCrack](https://www.onlinehashcrack.com/) Private API v2.

## Features

- **Tasks** — list recovery jobs, status badges, FOUND → OHC link, pending tier/quota flags, 60s auto-refresh (pauses on 429)
- **Submit** — batch up to 50 hashes for a Hashcat `algo_mode`, with explicit authorization/terms confirmation
- **Identify** — suggest `algo_mode` candidates; one-click handoff to Submit
- **Wordlists** — list custom wordlists and storage quota

API calls are proxied through Next.js route handlers so your `sk_` key never reaches the browser.

## Setup

1. Copy the env template and add your API key:

   ```bash
   cp .env.example .env.local
   ```

2. Set `OHC_API_KEY` in `.env.local` to your `sk_…` key from OHC API management.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Security

- The API key must stay server-side only (`.env.local`). Never commit it or expose it in client code.
- Only submit hashes you own or are authorized to test. See [OHC Terms](https://www.onlinehashcrack.com/terms-conditions.php).
- Recovered cleartext is never returned by the API; `FOUND` tasks link to OHC for retrieval.
- If an API key was shared in chat or logs, rotate it in OHC API management.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · OHC Private API v2
