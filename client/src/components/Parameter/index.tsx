import React, { useEffect, useState } from "react";
import {
  Flex,
  FormControl,
  Icon,
  IconButton,
  Input,
  Link,
  Select,
  Text,
  useToast,
} from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { AiOutlineLink } from "react-icons/ai";
import { BsBox, BsXLg } from "react-icons/bs";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";
import { getData } from "src/database/functions";
import { EntityModel, Parameter } from "@types";
import Linky from "@components/Linky";
import dayjs from "dayjs";

export const DateParameter = (props: Parameter.Date) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(new Date(props.data));

  // Propagate data updates
  useEffect(() => {
    if (props.onUpdate) {
      props.onUpdate({
        identifier: props.identifier,
        name: name,
        type: "date",
        data: value.toISOString(),
      });
    }
  }, [name, value]);

  return (
    <Flex direction={"row"} gap={"4"} align={"center"}>
      <Icon as={MdDateRange} w={"4"} h={"4"} />

      {/* Parameter name */}
      <FormControl isInvalid={name === ""}>
        {props.disabled ? (
          <Text as={"b"}>{name}</Text>
        ) : (
          <Input
            id={"name"}
            placeholder={"Name"}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            disabled={props.disabled}
          />
        )}
      </FormControl>

      {/* Parameter data */}
      <FormControl isRequired>
        {props.disabled ? (
          <Text>{dayjs(value).format("DD MMM HH:mm")}</Text>
        ) : (
          <SingleDatepicker
            id="owner"
            name="owner"
            propsConfigs={{
              dateNavBtnProps: {
                colorScheme: "gray",
              },
              dayOfMonthBtnProps: {
                defaultBtnProps: {
                  borderColor: "blackAlpha.300",
                  _hover: {
                    background: "black",
                    color: "white",
                  },
                },
                selectedBtnProps: {
                  background: "black",
                  color: "white",
                },
                todayBtnProps: {
                  borderColor: "blackAlpha.300",
                  background: "gray.50",
                  color: "black",
                },
              },
            }}
            date={value}
            onDateChange={setValue}
            disabled={props.disabled}
          />
        )}
      </FormControl>

      {/* Remove Parameter */}
      {props.showRemove && !props.disabled && (
        <IconButton
          aria-label={"Remove Parameter"}
          key={`remove-${props.identifier}`}
          icon={<BsXLg />}
          colorScheme={"red"}
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props.identifier);
            }
          }}
        />
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
    <Flex direction={"row"} gap={"4"} align={"center"}>
      <Icon as={MdOutlineTextFields} w={"4"} h={"4"} />

      {/* Parameter name */}
      <FormControl isRequired isInvalid={name === ""}>
        {props.disabled ? (
          <Text as={"b"}>{name}</Text>
        ) : (
          <Input
            id="name"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={props.disabled}
            required
          />
        )}
      </FormControl>

      {/* Parameter data */}
      <FormControl isRequired isInvalid={value === ""}>
        {props.disabled ? (
          <Text>{value}</Text>
        ) : (
          <Input
            name="data"
            placeholder={"Text"}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={props.disabled}
            required
          />
        )}
      </FormControl>

      {/* Remove Parameter */}
      {props.showRemove && !props.disabled && (
        <IconButton
          aria-label={"Remove Parameter"}
          key={`remove-${props.identifier}`}
          icon={<BsXLg />}
          colorScheme={"red"}
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props.identifier);
            }
          }}
        />
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
    <Flex direction={"row"} gap={"4"} align={"center"}>
      <Icon as={RiNumbersLine} w={"4"} h={"4"} />

      {/* Parameter name */}
      <FormControl isRequired isInvalid={name === ""}>
        {props.disabled ? (
          <Text as={"b"}>{name}</Text>
        ) : (
          <Input
            id="name"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={props.disabled}
            required
          />
        )}
      </FormControl>

      {/* Parameter data */}
      <FormControl isRequired>
        {props.disabled ? (
          <Text>{value}</Text>
        ) : (
          <Input
            name="data"
            placeholder={"0"}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            disabled={props.disabled}
            required
          />
        )}
      </FormControl>

      {/* Remove Parameter */}
      {props.showRemove && !props.disabled && (
        <IconButton
          aria-label={"Remove Parameter"}
          key={`remove-${props.identifier}`}
          icon={<BsXLg />}
          colorScheme={"red"}
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props.identifier);
            }
          }}
        />
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
    <Flex direction={"row"} gap={"4"} align={"center"}>
      <Icon as={AiOutlineLink} w={"4"} h={"4"} />

      {/* Parameter name */}
      <FormControl isRequired isInvalid={name === ""}>
        {props.disabled ? (
          <Text as={"b"}>{name}</Text>
        ) : (
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
        )}
      </FormControl>

      {/* Parameter data */}
      <FormControl isRequired isInvalid={value === ""}>
        {props.disabled ? (
          <Link as={"a"} href={value} color="dark-1" isExternal>
            {value}
            <ExternalLinkIcon mx='2px' />
          </Link>
        ) : (
          <Input
            name="url"
            placeholder="URL"
            value={value}
            onChange={(event) => setValue(event.target.value.toString())}
            disabled={props.disabled}
            required
          />
        )}
      </FormControl>

      {/* Remove button */}
      {props.showRemove && !props.disabled && (
        <IconButton
          aria-label={"Remove Parameter"}
          key={`remove-${props.identifier}`}
          icon={<BsXLg />}
          colorScheme={"red"}
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props.identifier);
            }
          }}
        />
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
    <Flex direction={"row"} gap={"4"} align={"center"}>
      <Icon as={BsBox} w={"4"} h={"4"} />

      {/* Parameter name */}
      <FormControl isRequired isInvalid={name === ""}>
        {props.disabled ? (
          <Text as={"b"}>{name}</Text>
        ) : (
          <Input
            id="name"
            placeholder="Name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            disabled={props.disabled}
          />
        )}
      </FormControl>

      {/* Parameter data */}
      <FormControl isRequired isInvalid={value === ""}>
        {props.disabled ? (
          <Linky type="entities" id={value} />
        ) : (
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
        )}
      </FormControl>

      {/* Remove button */}
      {props.showRemove && !props.disabled && (
        <IconButton
          aria-label={"Remove Parameter"}
          key={`remove-${props.identifier}`}
          icon={<BsXLg />}
          colorScheme={"red"}
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props.identifier);
            }
          }}
        />
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
