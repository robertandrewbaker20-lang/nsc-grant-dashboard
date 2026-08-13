# Natural State Council Grant Finder

Simple funding search for [Natural State Council](https://www.naturalstatecouncil.org/), Scouting America.

- Edit keywords, focus areas, geography, and funder types on the dashboard
- Run search: Grants.gov + xAI web search, then xAI fit scoring
- No login

## Local

```bash
cp .env.example .env.local
# add XAI_API_KEY
npm install
npm run dev
```

## Env

- `XAI_API_KEY` — xAI / SpaceXAI key (server-side only)
