# Metadatify 🧪

> Metadatify, or the Metadata Aggregation for Reproducible Science (MARS) project, is an open-source web-based tool to create, manage, and search scientific metadata.

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.13946927.svg)](https://doi.org/10.5281/zenodo.13946927) ![GitHub Repo stars](https://img.shields.io/github/stars/Brain-Development-and-Disorders-Lab/mars?style=flat)

![Poster](poster.png)

![Dashboard](website/src/img/Dashboard.png)

## Features

- Rich metadata entry and management, including support for file imports (CSV, JSON files)
- Export partial or complete metadata into multiple different file types (CSV, JSON files)
- AI-assisted search, text-based search, and advanced query system for searching deeply through metadata
- Manage metadata across projects and share with external users using Workspaces
- Establish relationships between metadata entries, visualize these relationships
- Edit history and version restore for metadata entries
- User accounts supporting [ORCiD](https://orcid.org) sign-in

## Documentation

[Documentation](https://metadatify.com/docs/) is actively maintained that covers the concepts introduced by Metadatify and how to use the platform. Documentation for API usage and self-hosting is coming soon.

## Development

### Install dependencies

1. Install dependencies for the overall project by running `yarn` in the root directory of the repository. These dependencies are required to run `husky` and setup the pre-commit hooks that run `prettier` prior to any git commits.
2. Install dependencies for the client by running `yarn` in the `/client` directory of the repository.
3. Install dependencies for the server by running `yarn` in the `/server` directory of the repository.

### Setup environment variables

Metadatify uses Docker to containerize the server components. Before starting the Docker containers, three environment variables must be configured in an `.env` file that should be placed in the `/server` directory.

The `.env` file must have the following variables, organized into categories:

#### Connectivity variables

- `CONNECTION_STRING`: The local MongoDB database connection string, update the username and password.
- `GRAPHQL_PORT`: The port value for the GraphQL endpoint
- `NODE_ENV`: Specify the Node environment

#### ORCiD integration variables

The following variables are only required if deploying with ORCiD authentication, see [ORCiD Developer Tools](https://orcid.org/developer-tools):

- `ORCID_SANDBOX_CLIENT_ID`: Sandbox client application ID
- `ORCID_SANDBOX_CLIENT_SECRET`: Sandbox client application secret
- `ORCID_PRODUCTION_CLIENT_ID`: Production client application ID
- `ORCID_PRODUCTION_CLIENT_SECRET`: Production client application secret

#### `better-auth` variables

Metadatify uses `better-auth` for account management, and the following variables are required:

- `BETTER_AUTH_SECRET`: Secret for `better-auth`
- `BETTER_AUTH_URL`: URL for server endpoint

#### Email infrastructure variables

Metadatify is configured to send notification emails for events such as password reset requests, new account verification, and error reports:

- `AZURE_COMMUNICATION_CONNECTION_STRING`: Azure communication connection string
- `EMAIL_FROM_ADDRESS`: Address that all email will appear from
- `ADMIN_EMAIL`: Address of existing user holding "admin" privileges on Metadatify

#### AI feature variables

To enable the AI-assisted features, Metadatify requires the following variables:

- `AI_PROVIDER`: The provider, either "openai" (development use) or "azure" (production use)
- `OPENAI_BASE_URL`: URL of LLM server endpoint
- `OPENAI_MODEL`: Specify the exact model being used
- `OPENAI_API_KEY`: API key for the LLM

#### Example server `.env` file

An example `.env` file is shown below:

```Text
# Database variables
CONNECTION_STRING=mongodb://<username>:<password>@localhost:27017/
GRAPHQL_PORT=8000

# Node environment
NODE_ENV=development

# ORCiD ID API variables
ORCID_PRODUCTION_CLIENT_ID=<ORCiD client ID>
ORCID_PRODUCTION_CLIENT_SECRET=<ORCiD client secret>

# Configure better-auth
BETTER_AUTH_SECRET=<better-auth secret>
BETTER_AUTH_URL=http://127.0.0.1:8080

# Configure Azure Communication Services
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=<Azure communication connection string>
EMAIL_FROM_ADDRESS=<Address that all email will appear from>
ADMIN_EMAIL=<Address of existing user holding "admin" privileges on Metadatify>

# AI Search (set AI_PROVIDER to "openai" for LMStudio/OpenAI-compatible, "azure" for Azure OpenAI)
AI_PROVIDER=openai
OPENAI_BASE_URL=<URL of LLM>
OPENAI_MODEL=openai/gpt-oss-20b
OPENAI_API_KEY=<API key for LLM>
```

### Starting Docker containers

To start a fresh instance of the MongoDB database, use `docker compose`:

```Bash
docker compose up --build
```

This command will build all required containers before starting the containers required by the server. The MongoDB database can be browsed using the `mongo-express` interface accessible at `localhost:8081`.

### Running Metadatify client and server

To start the client, run `yarn start` in the `/client` directory. Start the server by running `yarn build` and then `yarn start` in the `/server` directory. Both the client and server should be running alongside the Docker containers before attempting to access the interface at `localhost:8080`.

## Testing

Metadatify includes Playwright tests and component tests for the client, and the server includes unit tests using Jest.

### Testing - Client

To run component tests, run `yarn test:components` in the `/client` directory.

[Playwright](https://playwright.dev/) is used for testing the client UI. Before running client tests, add an `.env` file in the `/client` directory with the following variables:

- `CONNECTION_STRING`: The local MongoDB database connection string, update the username and password.

An example `.env` file is shown below:

```Text
# Database variables
CONNECTION_STRING=mongodb://<username>:<password>@localhost:27017/
```

Once the `.env` file has been configured, run `yarn test:ui` in the `/client` directory to run all Playwright tests. Ensure the server is running, otherwise the tests will fail.

### Testing - Server

> [!WARNING]
> Testing the server will erase the local MongoDB database!

To run unit tests, run `yarn test` in the `/server` directory.

## Acknowledgements

**Organizations:**

- Department of Neuroscience, Washington University School of Medicine in St. Louis
- Brain Development and Disorders Lab, Washington University School of Medicine in St. Louis
- Scientific Software Engineering Center, Georgia Institute of Technology

**Contributors:**

- Henry Burgess
- Robin Fievet

**License:**

See the LICENSE file for license details.
