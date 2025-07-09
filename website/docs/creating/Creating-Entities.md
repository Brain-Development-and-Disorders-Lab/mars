# Creating Entities

Entities form the foundation of metadata stored on the platform.

There are two ways to create an Entity using the Metadatify platform UI:

1. Use the Create Portal to begin creating a new Entity. Select "Create" under the "Workspace" section of the navigation bar, and click "Create" within the Entity card.
2. Directly begin creating a new Entity via the "Entities" listing page. Select "Entities" under the "View" section of the navigation bar.

## Required Fields

**Name:** A name must be specified for each Entity. The names do not have to be unique, however unique names are strongly encouraged. There are no character restrictions for names.

**Owner** Entities must be assigned an owner. This can be either the current user, or another user.

**Created:** A date and time should be assigned marking when the Entity came into existence. This can be when it is inputted into Metadatify, or in the case of a physical Entity, when it was derived or created physcially.

## Optional Fields

Optional fields are not required to create an Entity, but it strongly encouraged to populate these fields when creating an Entity.

**Description:** A description can be provided to give context to the name of the Entity. The description should not be a replacement for metadata which can be specified later on.

**Projects:** Entities can be added to existing Projects.

**Relationships:** Relationships can be created between Entities. Relationships can be directional (e.g. parent-child) or general. Specify the target Entity, then specify the type of relationship between these Entities. When creating parent or child directional relationships, the relationship is read from left-to-right like so:

```text
Created Entity is the parent / child of Target Entity
```

**Attributes:** Attributes can be created and assigned to Entities. A Template Attribute can be utilized or a new Attribute can be created for that Entity. Attributes are explained in detail as part of the Metadatify [Terminology](../Terminology) and creating Template Attributes is discussed here: [Creating Templates](../creating/Creating-Templates).
