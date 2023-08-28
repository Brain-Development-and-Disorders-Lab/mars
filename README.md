# MARS 🔬

> Metadata Aggegator for Reusable / Reproducible Science

An open-source and customizable workflow tool for organizing, tracking, and searching metadata generated from scientific experiments. Named after the underlying philosophy of the FAIR data principles, that data should ultimately be reusable.

![mars.png](mars.png)

**⚠️ WARNING: MARS is still in early development and should be used with caution.**

## Features ✨

- Rich metadata entry system including spreadsheet imports
- Text-based search and advanced query system for searching metadata
- Account system using [ORCiD](https://orcid.org) sign-in
- Relationships between metadata and graph visualizations of the relationships
- History and version control system
- Specific metadata or entire database exports

## Concepts and Abstractions

### Entities 📦

Everything is recognized as an "entity", from physical brain slices to antibodies. Details within Entities are organized using Attributes (see below), and Attributes contain typed data Values.

Entities have the following components:

- *Name*: This is an ID or general name for an Entity.
- *Owner*: The creator of the Entity.
- *Date*: The date that the Entity came into existence or was created.
- *Description*: An entirely textual description of the Entity. Further metadata should be expressed later as Attributes.
- *Projects*: Specify any existing Projects that the Entity belongs to.
- *Origins*: If the Entity was created as a product of another Entity, then the other Entity is an Origin. The Origin Entities must already exist in the database.
- *Products*: If the Entity being entered into the system generated subsequent Entities that already exist in the system, the generated Entities can be specified. The Product Entities must already exist in the database.
- *Attributes*: This is a specific metadata component and is explained below (see below).
- *Attachments*: Attach images or PDF files to an Entity.

### Attributes ⚙️

Attributes are the primary method of organizing metadata associated with Entities. Attributes contain types of metadata known as *Values*. Values can be any of the following:

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

The server component of reusable.bio is containerized using Docker. Before starting the Docker containers, three environment variables must be configured in an `.env` file that should be placed in the `/server` directory. The variables are `CONNECTION_STRING` and `PORT`: the MongoDB connection string and the port of the server to listen on respectively. Example contents are shown below:

```Text
CONNECTION_STRING=mongodb://admin:metadataadmin@localhost:27017/
PORT=8000
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
