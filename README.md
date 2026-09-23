# OHC Dashboard

Lightweight local dashboard for the [OnlineHashCrack](https://www.onlinehashcrack.com/) Private API v2.

## Setup

1. Copy the env template and add your API key (keep it out of git):

   ```bash
   cp .env.example .env.local
   ```

2. Set `OHC_API_KEY` in `.env.local` to your `sk_…` key from OHC API management.

3. Install and run (after the Next.js app is scaffolded):

   ```bash
   npm install
   npm run dev
   ```

## Security

- The API key must stay server-side only (`.env.local`). Never expose it in client code or commits.
- Only submit hashes you own or are authorized to test. See [OHC Terms](https://www.onlinehashcrack.com/terms-conditions.php).
- Recovered cleartext is never returned by the API; `FOUND` tasks link to OHC for retrieval.

## License

Private / as configured by the repository owner.
