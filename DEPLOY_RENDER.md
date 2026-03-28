# Render Deployment

This repo is ready to deploy to Render from GitHub as a single web service.

## What Render runs

- Build command: `npm run render-build`
- Start command: `npm start`
- Health check: `/api/health`

The backend serves the built frontend in production, so you do not need a separate frontend service or a separate API URL.

## Deploy steps

1. Push this repo to GitHub.
2. In Render, click `New +` -> `Blueprint`.
3. Select your GitHub repo.
4. Render will detect [`render.yaml`](./render.yaml) and create the web service automatically.
5. Wait for the deploy to finish, then open your Render URL.

## Included environment variables

[`render.yaml`](./render.yaml) already sets:

- `NODE_ENV=production`
- `TRUST_PROXY=true`
- `DATA_DIR=/opt/render/project/src/backend/data`
- `JWT_SECRET` as a generated secret
- `JWT_EXPIRES_IN=7d`

## Optional environment variables

You only need these if you want the extra features:

- `OPENAI_API_KEY` for AI notes suggestions
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`

If email variables are not set, the app stays functional and logs email actions instead of failing requests.

## Demo accounts

- `admin@jobtracker.com` / `Admin123!`
- `alex@example.com` / `password123`
- `sarah@example.com` / `password123`

## Important note about data persistence

This app currently uses a JSON file store at [`backend/data/dev-db.json`](./backend/data/dev-db.json).

That works on Render immediately, but on a free web service the filesystem is not durable across rebuilds or restarts. If you want your app data to persist long-term while still staying on Render, upgrade the service and mount a persistent disk at:

`/opt/render/project/src/backend/data`

The app is already wired to use that path through `DATA_DIR`.
