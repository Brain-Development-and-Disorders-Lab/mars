# MARS 🔬

> Metadata Aggegator for Reusable / Reproducible Science

An open-source and customizable workflow tool for organizing, linking, and tracking metadata generated from scientific experiments. Named after the underlying philosophy of the FAIR data principles, that data should ultimately be reusable.

![mars.png](mars.png)

**⚠️ WARNING: MARS is still in early development and should be used with caution.**

## Features ✨

- Rich metadata entry system, with dynamic relationships between metadata entries.
- Text-based search and advanced search query system for searching metadata.
- Visualizations of metadata relationships.
- Data-first metadata views.
- Metadata history and version control.
- Individual metadata or entire database exports for label creation.
- External scanner connectivity and communication for label creation and scanning.
- User account system.

## Concepts and Abstractions

### Entities 📦

Everything is recognized as an "entity", from physical slices to antibodies. Entities are generalized and expressed using Attributes, expressing data via Values.

Entities have the following metadata components:

- *Name*: This is an ID or general name for an Entity.
- *Owner*: The owner or creator of the Entity.
- *Date*: The date that the Entity came into existence.
- *Description*: An entirely textual description of the Entity. Further metadata should be expressed later as Attributes.
- *Projects*: Specify any existing Projects that the Entity belongs to.
- *Origin*: If the Entity was created as a product of another Entity, then the other Entity is the Origin. The Origin Entity must already exist in the system.
- *Products*: If the Entity being entered into the system generated subsequent Entities that already exist in the system, the generated Entities can be specified.
- *Attributes*: This is a specific metadata component and is explained below.

### Attributes ⚙️

Attributes are the primary method of expressing metadata associated with Entities. Attributes contain points of metadata known as *Values*. Values can be of the following types:

- `string`: A textual description of any length.
- `number`: A numerical value.
- `date`: A date or time.
- `url`: A link to external or internal item.
- `entity`: A "soft" relation to another Entity. This does not have the significance of an Origin or Product Entity in the overall system, but could be used to express a similar concept.
- `select`: A drop-down containing a customizable set of options.

### Projects 📚

Projects are simply groups of Entities. Projects can be of one type of Entities, or a mixture of multiple types.

## Deployment 👉

### Configure environment variables

The server component of reusable.bio is containerized using Docker. Before starting the Docker containers, three environment variables must be configured in an `.env` file that should be placed in the `/server` directory. The variables are `CONNECTION_STRING`, `PORT`, and `DEFAULT_PASSWORD`, the MongoDB connection string, the port of the server to listen on, and the default login password respectively (no specific user functionality exists yet). Example contents are shown below:

```Text
CONNECTION_STRING=mongodb://admin:metadataadmin@localhost:27017/
PORT=8000
DEFAULT_PASSWORD=password
```

### Starting the database

To start a fresh instance of the MongoDB database, use `docker compose`:

```Bash
docker compose up --build
```

This command will build all required containers before starting the containers required to run the system. The system can then be viewed in the browser at `localhost:8080`, and the MongoDB database can be browsed using the `mongo-express` interface accessible at `localhost:8081`.

**⚠️ Note: Currently, only the MongoDB instance and `mongo-express` interface are started. See the below instructions to start the MARS interface and server.**

### Starting the interface and server

To start the reusable interface, run `yarn start` in the `/client` directory. Start the MARS server by running `yarn build` and `yarn start` in the `/server` directory. Both the client and server should be running alongside the Docker containers before attempting to access MARS at `localhost:8080`.

## Roadmap 🗺️

> Tracking features still to be implemented or finalized.

- Attribute editing within Entities ✅
- Metadata query engine, for constructing and executing complex search queries ✅
- Mechanism to organize and categorize Entities into 'Projects' ✅
- Drop-down Value type with customizable options ✅
