# Self-Hosting

This page explains how to run Metadatify on your own infrastructure. It covers the components you need, the server and web app configuration, and building and running each part.

## Before you start: domain names

Metadatify's production URLs are currently set in the source code, not in configuration. When `NODE_ENV=production`, the server and web app expect to run at `app.metadatify.com` and `api.metadatify.com`. To run Metadatify on your own domain, update these files before building:

| File                                  | What to change                                                    |
| ------------------------------------- | ----------------------------------------------------------------- |
| `server/src/index.ts`                 | `origins`, the web app origin allowed by CORS                     |
| `server/src/lib/auth.ts`              | `baseURL` (the API URL) and `getTrustedOrigins` (the web app URL) |
| `server/src/lib/email.ts`             | The logo image URL used in emails                                 |
| `client/src/variables.ts`             | `APP_URL`, `API_URL`, and `STATIC_URL`                            |
| `client/src/pages/view/Workspace.tsx` | The public Workspace share link                                   |
| `client/src/pages/view/Entity.tsx`    | The Entity share link                                             |

<!-- TODO(henry): move these URLs into environment variables so self-hosting doesn't require code changes -->

## Components

A Metadatify deployment has three parts:

- **Web app** (`client/`): a single-page React app, built into static files.
- **API server** (`server/`): a Node.js server providing the GraphQL API, authentication, and file downloads.
- **MongoDB**: stores all metadata in a database named `metadata`, and Entity attachments (using GridFS) in a database named `storage`.

These external services are optional:

- **Azure Communication Services:** sends account verification and password reset emails.
- **ORCiD:** lets users sign in with their ORCiD iD.
- **An LLM provider:** powers the AI features. See [Analytics](Analytics.md).
- **PostHog:** product analytics.

## Prerequisites

- Node.js 22 or later
- Yarn 1 (Classic)
- Docker and Docker Compose, or an existing MongoDB server
- A domain name and TLS certificates for the web app and API

## 1. Get the code and install dependencies

```bash
git clone https://github.com/Brain-Development-and-Disorders-Lab/mars.git
cd mars
yarn
cd client && yarn && cd ..
cd server && yarn && cd ..
```

## 2. Set up MongoDB

The repository's `docker-compose.yml` starts two containers:

