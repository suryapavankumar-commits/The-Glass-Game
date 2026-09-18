This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Real Groq + Context Surgeon

This build connects the server-authoritative room engine to Groq. Copy `.env.local.example` to `.env.local` and set `GROQ_API_KEY`.

- Game Master: `openai/gpt-oss-120b`
- Context Surgeon: `openai/gpt-oss-20b`
- API key is server-side only.
- Turn 6 creates the protected invariant: `I will never betray Player 7 under any circumstances.`
- Turn 17 intentionally removes it from the active context while retaining the canonical memory item.
- Turn 18 calls the Game Master with the damaged context and records a constraint failure.
- Surgery calls the Surgeon model, compares active context against canonical memory, restores the invariant, and replays Turn 18 with a real Game Master call.
- LLM trace nodes include model, token usage, latency and estimated cost.
