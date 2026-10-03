# Deploy the public demo

Two Vercel projects and one Convex deployment. The PDF API is FastAPI on
Vercel. The fill wheels are about 22MB compressed and `Forms/` is 3.4MB, so
the function stays inside the size limit. Render is not required.

Deploy the API first, then Convex, then the web project. `API_URL` and
`ALLOWED_ORIGINS` need the other project's URL. No trailing slash on either.

`NEXT_PUBLIC_DEMO_ONLY` is fixed at web build time. Change it, then run
`vercel --prod` again.

## Web, Vercel

Project root `apps/web`. The repo is a bun workspace, so the install command
in `apps/web/vercel.json` runs `bun install` from the repository root.

```bash
cd apps/web
vercel --prod
```

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_DEMO_ONLY` | `1` |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/sections` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/sections` |
| `PDF_FILL_SECRET` | long random string, same value on the API and Convex |
| `API_URL` | `https://<api-project>.vercel.app` |
| `CLERK_WEBHOOK_SECRET` | Svix signing secret, only if account deletion is on |
| `CONVEX_DEPLOY_KEY` | deploy key for the deletion webhook, only if that route is on |

Leave Clerk and Convex unset and the demo pages still render. Sign-in then
shows "Auth is not configured". A production web server refuses fills until
`PDF_FILL_SECRET` is set.

## Convex

From `apps/web`:

```bash
npx convex deploy
npx convex env set DEMO_ONLY 1
npx convex env set PDF_FILL_SECRET <same value as the web server>
npx convex env set PDF_API_URL https://<api-project>.vercel.app
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<instance>.clerk.accounts.dev
npx convex env set SENSITIVE_ID_KEY "$(openssl rand -base64 32)"
npx convex env set SENSITIVE_ID_KEY_VERSION 1
```

`CLERK_JWT_ISSUER_DOMAIN` has no trailing slash. Skip the Clerk issuer only
when the deployment has no sign-in.

## API, Vercel

Project root `apps/api`. Vercel loads `app.main:app`. The install command
copies `Forms/*.pdf` into `forms/`, and `vercel.json` bundles that directory
with the function.

```bash
cd apps/api
vercel --prod
```

| Name | Value |
| --- | --- |
| `PDF_FILL_SECRET` | same value as the web server |
| `PDF_SERVICE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://<web-project>.vercel.app` |
| `PDF_RATE_LIMIT` | `60`, optional |
| `PDF_MAX_BODY_BYTES` | `1000000`, optional |

`PDF_SERVICE_ENV=production` rejects fills when `PDF_FILL_SECRET` is unset.
Hobby functions use the platform duration cap. A single I-130 fill is the
check that the cap is enough.