- `database`: MongoDB on port 27017. On first start it runs `server/src/setup.js`, which creates the `metadata` and `storage` databases, their collections, and a `client` user with read and write access to both.
- `viewer`: [mongo-express](https://github.com/mongo-express/mongo-express), a web interface for browsing the database, on port 8081.

```bash
docker compose up -d
```

For a production deployment:

- **Change the default passwords.** `docker-compose.yml` and `server/src/setup.js` contain default credentials. Replace them before the first start, because `setup.js` only runs when the database is first created.
- **Don't expose the database publicly.** Remove the port mapping for 27017, or restrict it to the API server.
- **Remove or restrict the `viewer` service.** mongo-express gives full access to the database.

If you use an existing MongoDB server instead, create the `metadata` and `storage` databases and a user with read and write access to both.

## 3. Configure the API server

Create a `.env` file in the `server/` directory. Variables are grouped below by purpose.

### Core

| Variable            | Required | Description                                                                                                                                                              |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CONNECTION_STRING` | Yes      | MongoDB connection string, for example `mongodb://<user>:<password>@localhost:27017/`                                                                                    |
| `PORT`              | No       | Port the server listens on. Defaults to `8000`.                                                                                                                          |
| `NODE_ENV`          | Yes      | Set to `production` for a production deployment. This selects the production URLs, ORCiD's production service, `info`-level logging, and verification emails on sign-up. |

### Authentication

| Variable             | Required | Description                                                                                                                                                |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET` | Yes      | Secret used to sign sessions. Use a long, random value and keep it private.                                                                                |
| `BETTER_AUTH_URL`    | No       | URL of the API server. The server's `baseURL` setting is currently fixed in `server/src/lib/auth.ts` (see [domain names](#before-you-start-domain-names)). |

### ORCiD sign-in

Only needed to let users sign in with ORCiD. Register an application with [ORCiD Developer Tools](https://orcid.org/developer-tools).

| Variable                                                       | Description                                    |
| -------------------------------------------------------------- | ---------------------------------------------- |
| `ORCID_PRODUCTION_CLIENT_ID`, `ORCID_PRODUCTION_CLIENT_SECRET` | Used when `NODE_ENV=production`                |
| `ORCID_SANDBOX_CLIENT_ID`, `ORCID_SANDBOX_CLIENT_SECRET`       | Used in development, against the ORCiD sandbox |

### Email

| Variable                                | Required | Description                                                         |
| --------------------------------------- | -------- | ------------------------------------------------------------------- |
| `AZURE_COMMUNICATION_CONNECTION_STRING` | Yes      | Azure Communication Services connection string, used to send emails |
| `EMAIL_FROM_ADDRESS`                    | Yes      | Address that emails are sent from                                   |
| `ADMIN_EMAIL`                           | No       | Address that receives issue reports submitted from the web app      |

<!-- TODO(henry): confirm whether the server can run without Azure Communication Services, and document an alternative if so -->

### AI features

Optional. Leave `AI_PROVIDER` and `OPENAI_BASE_URL` unset to turn the AI features off. See [Analytics](Analytics.md) for what data is sent.

| Variable                   | Description                                                               |
| -------------------------- | ------------------------------------------------------------------------- |
| `AI_PROVIDER`              | `azure` for Azure OpenAI, or `openai` for any OpenAI-compatible endpoint  |
| `OPENAI_BASE_URL`          | URL of the OpenAI-compatible endpoint, for example a model server you run |
| `OPENAI_MODEL`             | Model name. Defaults to `openai/gpt-oss-20b`.                             |
| `OPENAI_API_KEY`           | API key for the endpoint, if it needs one                                 |
| `AZURE_OPENAI_ENDPOINT`    | Azure OpenAI resource endpoint, when `AI_PROVIDER=azure`                  |
| `AZURE_OPENAI_API_KEY`     | Azure OpenAI API key                                                      |
| `AZURE_OPENAI_DEPLOYMENT`  | Name of the Azure OpenAI deployment to use                                |
| `AZURE_OPENAI_API_VERSION` | Azure OpenAI API version. Defaults to `2024-02-01`.                       |

### Analytics

| Variable          | Description                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| `POSTHOG_KEY`     | PostHog project key for server-side events, which are sent to PostHog's US cloud |
| `DISABLE_CAPTURE` | Set to `true` to turn off server-side analytics                                  |

### Example

```text
# Core
CONNECTION_STRING=mongodb://<user>:<password>@localhost:27017/
PORT=8000
NODE_ENV=production

# Authentication
BETTER_AUTH_SECRET=<long random value>

# Email
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=<Azure Communication Services connection string>
EMAIL_FROM_ADDRESS=<sender address>
ADMIN_EMAIL=<admin address>

# AI features (optional)
AI_PROVIDER=openai
OPENAI_BASE_URL=<URL of your model server>
OPENAI_MODEL=openai/gpt-oss-20b

# Analytics
DISABLE_CAPTURE=true
```

## 4. Build and run the API server

```bash
cd server
yarn build
yarn start
```

`yarn build` bundles the server into `server/dist/`, and `yarn start` runs `node dist/index.js`. The server serves:

- `/`: the authenticated GraphQL API
- `/auth`: authentication
- `/public/<workspace ID>`: the read-only API for public Workspaces
- `/static`: file downloads
- `/v1`: the REST API

<!-- TODO(henry): recommend a process manager (e.g. systemd or PM2) and restart policy -->

Run the server under a process manager so it restarts if it stops.

## 5. Configure and build the web app

The web app reads these variables at build time from a `.env` file in the `client/` directory. All are optional.

| Variable                       | Description                                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_VERSION`                 | Version number shown in the app                                                                                                                    |
| `VITE_PUBLIC_POSTHOG_KEY`      | PostHog project key for the web app                                                                                                                |
| `VITE_PUBLIC_POSTHOG_HOST`     | PostHog host URL                                                                                                                                   |
| `VITE_POSTHOG_DISABLE_CAPTURE` | Set to `true` to turn off analytics and session recording in the web app                                                                           |
| `VITE_COLLEGE_SCORECARD_KEY`   | API key for the [College Scorecard API](https://collegescorecard.ed.gov/data/api/), used to search institutions when users enter their affiliation |

Then build:

```bash
cd client
yarn build
```

The built files are in `client/dist/`. Serve them as static files from your web server. Because the app handles its own routing, configure the web server to return `index.html` for any path that doesn't match a file.

## 6. Reverse proxy and HTTPS

<!-- TODO(henry): add tested reverse proxy configuration (e.g. nginx or Caddy) for the web app and API -->

Put both the web app and the API server behind a reverse proxy that terminates HTTPS. The web app and API need their own hostnames, matching the URLs described in [Before you start](#before-you-start-domain-names).

## 7. Backups

Back up both MongoDB databases: `metadata` holds all metadata and user accounts, and `storage` holds Entity attachments. `mongodump` and `mongorestore` work for both.

## 8. Create an administrator

1. Open the web app and create an account.
2. In MongoDB, set that account's `role` to `admin` in the `metadata` database's `user` collection:

   ```javascript
   db.user.updateOne({ email: "<your email>" }, { $set: { role: "admin" } });
   ```

3. Log out and log back in.

Administrators can manage users and their permissions from the Admin page, including turning on the AI permission for accounts.
