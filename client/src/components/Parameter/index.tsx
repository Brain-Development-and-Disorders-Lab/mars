// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Button,
  DateInput,
  FormField,
  Spinner,
  TextInput,
} from "grommet/components";
import { Close } from "grommet-icons";
import { Flex, FormControl, FormLabel, Input, Select } from "@chakra-ui/react";

// Database and models
import { getData } from "src/database/functions";
import { EntityModel, ParameterProps, ParameterStruct, ParameterTypes } from "types";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";
import Linky from "src/components/Linky";

const Parameter = (props: ParameterProps) => {
  const [name, setName] = useState(props.name);
  const [type, setType] = useState(props.type);
  const [data, setData] = useState(props.data);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [entityData, setEntityData] = useState([] as EntityModel[]);

  useEffect(() => {
    const entities = getData(`/entities`);

    // Handle the response from the database
    entities.then((value) => {
      setEntityData(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });
    return;
  }, []);

  const parameterData: ParameterStruct = {
    identifier: props.identifier,
    name: name,
    type: type,
    data: data,
  };

  const updateData = () => {
    if (props.onUpdate) {
      props.onUpdate(parameterData);
    }
  };

  useEffect(() => {
    updateData();
  }, [data]);

  let dataElement;

  // Set the data input field depending on the selected type
  if (type === "date") {
    // Date picker
    dataElement = (
      <DateInput
        name="date"
        format="mm/dd/yyyy"
        value={data as string}
        onChange={({ value }) => setData(value.toString())}
        disabled={props.disabled}
        required
      />
    );
  } else if (type === "entity") {
    // Entity picker
    dataElement = props.disabled ? (
      <Linky
        type="entities"
        id={(data as unknown as { name: string; id: string }).id}
      />
    ) : (
      <Select
        title="Select Entity"
        value={type}
        disabled={props.disabled}
        onChange={(event) => {
          console.info(event.target.labels);
          setData(event.target.value.toString());
        }}
      >
        {entityData.map((entity) => {
          return (
            <option value={entity._id}>{entity.name}</option>
          );
        })};
      </Select>
    );
  } else if (type === "url") {
    // URL field
    dataElement = props.disabled ? (
      <Anchor label={data as string} href={data as string} color="dark-1" />
    ) : (
      <TextInput
        name="url"
        placeholder="URL"
        value={data as string}
        onChange={(event) => setData(event.target.value.toString())}
        disabled={props.disabled}
        required
      />
    );
  } else {
    // Basic data is displayed as-is
    dataElement = (
      <TextInput
        name="data"
        placeholder={type}
        value={data as string | number}
        onChange={(event) => setData(event.target.value)}
        disabled={props.disabled}
        required
      />
    );
  }

  return (
    <Flex direction="row" gap="medium" justify="between">
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

      {/* Parameter type */}
      <FormControl label="Type">
        <Select
          title={"Select Type"}
          name="typeselect"
          value={type}
          disabled={props.disabled}
          onChange={(event) => {
            setType(event.target.value as ParameterTypes);
          }}
        >
          <option value={"string"}>{"String"}</option>
          <option value={"number"}>{"Number"}</option>
          <option value={"url"}>{"URL"}</option>
          <option value={"date"}>{"Date"}</option>
          <option value={"entity"}>{"Entity"}</option>
        </Select>
      </FormControl>

      {/* Parameter data */}
      <FormField label="Data">
        {isLoaded ? dataElement : <Spinner size="small" />}
      </FormField>

      <Flex justify="center">
        {/* Remove Parameter */}
        {props.showRemove && <Button
          key={`remove-${props.identifier}`}
          icon={<Close />}
          primary
          label="Remove"
          color="status-critical"
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props.identifier);
            }
          }}
          reverse
        />}
      </Flex>
      {isError && <ErrorLayer message={errorMessage} />}
    </Flex>
  );
};

export default Parameter;
