# Natural State Council Grant Finder

Simple funding search for [Natural State Council](https://www.naturalstatecouncil.org/), Scouting America.

- Results page: run search and review listings
- Search parameters tab: edit keywords, focus areas, geography, and funder types
- Grants.gov + xAI web search, then xAI fit scoring
- No login

## Local

Put the key in `.env.local` in this folder (git-ignored). Do not commit it.

```bash
cp .env.example .env.local
# XAI_API_KEY=xai-...
npm install
npm run dev
```

Production: set `XAI_API_KEY` in the Vercel project env (already set).
