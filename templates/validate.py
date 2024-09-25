# Script to parse an exported collection of Entities and validate format and contents
import json
import logging


# Setup logging
logging.basicConfig(level=logging.DEBUG)


# Variables
COLLECTION_PATH = "/Users/henryburgess/Downloads/metadata.entities.json"
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
  "associations",
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
  "associations",
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

  if (len(entity["associations"]["origins"]) > 0):
    # Check that Origins exist
    for origin in entity["associations"]["origins"]:
      if origin["_id"] not in ENTITY_IDENTIFIERS:
        logging.warning("Entity \"{}\" Origin {} does not exist".format(entity["_id"], origin["_id"]))
        ISSUES.append({
          "_id": entity["_id"],
          "message": "Origin \"{}\" does not exist".format(origin["_id"])
        })

  if (len(entity["associations"]["products"]) > 0):
    # Check that Products exist
    for product in entity["associations"]["products"]:
      if product["_id"] not in ENTITY_IDENTIFIERS:
        logging.warning("Entity \"{}\" Product {} does not exist".format(entity["_id"], product["_id"]))
        ISSUES.append({
          "_id": entity["_id"],
          "message": "Product \"{}\" does not exist".format(product["_id"])
        })

  if entity["description"] is None:
    logging.warning("Entity \"{}\" description is \"null\"".format(entity["_id"]))
    WARNINGS.append({
      "_id": entity["_id"],
      "message": "Description is \"null\""
    })

  if "attributes" in entity and len(entity["attributes"]) > 0:
    # Check that Attributes are valid
    for attribute in entity["attributes"]:
      validate_attribute(attribute)

  if "history" in entity and len(entity["history"]) > 0:
    # Check that History is valid
    validate_history(entity)


def validate_attribute(attribute):
  # Check all required fields are present
  missing_fields = list(set(ATTRIBUTE_FIELDS) - set(attribute.keys()))
  if len(missing_fields) > 0:
    logging.warning("Attribute \"{}\" missing {} fields: {}".format(attribute["_id"], len(missing_fields), missing_fields))
    ISSUES.append({
      "_id": attribute["_id"],
      "message": "Missing {} fields: {}".format(attribute["_id"], len(missing_fields), missing_fields)
    })

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


def start():
  with open(COLLECTION_PATH) as file:
    collection = json.load(file)
    logging.info("Collection: {} Entities".format(len(collection)))

    get_identifiers(collection)
    for e in collection:
      validate_entity(e)
    file.close()

  logging.info("Finished: {} issues, {} warnings".format(len(ISSUES), len(WARNINGS)))


if __name__ == "__main__":
  start()
