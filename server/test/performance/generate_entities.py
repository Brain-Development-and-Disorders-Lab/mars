import requests

URL = "http://localhost:8000/"
CREATE_ENTITIES = "/entities/create"

ENTITY_COUNT = 3
DESCRIPTIONS = ["eggs", "bacon and eggs", "coffee"]
ATTRIBUTES = ["spongebob", "squidward", "patrick"]

def start():
    for i in range(0, ENTITY_COUNT):
      entity_struct = {
        "name": "Entity A - {}".format(i + 1),
        "created": "2022-05-19T22:34:29.501Z",
        "owner" : "0000-0002-3481-952X",
        "deleted": False,
        "locked": False,
        "shared" : [],
        "description": DESCRIPTIONS[i % 3],
        "projects": [],
        "associations": {
          "origins": [],
          "products": []
        },
        "attributes": [
          {
            "_id": "a_test_0",
            "name": "Test Attribute",
            "description": "An example attribute.",
            "type": "data",
            "values": [
              {
                "identifier": "v_test_0",
                "name": "Spongebob Character",
                "type": "text",
                "data": ATTRIBUTES[i % 3]
              }
            ]
          },
          {
            "_id": "a_test_1",
            "name": "Test Attribute 2",
            "description": "Another example attribute.",
            "type": "data",
            "values": [
               {
                "identifier": "v_test_1",
                "name": "Count",
                "type": "number",
                "data": i
              },
              {
                "identifier": "v_test_2",
                "name": "Box",
                "type": "url",
                "data": "https://box.wustl.edu"
              }
            ]
          }
        ],
        "history": [],
        "attachments": []
      }
      requests.post(URL + CREATE_ENTITIES, json=entity_struct)

if __name__ == "__main__":
    start()
