<!--
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
-->

# Business Messaging Sample Tech Provider App

A [Next.js](https://nextjs.org/) reference application that demonstrates how tech providers can integrate with Meta's [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started). It covers the full lifecycle — onboarding businesses via Embedded Signup, managing WhatsApp Business Accounts, sending and receiving messages, and handling webhooks.

## Features

- **Embedded Signup** — Onboard SMBs with Facebook Login for Business (multiple ES versions supported)
- **WABA Management** — View and manage WhatsApp Business Accounts, phone numbers, and registration
- **Messaging Inbox** — Send and receive WhatsApp messages in real time via Ably WebSockets
- **Template Messaging** — Send pre-approved template messages (paid messaging)
- **Webhook Viewer** — Debug tool showing all incoming webhook payloads
- **Asset Management** — View shared Pages, Ad Accounts, Datasets, Catalogs, and Instagram Accounts
- **Authentication** — Secure login via Auth0

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) with [React 19](https://react.dev/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Auth | [Auth0](https://auth0.com/) (`@auth0/nextjs-auth0` v4) |
| Database | [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (Neon) |
| Real-time | [Ably](https://ably.com/) (WebSocket-based live updates) |
| Deployment | [Vercel](https://vercel.com/) |

## Prerequisites

- **Node.js 18.18+** (required by Next.js 15)
- An [Ably](https://ably.com/) account and app
- An [Auth0](https://auth0.com/) account and application
- A [Meta Developer](https://developers.facebook.com/) account and app

## Quick Start — Deploy to Vercel

### 1. Deploy

Click the button below to deploy to a new Vercel project. The flow will prompt you to fork the repo, connect a Neon Postgres database, and set environment variables.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffbsamples%2Fbusiness-messaging-sample-tech-provider-app&env=ABLY_KEY,APP_BASE_URL,AUTH0_DOMAIN,AUTH0_CLIENT_ID,AUTH0_CLIENT_SECRET,AUTH0_SECRET,FB_APP_ID,FB_APP_SECRET,FB_GRAPH_API_VERSION,FB_REG_PIN,FB_VERIFY_TOKEN,TP_CONTACT_EMAIL&envDescription=Variables%20to%20configure%20the%20app&envLink=https%3A%2F%2Fgithub.com%2Ffbsamples%2Fbusiness-messaging-sample-tech-provider-app%23environment-variables&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%2C%22group%22%3A%22postgres%22%7D%5D)

### 2. Set up the database schema

Once deployed, open the Neon dashboard for your project and run the SQL in the [Database Schema](#database-schema) section below.

### 3. Configure external services

Follow the [Configuration](#configuration) section to set up Ably, Auth0, and your Meta app.

## Quick Start — Local Development

```bash
# Clone the repository
git clone https://github.com/fbsamples/business-messaging-sample-tech-provider-app.git
cd business-messaging-sample-tech-provider-app

# Install dependencies
npm install

# Copy the example env file and fill in your values
cp .env.example .env.local

# Start the dev server (runs on https://localhost:3000)
npm run dev
```

The dev server uses Turbopack with experimental HTTPS enabled (required by the Facebook JavaScript SDK).

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint:all` | Run ESLint + TypeScript type-check |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

## Environment Variables

All required variables are listed below. Set them in `.env.local` for local development or in your Vercel project settings for production.

```env
# Auth0 Configuration
# The Auth0 SDK reads these automatically — see https://auth0.com/docs/quickstart/webapp/nextjs
APP_BASE_URL='https://your-deployment-url.vercel.app'
AUTH0_DOMAIN='your-tenant.auth0.com'
AUTH0_CLIENT_ID='your-auth0-client-id'
AUTH0_CLIENT_SECRET='your-auth0-client-secret'
AUTH0_SECRET='a-long-random-string-for-session-encryption'

# Meta / Facebook Configuration
FB_APP_ID='your-facebook-app-id'
FB_APP_SECRET='your-facebook-app-secret'
FB_GRAPH_API_VERSION='v22.0'
FB_REG_PIN='your-registration-pin'
FB_VERIFY_TOKEN='your-webhook-verify-token'

# Ably Configuration
ABLY_KEY='your-ably-api-key'

# Contact
TP_CONTACT_EMAIL='your-contact-email@example.com'

# Database (auto-configured when using Vercel + Neon integration)
# POSTGRES_URL='postgres://...'
```

| Variable | Description |
|----------|-------------|
| `APP_BASE_URL` | Your deployment URL (e.g. `https://your-app.vercel.app`). Used by Auth0 for redirects. |
| `AUTH0_DOMAIN` | Your Auth0 tenant domain (e.g. `your-tenant.auth0.com`). |
| `AUTH0_CLIENT_ID` | Auth0 application client ID. |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret. |
| `AUTH0_SECRET` | A long random string used to encrypt Auth0 session cookies. Generate with `openssl rand -hex 32`. |
| `FB_APP_ID` | Your Meta app ID from the [Meta Developer Dashboard](https://developers.facebook.com/apps/). |
| `FB_APP_SECRET` | Your Meta app secret (App Settings > Basic). |
| `FB_GRAPH_API_VERSION` | Graph API version to use (e.g. `v22.0`). |
| `FB_REG_PIN` | A 6-digit PIN used when registering WhatsApp phone numbers. |
| `FB_VERIFY_TOKEN` | A secret string you choose — Meta sends it during webhook verification to prove it's you. |
| `ABLY_KEY` | API key from your [Ably dashboard](https://ably.com/accounts). |
| `TP_CONTACT_EMAIL` | Contact email displayed in the app. |
| `POSTGRES_URL` | PostgreSQL connection string. Auto-set when you connect Neon via Vercel. |

## Configuration

### Ably

Ably provides real-time WebSocket connections for streaming incoming messages and webhook events to the browser.

1. Create an account at [ably.com](https://ably.com/)
2. Create a new app in the Ably dashboard
3. Copy the API key and set it as `ABLY_KEY`

See the [Ably documentation](https://ably.com/docs) for more details.

### Auth0

Auth0 handles user authentication.

1. Create an account at [auth0.com](https://auth0.com/)
2. Create a new **Regular Web Application**
3. In the application settings, configure:
   - **Allowed Callback URLs**: `https://your-app.vercel.app/auth/callback`
   - **Allowed Logout URLs**: `https://your-app.vercel.app`
4. Copy the **Domain**, **Client ID**, and **Client Secret** into your environment variables

See the [Auth0 Next.js Quickstart](https://auth0.com/docs/quickstart/webapp/nextjs/01-login) for a full walkthrough.

### Meta Developer App

1. Create a [Meta Developer](https://developers.facebook.com/) account if you don't have one
2. Create a new app and select the **WhatsApp > Connect with customers through WhatsApp** use case
3. Create a Business Portfolio and connect it to the app
4. In **App Settings > Basic**:
   - Copy the **App ID** and **App Secret** to your env vars
   - Add your Vercel deployment domain to **App Domains**
5. In the **Facebook Login for Business** product settings:
   - Add your deployment URL to **Valid OAuth Redirect URIs** (e.g. `https://your-app.vercel.app/`)
   - Add your deployment URL to **Allowed Domains for the JavaScript SDK**
6. In the **WhatsApp** product settings:
   - Set the **Callback URL** to `https://your-app.vercel.app/api/webhooks`
   - Set the **Verify Token** to the same value as your `FB_VERIFY_TOKEN` env var
   - Subscribe to the `messages` webhook field
7. For development, add testers via **App Roles** — only users with a role on the app can use it in Development mode.

### Going to Production

The steps above are sufficient for development and testing with app admins and testers. To make your app available to external businesses, complete the following:

- [ ] **Replace the privacy policy** — The app includes a placeholder privacy policy at `/privacy`. Replace it with your own before submitting for app review. Set the URL in **App Settings > Basic > Privacy Policy URL**.
- [ ] **Create a Tech Provider Configuration** — In the Meta Developer Dashboard, create at least one Tech Provider Configuration (config ID). The app fetches these dynamically and uses them to launch Embedded Signup.
- [ ] **Complete Business Verification** — Your business must be verified before your app can access production data from other businesses. See [Business Verification](https://developers.facebook.com/docs/development/release/business-verification).
- [ ] **Submit for App Review** — Request the permissions your app needs. See [App Review](https://developers.facebook.com/docs/resp-plat-initiatives/app-review). At minimum, request:
  - `whatsapp_business_management` — manage WABAs, phone numbers, templates, and webhook subscriptions
  - `whatsapp_business_messaging` — send text and template messages
  - Additional permissions based on your use case: `pages_show_list`, `catalog_management`, `ads_read`
- [ ] **Set App Mode to Live** — In **App Settings > Basic**, switch the app from Development to Live. In Development mode, only users with a role on the app (admin, developer, tester) can use it.
- [ ] **Verify your webhook configuration** — Confirm the callback URL (`https://your-domain/api/webhooks`), verify token, and `messages` field subscription are all set in **WhatsApp > Configuration**.
- [ ] **Verify your OAuth redirect URIs** — Confirm your deployment URL is listed in **Facebook Login for Business > Valid OAuth Redirect URIs** and **Allowed Domains for the JavaScript SDK**.

## Database Schema

After deploying, run the following SQL in your Neon dashboard (or any PostgreSQL client connected to your database) to create the required tables.

Each table stores data shared by businesses during the Embedded Signup flow. The `user_id` column scopes all data to the authenticated tech provider user.

```sql
CREATE TABLE IF NOT EXISTS wabas (
  key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  waba_id BIGINT NOT NULL,
  user_id VARCHAR NOT NULL,
  app_id BIGINT NOT NULL,
  business_id BIGINT,
  access_token TEXT,
  last_updated TIMESTAMP,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS user_app_waba_key ON wabas (user_id, app_id, waba_id);

CREATE TABLE IF NOT EXISTS phones (
  key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone_id BIGINT NOT NULL,
  user_id VARCHAR,
  is_ack_bot_enabled BOOLEAN DEFAULT FALSE,
  ack_bot_message TEXT DEFAULT '',
  last_updated TIMESTAMP,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS phone_key ON phones (phone_id);

CREATE TABLE IF NOT EXISTS pages (
  key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page_id BIGINT NOT NULL,
  user_id VARCHAR NOT NULL,
  app_id BIGINT NOT NULL,
  business_id BIGINT,
  access_token TEXT,
  last_updated TIMESTAMP,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS user_app_page_key ON pages (user_id, app_id, page_id);

CREATE TABLE IF NOT EXISTS ad_accounts (
  key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad_account_id BIGINT NOT NULL,
  user_id VARCHAR NOT NULL,
  app_id BIGINT NOT NULL,
  business_id BIGINT,
  access_token TEXT,
  last_updated TIMESTAMP,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS user_app_ad_account_key ON ad_accounts (user_id, app_id, ad_account_id);

CREATE TABLE IF NOT EXISTS businesses (
  key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id BIGINT NOT NULL,
  user_id VARCHAR NOT NULL,
  app_id BIGINT NOT NULL,
  access_token TEXT,
  last_updated TIMESTAMP,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS user_app_business_key ON businesses (user_id, app_id, business_id);

CREATE TABLE IF NOT EXISTS catalogs (
  key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  catalog_id BIGINT NOT NULL,
  user_id VARCHAR NOT NULL,
  app_id BIGINT NOT NULL,
  business_id BIGINT,
  access_token TEXT,
  last_updated TIMESTAMP,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS user_app_catalog_key ON catalogs (user_id, app_id, catalog_id);

CREATE TABLE IF NOT EXISTS datasets (
  key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_id BIGINT NOT NULL,
  user_id VARCHAR NOT NULL,
  app_id BIGINT NOT NULL,
  business_id BIGINT,
  access_token TEXT,
  last_updated TIMESTAMP,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS user_app_dataset_key ON datasets (user_id, app_id, dataset_id);

CREATE TABLE IF NOT EXISTS instagram_accounts (
  key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instagram_account_id BIGINT NOT NULL,
  user_id VARCHAR NOT NULL,
  app_id BIGINT NOT NULL,
  business_id BIGINT,
  access_token TEXT,
  last_updated TIMESTAMP,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS user_app_instagram_account_key ON instagram_accounts (user_id, app_id, instagram_account_id);
```

## Project Structure

```
app/
  api/                    # API routes (server-side)
    beUtils.ts            # Graph API wrappers, DB operations
    authWrapper.ts        # withAuth() HOF for protecting API routes
    token/                # OAuth code-for-token exchange
    send/                 # Send WhatsApp messages
    register/             # Register phone with WhatsApp
    webhooks/             # Webhook listener (GET=verify, POST=incoming)
    paid_messaging/       # Template message APIs
    ...
  components/             # React components
  types/                  # Shared TypeScript type definitions
  publicConfig.ts         # Non-secret config (app ID, API version)
  privateConfig.ts        # Secret config (app secret, tokens — server-only)
  my-inbox/               # Messaging inbox page
  my-wabas/               # WABA management page
  paid_messaging/         # Template messaging page
  ...
lib/
  auth0.ts                # Auth0 client initialization
middleware.ts             # Auth0 middleware (protects all routes)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code style, security practices, and how to submit changes.

## License

This project is MIT licensed, as found in the [LICENSE](LICENSE) file.

Terms of Use — https://opensource.facebook.com/legal/terms

Privacy Policy — https://opensource.facebook.com/legal/privacy
