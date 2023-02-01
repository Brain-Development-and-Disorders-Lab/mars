# Metadata Manager

An open-source and customizable workflow tool for tracking and managing metadata generated from scientific experiments.

<img src="metadata-manager.png">

**⚠️ WARNING: This software is still in early development. It should not be used to manage real scientific data at this stage. There are known issues updating and deleting Entities and Collections.**

## Concepts

### Entities

Everything is recognized as an "entity", from physical slices to antibodies. Entities are generalized and expressed using Attributes, expressing data via Parameters.

Entities have the following metadata configured:

- *Name*: This is an ID or general name for an Entity.
- *Owner*: The owner or creator of the Entity.
- *Date*: The date that the Entity came into existence.
- *Description*: An entirely textual description of the Entity. Metadata should be expressed later as Attributes.
- *Origin*: If the Entity was created as a product of another Entity, then the other Entity is the Origin. The Origin Entity should already exist in the system.
- *Products*: If the Entity being entered into the system generated subsequent Entities that already exist in the system, the generated Entities can be specified.
- *Collections*: Specify any existing Collections that the Entity belongs to.

### Attributes

Attributes are the primary method of expressing metadata associated with Entities. Attributes contain points of metadata known as *Parameters*. Parameters can be of the following types:

- `string`: A textual description of any length.
- `number`: A numerical value.
- `date`: A date or time.
- `url`: A link to external or internal item.
- `entity`: A "soft" relation to another Entity. This does not have the significance of an Origin or Product Entity in the overall system, but could be used to express a similar concept.

### Collections

Collections are simply groups of Entities. Collections can be of one type of Entities, or a mixture of multiple types.

## Features

- Searchable database of all metadata.
- Customizable assignment of metadata elements.
- Extensible and configurable "Entity" concept.
- Graph illustrations of relationships between and evolutions of Entities.
- Data export for label creation.
- Changelog system.

## Deployment

The application has (⚠️ almost) been entirely containerized using Docker containers. Before starting the Docker containers, two environment variables must be configured in an `.env` file that should be placed in the `/server` directory. The two variables are `CONNECTION_STRING` and `PORT`, the MongoDB connection string and the port of the server to listen on respectively. Example contents are shown below:

```Text
CONNECTION_STRING=mongodb://admin:metadataadmin@localhost:27017/
PORT=8000
```

Then, to start a fresh instance of the application, use `docker compose`:

```Bash
$ docker compose up
```

This command will build all required containers before starting the containers required to run the system. The system can then be viewed in the browser at `localhost:8080`, and the MongoDB database can be browsed using the `mongo-express` interface accessible at `localhost:8081`.

**⚠️ Note: Currently, only the MongoDB instance and `mongo-express` interface are started. See the below instructions to start the client frontend and Express.js server.**

To start the client frontent, run `yarn start` in the `/client` directory. Start the Express.js server by running `yarn build` and `yarn start` in the `/server` directory. Both the client and server should be running alongside the MongoDB instance before attempting to access the frontend at `localhost:8080`.
