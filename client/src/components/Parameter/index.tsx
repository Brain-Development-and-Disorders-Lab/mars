import React, { useEffect, useState } from "react";
import {
  Flex,
  FormControl,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  Link,
  Select,
  Spacer,
  Text,
  useToast,
} from "@chakra-ui/react";
import { BsArrowUpRight, BsBox, BsCalendarWeek, BsGraphUp, BsLink45Deg, BsTextareaT, BsTrash } from "react-icons/bs";
import { getData } from "src/database/functions";
import { EntityModel, Parameter } from "@types";
import Linky from "@components/Linky";
import dayjs from "dayjs";

export const DateParameter = (props: Parameter.Date) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(dayjs(props.data).toISOString());

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
    <Flex direction={"row"} gap={"4"} w={"100%"} align={"center"}>
      {props.disabled ? (
        <Flex w={"100%"} gap={"4"} align={"center"} wrap={["wrap", "nowrap"]}>
          <Icon as={BsCalendarWeek} />
          <Heading size={"sm"}>{name}</Heading>
          <Spacer />
          <Text>{dayjs(value).format("DD MMM HH:mm")}</Text>
        </Flex>
      ) : (
        <Flex w={"100%"} gap={"4"} align={"center"} wrap={["wrap", "nowrap"]}>
          <FormControl isInvalid={name === ""}>
            <InputGroup>
              <InputLeftAddon children={<Icon as={BsCalendarWeek} />} />
              <Input
                id={"name"}
                placeholder={"Name"}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                disabled={props.disabled}
              />
            </InputGroup>
          </FormControl>
          <Flex w={"100%"} gap={"4"}>
            <FormControl isRequired>
              <Input
                placeholder="Select Date and Time"
                size="md"
                type="datetime-local"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                disabled={props.disabled}
              />
            </FormControl>
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<Icon as={BsTrash} />}
              colorScheme={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export const TextParameter = (props: Parameter.Text) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(props.data);

  // Propagate data updates
  useEffect(() => {
    if (props.onUpdate) {
      props.onUpdate({
        identifier: props.identifier,
        name: name,
        type: "text",
        data: value,
      });
    }
  }, [name, value]);

  return (
    <Flex direction={"row"} gap={"4"} w={"100%"} align={"center"}>
      {props.disabled ? (
        <Flex w={"100%"} gap={"4"} align={"center"}>
          <Icon as={BsTextareaT} />
          <Heading size={"sm"}>{name}</Heading>
          <Spacer />
          <Text>{value}</Text>
        </Flex>
      ) : (
        <Flex w={"100%"} gap={"4"} align={"center"} wrap={["wrap", "nowrap"]}>
          <FormControl isRequired isInvalid={name === ""}>
            <InputGroup>
            <InputLeftAddon children={<Icon as={BsTextareaT} />} />
              <Input
                id="name"
                placeholder="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={props.disabled}
                required
              />
            </InputGroup>
          </FormControl>
          <Flex w={"100%"} gap={"4"}>
            <FormControl isRequired isInvalid={value === ""}>
              <Input
                name="data"
                placeholder={"Text"}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                disabled={props.disabled}
                required
              />
            </FormControl>
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<Icon as={BsTrash} />}
              colorScheme={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export const NumberParameter = (props: Parameter.Number) => {
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
    <Flex direction={"row"} gap={"4"} w={"100%"} align={"center"}>
      {/* Parameter name */}
      {props.disabled ? (
        <Flex w={"100%"} gap={"4"} align={"center"}>
          <Icon as={BsGraphUp} w={"4"} h={"4"} />
          <Heading size={"sm"}>{name}</Heading>
          <Spacer />
          <Text>{value}</Text>
        </Flex>
      ) : (
        <Flex w={"100%"} gap={"4"} align={"center"} wrap={["wrap", "nowrap"]}>
          <FormControl isRequired isInvalid={name === ""}>
            <InputGroup>
              <InputLeftAddon children={<Icon as={BsGraphUp} w={"4"} h={"4"} />} />
              <Input
                id="name"
                placeholder="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={props.disabled}
                required
              />
            </InputGroup>
          </FormControl>
          <Flex w={"100%"} gap={"4"}>
            <FormControl isRequired>
              <Input
                name="data"
                placeholder={"0"}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                disabled={props.disabled}
                required
              />
            </FormControl>
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<Icon as={BsTrash} />}
              colorScheme={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export const URLParameter = (props: Parameter.URL) => {
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
    <Flex direction={"row"} gap={"4"} w={"100%"} align={"center"}>
      {/* Parameter name */}
      {props.disabled ? (
        <Flex w={"100%"} gap={"4"} align={"center"}>
          <Icon as={BsLink45Deg} w={"4"} h={"4"} />
          <Heading size={"sm"}>{name}</Heading>
          <Spacer />
          <Link href={value} color="dark-1" isExternal>
            {value}
            <Icon as={BsArrowUpRight} mx='2px' />
          </Link>
        </Flex>
      ) : (
        <Flex w={"100%"} gap={"4"} align={"center"} wrap={["wrap", "nowrap"]}>
          <FormControl isRequired isInvalid={name === ""}>
            <InputGroup>
              <InputLeftAddon children={<Icon as={BsLink45Deg} w={"4"} h={"4"} />} />
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
            </InputGroup>
          </FormControl>
          <Flex w={"100%"} gap={"4"}>
            <FormControl isRequired isInvalid={value === ""}>
              <Input
                name="url"
                placeholder="URL"
                value={value}
                onChange={(event) => setValue(event.target.value.toString())}
                disabled={props.disabled}
                required
              />
            </FormControl>
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<Icon as={BsTrash} />}
              colorScheme={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export const EntityParameter = (props: Parameter.Entity) => {
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
    getData(`/entities`).then((value) => {
      setEntities(value);
      setIsLoaded(true);
    }).catch((_error) => {
      toast({
        title: "Error",
        description: "Could not retrieve Entities.",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }).finally(() => {
      setIsLoaded(true);
    });
    return;
  }, []);

  return (
    <Flex direction={"row"} gap={"4"} w={"100%"} align={"center"}>
      {/* Parameter name */}
      {props.disabled ? (
        <Flex w={"100%"} gap={"4"} align={"center"}>
          <Icon as={BsBox} w={"4"} h={"4"} />
          <Heading size={"sm"}>{name}</Heading>
          <Spacer />
          <Linky type="entities" id={value} />
        </Flex>
      ) : (
        <Flex w={"100%"} gap={"4"} align={"center"} wrap={["wrap", "nowrap"]}>
          <FormControl isRequired isInvalid={name === ""}>
            <InputGroup>
              <InputLeftAddon children={<Icon as={BsBox} w={"4"} h={"4"} />} />
              <Input
                id="name"
                placeholder="Name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                disabled={props.disabled}
              />
            </InputGroup>
          </FormControl>
          <Flex w={"100%"} gap={"4"}>
            <FormControl isRequired isInvalid={value === ""}>
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
                      <option key={entity._id} value={entity._id}>
                        {entity.name}
                      </option>
                    );
                  })}
                ;
              </Select>
            </FormControl>
            <IconButton
              aria-label={"Remove Parameter"}
              key={`remove-${props.identifier}`}
              icon={<Icon as={BsTrash} />}
              colorScheme={"red"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
            />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default {
  NumberParameter,
  TextParameter,
  URLParameter,
  DateParameter,
  EntityParameter,
};
