# Terminology

Metadatify introduces a nomenclature for describing the creation and management of scientific metadata. An understanding of this nomenclature will help with understanding how to most effectively use the platform.

The three primary components of the Metadatify schema are:

- Entities;
- Projects; and
- Attributes (with Templates).

## Entities

Everything is recognized as an "entity", from physical slices to antibodies. Entities are generalized and expressed using Attributes, expressing data via Values.

Entities have the following metadata components:

- **Name**: This is an ID or general name for an Entity.
- **Owner**: The owner or creator of the Entity.
- **Date**: The date that the Entity came into existence.
- **Description**: An entirely textual description of the Entity. Further metadata should be expressed later as Attributes.
- **Collections**: Specify any existing Collections that the Entity belongs to.
- **Relationships**: Relationships are used to create links between Entities. An Entity can be a _parent_ of another Entity, a _child_ of another Entity, or express a _general_ relationship with another Entity.
- **Attributes**: This is a specific metadata component and is explained below.

## Attributes

Attributes are the primary method of expressing metadata associated with Entities. Attributes contain points of metadata known as Values. Values are named and can be of the following types:

- `string`: A textual description of any length.
- `number`: A numerical value.
- `date`: A date or time.
- `url`: A link to external or internal item.
- `entity`: A "soft" relationship with another Entity. This does not have the significance of a `Relationship`, but could be used to express a reference to another Entity.
- `select`: A drop-down containing a set of user-defined options that can be selected.

## Projects

Projects are simply groups of Entities. Projects can be of one type of Entities, or a mixture of multiple types. Projects can be shared with other collaborators.
