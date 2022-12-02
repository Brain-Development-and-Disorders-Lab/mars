// React and Grommet
import React, { useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Flex, FormControl, FormLabel, IconButton, Input, Link, Select, Tag, TagLabel } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { SingleDatepicker } from "chakra-dayzed-datepicker";

// Database and models
import { getData } from "src/database/functions";
import { EntityModel, Parameter } from "types";

// Custom components
import Linky from "src/components/Linky";

export const NumberParameter = (props: Parameter.PNumber) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(0);

  return (
    <Card minW={"xs"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLabel>Number</TagLabel>
            </Tag>

            <Badge bg={"green.200"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove &&
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<CloseIcon />}
              color={"white"}
              background={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          }
        </Flex>
      </CardHeader>

      <CardBody pt={"0"}>
        <Flex direction={"column"} gap={"4"} p={"2"} justify={"space-between"} align={"center"}>
          {/* Parameter name */}
          <FormControl label="Name">
            <FormLabel htmlFor={"name"}>
              Name
            </FormLabel>
            <Input
              id="name"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={props.disabled}
              required
            />
          </FormControl>

          {/* Parameter data */}
          <FormControl label="Data">
            <FormLabel>
              Data
            </FormLabel>
            <Input
              name="data"
              placeholder={"0"}
              value={value}
              onChange={(event) => setValue(Number(event.target.value))}
              disabled={props.disabled}
              required
            />
            </FormControl>
        </Flex>
      </CardBody>
    </Card>
  );
};

export const StringParameter = (props: Parameter.PString) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState("");

  return (
    <Card minW={"xs"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLabel>String</TagLabel>
            </Tag>

            <Badge bg={"green.200"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove &&
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<CloseIcon />}
              color={"white"}
              background={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          }
        </Flex>
      </CardHeader>

      <CardBody pt={"0"}>
        <Flex direction={"column"} gap={"4"} p={"2"} justify={"center"} align={"center"}>
          {/* Parameter name */}
          <FormControl label="Name">
            <FormLabel htmlFor={"name"}>
              Name
            </FormLabel>
            <Input
              id="name"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={props.disabled}
              required
            />
          </FormControl>

          {/* Parameter data */}
          <FormControl label="Data">
            <FormLabel>
              Data
            </FormLabel>
            <Input
              name="data"
              placeholder={""}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={props.disabled}
              required
            />
          </FormControl>
        </Flex>
      </CardBody>
    </Card>
  );
};

export const URLParameter = (props: Parameter.PURL) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(props.data);

  return (
    <Card minW={"xs"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLabel>URL</TagLabel>
            </Tag>

            <Badge bg={"green.200"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove &&
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<CloseIcon />}
              color={"white"}
              background={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          }
        </Flex>
      </CardHeader>

      <CardBody pt={"0"}>
        <Flex direction={"column"} gap={"4"} p={"2"} justify={"center"} align={"center"}>
          {/* Parameter name */}
          <FormControl label="Name">
            <FormLabel htmlFor={"name"}>
              Name
            </FormLabel>
            <Input
              id="name"
              placeholder="Name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              disabled={props.disabled}
              required
            />
          </FormControl>

          {/* Parameter data */}
          <FormControl label="Data">
            <FormLabel>
              Data
            </FormLabel>
            {props.disabled ?
              <Link href={value} color="dark-1">
                {value}
              </Link>
            :
              <Input
                name="url"
                placeholder="URL"
                value={value}
                onChange={(event) => setValue(event.target.value.toString())}
                disabled={props.disabled}
                required
              />}
          </FormControl>
        </Flex>
      </CardBody>
    </Card>
  );
};

export const DateParameter = (props: Parameter.PDate) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(new Date());

  return (
    <Card minW={"xs"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLabel>Date</TagLabel>
            </Tag>

            <Badge bg={"green.200"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove &&
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<CloseIcon />}
              color={"white"}
              background={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          }
        </Flex>
      </CardHeader>

      <CardBody pt={"0"}>
        <Flex direction={"column"} gap={"4"} p={"2"} justify={"space-between"} align={"center"}>
          {/* Parameter name */}
          <FormControl label="Name">
            <FormLabel htmlFor={"name"}>
              Name
            </FormLabel>
            <Input
              id="name"
              placeholder="Name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              disabled={props.disabled}
              required
            />
          </FormControl>

          {/* Parameter data */}
          <FormControl label="Data">
            <FormLabel>
              Data
            </FormLabel>
            <SingleDatepicker
              id="owner"
              name="owner"
              propsConfigs={{
                dateNavBtnProps: {
                  colorScheme: "gray"
                },
                dayOfMonthBtnProps: {
                  defaultBtnProps: {
                    borderColor: "blackAlpha.300",
                    _hover: {
                      background: "black",
                      color: "white",
                    }
                  },
                  selectedBtnProps: {
                    background: "black",
                    color: "white",
                  },
                  todayBtnProps: {
                    borderColor: "blackAlpha.300",
                    background: "gray.50",
                    color: "black",
                  }
                },
              }}
              date={value}
              onDateChange={setValue}
            />
          </FormControl>
        </Flex>
      </CardBody>
    </Card>
  );
};

export const EntityParameter = (props: Parameter.PEntity) => {
  // All entities
  const [entities, setEntities] = useState([] as EntityModel[]);

  // Data state
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState("");

  // Status state
  // const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const result = getData(`/entities`);

    // Handle the response from the database
    result.then((value) => {
      setEntities(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {

      }

      // setIsLoaded(true);
    });
    return;
  }, []);

  return (
    <Card minW={"xs"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLabel>Entity</TagLabel>
            </Tag>

            <Badge bg={"green.200"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove &&
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<CloseIcon />}
              color={"white"}
              background={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          }
        </Flex>
      </CardHeader>

      <CardBody pt={"0"}>
        <Flex direction={"column"} gap={"4"} p={"2"} justify={"space-between"} align={"center"}>
          {/* Parameter name */}
          <FormControl label="Name">
            <FormLabel htmlFor={"name"}>
              Name
            </FormLabel>
            <Input
              id="name"
              placeholder="Name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              disabled={props.disabled}
              required
            />
          </FormControl>

          {/* Parameter data */}
          <FormControl label="Data">
            <FormLabel>
              Data
            </FormLabel>
            {props.disabled ?
              <Linky
                type="entities"
                id={value}
              />
            :
              <Select
                title="Select Entity"
                value={value}
                disabled={props.disabled}
                onChange={(event) => {
                  console.info(event.target.labels);
                  setValue(event.target.value.toString());
                }}
              >
                {entities.map((entity) => {
                  return (
                    <option value={entity._id}>{entity.name}</option>
                  );
                })};
              </Select>
            }
          </FormControl>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default { NumberParameter, StringParameter, URLParameter, DateParameter, EntityParameter };
