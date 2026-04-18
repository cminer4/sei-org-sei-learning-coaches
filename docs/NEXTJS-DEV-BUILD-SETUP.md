# Next.js dev and build hygiene

## Daily development

1. Run `npm run dev` and open the local URL Next prints (usually port 3000).
2. If the dev server acts stale or ports clash, stop the process (Ctrl+C), run `npm run build:clean` for production parity checks, or delete `.next` and run `npm run dev` again.

## Before you commit

Run:

```bash
npm run ensure:build
```

This runs lint and a full production build so type and route errors surface early.

## Webpack or cache oddities

If you see unexplained compile errors after upgrading dependencies:

1. Delete the `.next` directory.
2. Run `npm run build`.

On Vercel, use "Clear build cache" on redeploy if production builds fail with cache-related errors.
