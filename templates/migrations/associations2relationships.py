# Utility script to translate "associations" structures to new "relationships" structures,
# with consideration for Entities and Entity history entries


import json
import logging


# Setup logging
logging.basicConfig(level=logging.DEBUG)


# Variables
COLLECTION_PATH = ""
OUTPUT_PATH = ""
ENTITY_IDENTIFIERS = []
GENERATE_OUTPUT = True


def get_identifiers(collection):
  for e in collection:
    ENTITY_IDENTIFIERS.append(e["_id"])


def update_entity(entity: dict):
  # Create "relationships" parameter
  entity["relationships"] = []

  if (len(entity["associations"]["origins"]) > 0):
    # Create new "child"-type relationship with each Origin
    for origin in entity["associations"]["origins"]:
      entity["relationships"].append({
        "target": {
          "_id": origin["_id"],
          "name": origin["name"]
        },
        "source": {
          "_id": entity["_id"],
          "name": entity["name"]
        },
        "type": "child"
      })

  if (len(entity["associations"]["products"]) > 0):
    # Create new "parent"-type relationship with each Product
    for product in entity["associations"]["products"]:
      entity["relationships"].append({
        "target": {
          "_id": product["_id"],
          "name": product["name"]
        },
        "source": {
          "_id": entity["_id"],
          "name": entity["name"]
        },
        "type": "parent"
      })

  # Delete "associations" parameter
  entity.pop("associations", None)

  if "history" in entity and len(entity["history"]) > 0:
    # Check that History is valid
    update_history(entity)
  else:
    entity["history"] = []


def update_history(entity):
  for history in entity["history"]:
    # Create "relationships" parameter
    history["relationships"] = []

    if (len(history["associations"]["origins"]) > 0):
      # Create new "child"-type relationship with each Origin
      for origin in history["associations"]["origins"]:
        history["relationships"].append({
          "target": {
            "_id": origin["_id"],
            "name": origin["name"]
          },
          "source": {
            "_id": history["_id"],
            "name": history["name"]
          },
          "type": "child"
        })

    if (len(history["associations"]["products"]) > 0):
      # Create new "parent"-type relationship with each Product
      for product in history["associations"]["products"]:
        history["relationships"].append({
          "target": {
            "_id": product["_id"],
            "name": product["name"]
          },
          "source": {
            "_id": history["_id"],
            "name": history["name"]
          },
          "type": "parent"
        })

    # Delete "associations" parameter
    history.pop("associations", None)


def start():
  collection = None
  with open(COLLECTION_PATH) as file:
    collection = json.load(file)
    logging.info("Collection: {} Entities".format(len(collection)))

    get_identifiers(collection)
    for e in collection:
      update_entity(e)
    logging.info("Finished!")
    file.close()

  if GENERATE_OUTPUT:
    with open(OUTPUT_PATH, "w") as file:
      json.dump(collection, file, ensure_ascii=False, indent=2)
      logging.info("Wrote to path: {}".format(OUTPUT_PATH))
      file.close()


if __name__ == "__main__":
  start()
