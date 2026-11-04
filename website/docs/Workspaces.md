# Workspaces

Metadatify uses Workspaces to manage Entities, Projects, and Attributes amongst collaborators and organizations.

## Workspace Switcher

A core component for managing Workspaces is the Workspace Switcher, located in the top left corner of the sidebar.

![Workspace Switcher](../img/workspace_switcher.png)

The Workspace Switcher displays a list of all Workspaces the user has access to. Clicking on a Workspace will switch the user to that Workspace, and the active Workspace has a green tick icon to the left of the Workspace name. The switcher has other actions including:

- **Edit workspace:** Navigates to the Workspace's settings page.
- **Create workspace:** Navigates to the Workspace creation page.
- **Account settings:** Navigates to the user's account settings page.
- **Log out:** Logs the user out of Metadatify and returns them to the login screen.

## Managing Workspaces

At least one Workspace must be created before any other actions can be performed. Typically, users will create a Workspace on their first login, unless they have been added as a collaborator to an existing Workspace.

To update the Workspace, click the "Edit workspace" action in the Workspace Switcher. This will navigate to the Workspace's settings page:

![Edit Workspace](../img/workspace_page.png)

This page displays the Workspace's name, description, collaborators, archived metadata, and active Counters. The name and description can be updated, and collaborators can be added or removed. Archived Entities, Projects, and Attributes can be viewed or restored. To restore archived metadata, click the corresponding orange "Restore" button.

## Public Workspaces

A Workspace member with permission to edit the Workspace's details can set its visibility to **Public** on the Workspace settings page. Once a Workspace is public, the "Share" button on the settings page shows its public URL, in the form:

```
https://app.metadatify.com/public/<workspace ID>
```

Anyone with that URL can view the Workspace without logging in. Setting the Workspace back to **Private** disables the public URL.

A public Workspace opens on a public Dashboard showing its recent Entities and Projects. From the sidebar, visitors can:

- **Browse Entities:** open any Entity to view its description, Attributes and values, linked Entities, the Projects it belongs to, and its attachments. Attachments can be downloaded.
- **Browse Projects:** view each Project and the Entities it contains.
- **Browse Attributes:** view each Attribute, its values, and which Entities use it.
- **Search:** run a text search across the Workspace, with filters for creation date and for Entities that have attachments, Attributes, or links. The "Query Builder" tab lets you build structured queries from Entity fields.

Public Workspaces are read-only. Visitors without an account can't:

- Create, edit, archive, or delete Entities, Projects, or Attributes
- Import or export metadata
- Use AI features, including AI-assisted natural-language search. Public search is a standard text search.
- View the Workspace's Activity feed or its collaborators

### Demo Workspace

The demo Workspace is a public Workspace you can explore without creating an account.

**Open the demo Workspace:** _link coming soon_

To use the full set of features, [log in or create an account](https://app.metadatify.com) and create your own Workspace. See [Getting Started](Getting-Started.md) for an overview.
