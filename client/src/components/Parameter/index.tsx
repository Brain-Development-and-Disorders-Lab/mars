// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  DateInput,
  FormField,
  Select,
  Spinner,
  TextInput,
} from "grommet/components";
import { Close } from "grommet-icons";

// Database and models
import { getData } from "src/lib/database/getData";
import { ParameterProps, ParameterStruct, EntityModel } from "types";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";
import Linky from "src/components/Linky";

// Constants
const VALID_TYPES = ["number", "url", "date", "string", "entity"];

const Parameter = (props: ParameterProps) => {
  const [name, setName] = useState(props.name);
  const [type, setType] = useState(props.type);
  const [data, setData] = useState(props.data);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [entityData, setEntityData] = useState([] as EntityModel[]);
  const [optionData, setOptionData] = useState([] as EntityModel[]);

  useEffect(() => {
    const entities = getData(`/entities`);

    // Handle the response from the database
    entities.then((value) => {
      setEntityData(value);
      setOptionData(value);

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
        options={optionData.map((entity) => {
          return { name: entity.name, id: entity._id };
        })}
        labelKey="name"
        value={data as string}
        valueKey="name"
        onChange={({ value }) => {
          setData(value);
        }}
        searchPlaceholder="Search..."
        onSearch={(query) => {
          const escapedText = query.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
          const exp = new RegExp(escapedText, "i");
          setOptionData(entityData.filter((entity) => exp.test(entity.name)));
        }}
        disabled={props.disabled}
        required
      />
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
    <Box direction="row" gap="medium" fill="horizontal">
      <Box direction="row" gap="small" justify="center">
        {/* Parameter name */}
        <FormField label="Name">
          <TextInput
            width="medium"
            placeholder="Parameter name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            disabled={props.disabled}
            required
          />
        </FormField>

        {/* Parameter type */}
        <FormField label="Type">
          <Select
            width="medium"
            options={VALID_TYPES}
            value={type}
            onChange={({ option }) => {
              setType(option);
            }}
            disabled={props.disabled}
          />
        </FormField>

        {/* Parameter data */}
        <FormField label="Data">
          {isLoaded ? dataElement : <Spinner size="small" />}
        </FormField>
      </Box>
      <Box justify="center">
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
      </Box>
      {isError && <ErrorLayer message={errorMessage} />}
    </Box>
  );
};

export default Parameter;
