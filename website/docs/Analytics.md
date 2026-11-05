# Analytics Handling

This page describes what data Metadatify's AI features send to a language model provider, what Metadatify stores, and where data lives. It is based on the Metadatify source code.

## AI capabilities

Metadatify has three AI capabilities. Each one makes a single request to a large language model (LLM) and uses the response immediately. Metadatify does not store the request or the response.

| Feature                 | When it runs                                           | Sent to the LLM provider                                                                           | Not sent                                                   |
| ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Natural-language search | When you run an AI-assisted search                     | Fixed instructions describing the search format, and the text of your search query                 | Any Entity, Project, or Attribute data from your Workspace |
| Smart import mapping    | When you import a CSV or XLSX file                     | The column headers of the spreadsheet                                                              | Cell values or any other file contents                     |
| Attribute matching      | When you open the "Add Attribute" dialog for an Entity | The Entity's name and description, and the ID, name, and description of the Workspace's Attributes | Attribute values or any other Entity data                  |

### Natural-language search

Your query is sent to the LLM with instructions to translate it into a database query. Metadatify checks the returned query against a list of allowed operators and runs it against your Workspace. The search results never pass through the LLM.

### Smart import mapping

Only the column header names are sent. The LLM suggests which column holds each Entity's name and which holds its description. You can accept or change the suggestion before importing.

### Attribute matching

The LLM picks the Attribute that best fits the Entity, or none. The suggestion is only used if it matches one of the Workspace's Attributes, and you choose whether to apply it.

## Who can use the AI features

AI features are controlled by a per-account **AI** permission, which is off by default. A Metadatify administrator can turn it on for an account. Accounts without the permission don't see AI-assisted search, import mapping suggestions, or Attribute suggestions.

AI features are not available in [public Workspaces](Workspaces.md#public-workspaces). Search in a public Workspace is a standard text search.

## LLM provider

Metadatify works with two kinds of provider, set by the server's `AI_PROVIDER` variable:

- **Azure OpenAI** (`AI_PROVIDER=azure`): the provider intended for production use. Requests go to the Azure OpenAI deployment configured on the server.
- **OpenAI-compatible endpoint** (`AI_PROVIDER=openai`): any server that implements the OpenAI API, set with `OPENAI_BASE_URL`. This can be a model running on your own hardware (for example, LM Studio), so requests never leave your network.

The hosted service at [app.metadatify.com](https://app.metadatify.com) uses Azure OpenAI. The model currently operating is `gpt-5.6-luna` in region `westus3`.

## What Metadatify stores

- **AI requests:** Metadatify does not store the text sent to the LLM or the response. The server's request logs record the request method, URL, status code, and user ID, not request bodies.
- **Usage events:** if analytics are enabled, the server records that an AI feature was used (for example, "search translated"), with your user ID. The search text, column headers, and Entity details are not included.

## Analytics

Metadatify uses [PostHog](https://posthog.com) for product analytics:

- **Server:** records events such as searches performed (search type and number of results, not the search text) and AI feature usage, linked to your user ID.
- **Web app:** the PostHog browser library runs in the Metadatify web app and links activity to your account using your user ID, email address, and name.

## Where data is stored

- **Metadata:** Workspaces, Entities, Projects, Attributes, Activity, and user accounts are stored in MongoDB.
- **Attachments:** files attached to Entities are stored in MongoDB using GridFS.
- **Email:** account emails (verification and password reset) are sent through Azure Communication Services, which receives the recipient's email address and name.

For the hosted service, the web app and API run on Microsoft Azure. Data is stored on an Auzre DocumentDB instance in region `Central US`.

## Turning off AI features when self-hosting

AI features only work when the server has an AI provider configured. To turn them off:

1. Leave `AI_PROVIDER` and `OPENAI_BASE_URL` unset in the server's `.env` file.
2. Restart the server.

With no provider configured, the server rejects all three AI requests and nothing is sent to an LLM. You can also leave the **AI** permission turned off for every account, which hides the AI features in the web app.

To keep AI features but keep data on your own infrastructure, set `AI_PROVIDER=openai` and point `OPENAI_BASE_URL` at a model server you run.

To turn off analytics when self-hosting, set `DISABLE_CAPTURE=true` on the server and `VITE_POSTHOG_DISABLE_CAPTURE=true` when building the web app.
