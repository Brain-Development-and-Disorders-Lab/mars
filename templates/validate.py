# Script to parse an exported collection of Entities and validate format and contents
import json
import logging
import nanoid


# Setup logging
logging.basicConfig(level=logging.DEBUG)


# Variables
COLLECTION_PATH = "/Users/henryburgess/Downloads/metadata.entities.json"
GENERATE_OUTPUT = True
OUTPUT_PATH = "/Users/henryburgess/Downloads/metadata.entities.cleaned.json"
ENTITY_FIELDS = [
  "_id",
  "timestamp",
  "created",
  "name",
  "archived",
  "created",
  "description",
  "owner",
  "projects",
  "relationships",
  "attributes",
  "attachments",
  "history"
]
ENTITY_HISTORY_FIELDS = [
  "_id",
  "timestamp",
  "version",
  "created",
  "name",
  "archived",
  "created",
  "description",
  "owner",
  "projects",
  "relationships",
  "attributes",
  "attachments"
]
ATTRIBUTE_FIELDS = [
  "_id",
  "timestamp",
  "name",
  "archived",
  "description",
  "owner",
  "values"
]
ENTITY_IDENTIFIERS = []
ISSUES = []
WARNINGS = []


def get_identifiers(collection):
  for e in collection:
    ENTITY_IDENTIFIERS.append(e["_id"])


def validate_entity(entity: dict):
  # Check all required fields are present
  missing_fields = list(set(ENTITY_FIELDS) - set(entity.keys()))
  if len(missing_fields) > 0:
    logging.warning("Entity \"{}\" missing {} fields: {}".format(entity["_id"], len(missing_fields), missing_fields))
    ISSUES.append({
      "_id": entity["_id"],
      "message": "Missing {} fields: {}".format(entity["_id"], len(missing_fields), missing_fields)
    })

  if (len(entity["relationships"]) > 0):
    # Check that target exists
    for relationship in entity["relationships"]:
      if relationship["target"]["_id"] not in ENTITY_IDENTIFIERS:
        logging.warning("Entity \"{}\" target \"{}\" does not exist".format(entity["_id"], relationship["target"]["_id"]))
        ISSUES.append({
          "_id": entity["_id"],
          "message": "Target \"{}\" does not exist".format(relationship["target"]["_id"])
        })

  if entity["description"] is None:
    logging.warning("Entity \"{}\" description is \"null\"".format(entity["_id"]))
    WARNINGS.append({
      "_id": entity["_id"],
      "message": "Description is \"null\""
    })
    # Set the description to an empty string
    entity["description"] = ""

  if "attributes" in entity and len(entity["attributes"]) > 0:
    # Check that Attributes are valid
    validate_attributes(entity)
  else:
    entity["attributes"] = []

  if "history" in entity and len(entity["history"]) > 0:
    # Check that History is valid
    validate_history(entity)
  else:
    entity["history"] = []


def validate_attributes(entity):
  for attribute in entity["attributes"]:
    # Check all required fields are present
    missing_fields = list(set(ATTRIBUTE_FIELDS) - set(attribute.keys()))
    if len(missing_fields) > 0:
      logging.warning("Attribute \"{}\" missing {} fields: {}".format(attribute["_id"], len(missing_fields), missing_fields))
      ISSUES.append({
        "_id": attribute["_id"],
        "message": "Missing {} fields: {}".format(attribute["_id"], len(missing_fields), missing_fields)
      })

      # Add an owner if missing
      if "owner" in missing_fields:
        attribute["owner"] = entity["owner"]

      # Add archive state if missing
      if "archived" in missing_fields:
        attribute["archived"] = False

      # Add timestamp if missing
      if "timestamp" in missing_fields:
        attribute["timestamp"] = entity["timestamp"]

  # Check values
  for value in attribute["values"]:
    missing_value_fields = list(set(["_id", "name", "type", "data"]) - set(value.keys()))
    if len(missing_value_fields) > 0:
      logging.warning("Attribute value \"{}\" missing {} fields: {}".format(value["_id"], len(missing_value_fields), missing_value_fields))
      ISSUES.append({
        "_id": attribute["_id"],
        "message": "Value \"{}\" missing {} fields: {}".format(value["_id"], len(missing_value_fields), missing_value_fields)
      })


def validate_history(entity):
  for history in entity["history"]:
    # Check all required fields are present
    missing_fields = list(set(ENTITY_HISTORY_FIELDS) - set(history.keys()))
    if len(missing_fields) > 0:
      logging.warning("Entity \"{}\" history missing {} fields: {}".format(entity["_id"], len(missing_fields), missing_fields))
      ISSUES.append({
        "_id": entity["_id"],
        "message": "History missing {} fields: {}".format(len(missing_fields), missing_fields)
      })

    if "_id" in missing_fields:
      history["_id"] = entity["_id"]

    if "version" in missing_fields:
      history["version"] = nanoid.generate("1234567890abcdef", 10)

    if "name" in missing_fields:
      history["name"] = entity["name"]

    if "created" in missing_fields:
      history["created"] = entity["created"]

    if "attachments" in missing_fields:
      history["attachments"] = entity["attachments"]

    if history["description"] is None:
      logging.warning("Entity \"{}\" history description is \"null\"".format(entity["_id"]))
      WARNINGS.append({
        "_id": entity["_id"],
        "message": "History description is \"null\""
      })
      history["description"] = ""

    if "attributes" in history and len(history["attributes"]) > 0:
        for attribute in history["attributes"]:
          # Check all required fields are present
          missing_history_attribute_fields = list(set(ATTRIBUTE_FIELDS) - set(attribute.keys()))
          if len(missing_history_attribute_fields) > 0:
            logging.warning("History attribute \"{}\" missing {} fields: {}".format(attribute["_id"], len(missing_history_attribute_fields), missing_history_attribute_fields))
            ISSUES.append({
              "_id": attribute["_id"],
              "message": "Missing {} fields: {}".format(attribute["_id"], len(missing_history_attribute_fields), missing_history_attribute_fields)
            })

          if "timestamp" in missing_history_attribute_fields:
            attribute["timestamp"] = history["timestamp"]

          if "archived" in missing_history_attribute_fields:
            attribute["archived"] = False

          if "owner" in missing_history_attribute_fields:
            attribute["owner"] = entity["owner"]


def start():
  collection = None
  with open(COLLECTION_PATH) as file:
    collection = json.load(file)
    logging.info("Collection: {} Entities".format(len(collection)))

    get_identifiers(collection)
    for e in collection:
      validate_entity(e)
    logging.info("Finished: {} issues, {} warnings".format(len(ISSUES), len(WARNINGS)))
    file.close()

  if GENERATE_OUTPUT:
    with open(OUTPUT_PATH, "w") as file:
      json.dump(collection, file, ensure_ascii=False, indent=2)
      logging.info("Wrote to path: {}".format(OUTPUT_PATH))
      file.close()


if __name__ == "__main__":
  start()
