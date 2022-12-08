// React and Grommet
import React, { useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Flex, FormControl, FormLabel, IconButton, Input, Link, Select, Tag, TagLabel, TagLeftIcon, useToast } from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { CloseIcon } from "@chakra-ui/icons";
import { AiOutlineBlock, AiOutlineLink } from "react-icons/ai";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";

import { Link as RouterLink } from "react-router-dom";

// Database and models
import { getData } from "src/database/functions";
import { EntityModel, Parameter } from "types";

// Custom components
import Linky from "src/components/Linky";

export const DateParameter = (props: Parameter.PDate) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(new Date(props.data));

  // Propagate data updates
  useEffect(() => {
    if (props.onUpdate) {
      props.onUpdate({
        identifier: props.identifier,
        name: name,
        type: "date",
        data: value,
      });
    }
  }, [name, value]);

  return (
    <Card minW={"xs"} h={"fit-content"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLeftIcon as={MdDateRange} />
              <TagLabel>Date</TagLabel>
            </Tag>

            <Badge bg={"green.200"} visibility={props.disabled ? "hidden" : "visible"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove && !props.disabled &&
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
              Date
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
              disabled={props.disabled}
            />
          </FormControl>
        </Flex>
      </CardBody>
    </Card>
  );
};

export const StringParameter = (props: Parameter.PString) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(props.data);

  // Propagate data updates
  useEffect(() => {
    if (props.onUpdate) {
      props.onUpdate({
        identifier: props.identifier,
        name: name,
        type: "string",
        data: value,
      });
    }
  }, [name, value]);

  return (
    <Card minW={"xs"} h={"fit-content"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLeftIcon as={MdOutlineTextFields} />
              <TagLabel>String</TagLabel>
            </Tag>

            <Badge bg={"green.200"} visibility={props.disabled ? "hidden" : "visible"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove && !props.disabled &&
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
              Value
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

export const NumberParameter = (props: Parameter.PNumber) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(props.data);

  // Propagate data updates
  useEffect(() => {
    if (props.onUpdate) {
      props.onUpdate({
        identifier: props.identifier,
        name: name,
        type: "number",
        data: value,
      });
    }
  }, [name, value]);

  return (
    <Card minW={"xs"} h={"fit-content"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLeftIcon as={RiNumbersLine} />
              <TagLabel>Number</TagLabel>
            </Tag>

            <Badge bg={"green.200"} visibility={props.disabled ? "hidden" : "visible"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove && !props.disabled &&
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
              Value
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

export const URLParameter = (props: Parameter.PURL) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(props.data);

  // Propagate data updates
  useEffect(() => {
    if (props.onUpdate) {
      props.onUpdate({
        identifier: props.identifier,
        name: name,
        type: "url",
        data: value,
      });
    }
  }, [name, value]);

  return (
    <Card minW={"xs"} h={"fit-content"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLeftIcon as={AiOutlineLink} />
              <TagLabel>URL</TagLabel>
            </Tag>

            <Badge bg={"green.200"} visibility={props.disabled ? "hidden" : "visible"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove && !props.disabled &&
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
              URL
            </FormLabel>
            {props.disabled ?
              <Link as={RouterLink} to={value} color="dark-1">
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

export const EntityParameter = (props: Parameter.PEntity) => {
  const toast = useToast();

  // All entities
  const [entities, setEntities] = useState([] as EntityModel[]);

  // Data state
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(props.data);

  // Propagate data updates
  useEffect(() => {
    if (props.onUpdate) {
      props.onUpdate({
        identifier: props.identifier,
        name: name,
        type: "entity",
        data: value,
      });
    }
  }, [name, value]);

  // Status state
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const result = getData(`/entities`);

    // Handle the response from the database
    result.then((value) => {
      setEntities(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        toast({
          title: "Database Error",
          description: value["error"],
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      setIsLoaded(true);
    });
    return;
  }, []);

  return (
    <Card minW={"xs"} h={"fit-content"} shadow={"md"}>
      <CardHeader>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"2"}>
            <Tag>
              <TagLeftIcon as={AiOutlineBlock} />
              <TagLabel>Entity</TagLabel>
            </Tag>

            <Badge bg={"green.200"} visibility={props.disabled ? "hidden" : "visible"}>
              New
            </Badge>
          </Flex>
          {/* Remove Parameter */}
          {props.showRemove && !props.disabled &&
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
              Entity
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
                placeholder={"Select Entity"}
                disabled={props.disabled}
                onChange={(event) => {
                  setValue(event.target.value.toString());
                }}
              >
                {isLoaded &&
                  entities.map((entity) => {
                    return (
                      <option key={entity._id} value={entity._id}>{entity.name}</option>
                    );
                  })
                };
              </Select>
            }
          </FormControl>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default { NumberParameter, StringParameter, URLParameter, DateParameter, EntityParameter };
