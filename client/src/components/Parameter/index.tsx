// React and Grommet
import React, { useEffect, useState } from "react";
import { Button, Flex, FormControl, FormLabel, Input, Link, Select } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { SingleDatepicker } from "chakra-dayzed-datepicker";

// Database and models
import { getData } from "src/database/functions";
import { EntityModel, Parameter } from "types";

// Custom components
import Linky from "src/components/Linky";

export const NumberParameter = (props: Parameter.Number) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState(0);

  return (
    <Flex direction={"row"} gap={"4"} p={"2"} justify={"space-between"} align={"center"}>
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
        <Input
          name="data"
          placeholder={"0"}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          disabled={props.disabled}
          required
        />
        </FormControl>

      <Flex justify="center">
        {/* Remove Parameter */}
        {props.showRemove &&
          <Button
            key={`remove-${props.identifier}`}
            rightIcon={<CloseIcon />}
            color={"white"}
            background={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props.identifier);
              }
            }}
          >
            Remove
          </Button>
        }
      </Flex>
    </Flex>
  );
};

export const StringParameter = (props: Parameter.String) => {
  const [name, setName] = useState(props.name);
  const [value, setValue] = useState("");

  return (
    <Flex direction={"row"} gap={"4"} p={"2"} justify={"space-between"} align={"center"}>
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
        <Input
          name="data"
          placeholder={""}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={props.disabled}
          required
        />
      </FormControl>

      <Flex justify="center">
        {/* Remove Parameter */}
        {props.showRemove &&
          <Button
            key={`remove-${props.identifier}`}
            rightIcon={<CloseIcon />}
            color={"white"}
            background={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props.identifier);
              }
            }}
          >
            Remove
          </Button>
        }
      </Flex>
    </Flex>
  );
};

export const URLParameter = (props: Parameter.URL) => {
  const [name, setName] = useState(props.name);
  const [URL, setURL] = useState(props.data);

  return (
    <Flex direction={"row"} gap={"4"} p={"2"} justify={"space-between"} align={"center"}>
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
          <Link href={URL} color="dark-1">
            {URL}
          </Link>
        :
          <Input
            name="url"
            placeholder="URL"
            value={URL}
            onChange={(event) => setURL(event.target.value.toString())}
            disabled={props.disabled}
            required
          />}
      </FormControl>

      <Flex justify="center">
        {/* Remove Parameter */}
        {props.showRemove &&
          <Button
            key={`remove-${props.identifier}`}
            rightIcon={<CloseIcon />}
            color={"white"}
            background={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props.identifier);
              }
            }}
          >
            Remove
          </Button>
        }
      </Flex>
    </Flex>
  );
};

export const DateParameter = (props: Parameter.Date) => {
  const [name, setName] = useState(props.name);

  const [date, setDate] = useState(new Date());

  return (
    <Flex direction={"row"} gap={"4"} p={"2"} justify={"space-between"} align={"center"}>
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
          date={date}
          onDateChange={setDate}
        />
      </FormControl>

      <Flex justify="center">
        {/* Remove Parameter */}
        {props.showRemove &&
          <Button
            key={`remove-${props.identifier}`}
            rightIcon={<CloseIcon />}
            color={"white"}
            background={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props.identifier);
              }
            }}
          >
            Remove
          </Button>
        }
      </Flex>
    </Flex>
  );
};

export const EntityParameter = (props: Parameter.Entity) => {
  // Data state
  const [name, setName] = useState(props.name);
  const [entity, setEntity] = useState("");
  const [entities, setEntities] = useState([] as EntityModel[])

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
    <Flex direction={"row"} gap={"4"} p={"2"} justify={"space-between"} align={"center"}>
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
            id={entity}
          />
        :
          <Select
            title="Select Entity"
            value={entity}
            disabled={props.disabled}
            onChange={(event) => {
              console.info(event.target.labels);
              setEntity(event.target.value.toString());
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

      <Flex justify="center">
        {/* Remove Parameter */}
        {props.showRemove &&
          <Button
            key={`remove-${props.identifier}`}
            rightIcon={<CloseIcon />}
            color={"white"}
            background={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props.identifier);
              }
            }}
          >
            Remove
          </Button>
        }
      </Flex>
    </Flex>
  );
};

export default { NumberParameter, StringParameter, URLParameter, DateParameter, EntityParameter };
