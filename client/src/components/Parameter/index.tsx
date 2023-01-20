import React, { useEffect, useState } from "react";
import { Flex, FormControl, Icon, IconButton, Input, Link, Select, useToast } from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { CloseIcon } from "@chakra-ui/icons";
import { AiOutlineBlock, AiOutlineLink } from "react-icons/ai";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";
import { getData } from "src/database/functions";
import { EntityModel, Parameter } from "@types";
import Linky from "@components/Linky";

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
    <Flex direction={"row"} gap={"2"} align={"center"}>
      <Icon as={MdDateRange} w={"8"} h={"8"}/>

      {/* Parameter name */}
      <FormControl>
        <Input
          id={"name"}
          placeholder={"Name"}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          disabled={props.disabled}
        />
      </FormControl>

      {/* Parameter data */}
      <FormControl>
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
    <Flex direction={"row"} gap={"2"} align={"center"}>
      <Icon as={MdOutlineTextFields} w={"8"} h={"8"}/>

      {/* Parameter name */}
      <FormControl label="Name">
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
        <Input
          name="data"
          placeholder={""}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={props.disabled}
          required
        />
      </FormControl>

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
    <Flex direction={"row"} gap={"2"} align={"center"}>
      <Icon as={RiNumbersLine} w={"8"} h={"8"}/>

      {/* Parameter name */}
      <FormControl label="Name">
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
        <Input
          name="data"
          placeholder={"0"}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          disabled={props.disabled}
          required
        />
        </FormControl>

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
    <Flex direction={"row"} gap={"2"} align={"center"}>
      <Icon as={AiOutlineLink} w={"8"} h={"8"}/>

      {/* Parameter name */}
      <FormControl label="Name">
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

      {/* Remove button */}
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
    <Flex direction={"row"} gap={"2"} align={"center"}>
      <Icon as={AiOutlineBlock} w={"8"} h={"8"}/>

      {/* Parameter name */}
      <FormControl>
        <Input
          id="name"
          placeholder="Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          disabled={props.disabled}
        />
      </FormControl>

      {/* Parameter data */}
      <FormControl>
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

      {/* Remove button */}
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
  );
};

export default { NumberParameter, StringParameter, URLParameter, DateParameter, EntityParameter };
