// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  DateInput,
  FileInput,
  FormField,
  Select,
  Spinner,
  Text,
  TextInput,
} from "grommet/components";

// Database and models
import { getData } from "src/lib/database/getData";
import { BlockProps, BlockStruct, SampleModel } from "types";

// Custom components
import ErrorLayer from "src/view/components/ErrorLayer";
import Linky from "src/view/components/Linky";

// Constants
const VALID_TYPES = ["number", "file", "url", "date", "string", "sample"];

const Block = (props: BlockProps) => {
  const [name, setName] = useState(props.name);
  const [type, setType] = useState(props.type);
  const [data, setData] = useState(props.data);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [sampleData, setSampleData] = useState([] as SampleModel[]);
  const [optionData, setOptionData] = useState([] as SampleModel[]);

  useEffect(() => {
    const samples = getData(`/samples`);

    // Handle the response from the database
    samples.then((value) => {
      setSampleData(value);
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

  const blockData: BlockStruct = {
    identifier: props.identifier,
    name: name,
    type: type,
    data: data,
  };

  const updateData = () => {
    if (props.dataCallback) {
      props.dataCallback(blockData);
    }
  };

  useEffect(() => {
    updateData();
  }, [data]);

  let dataElement = <Text>Data:</Text>;

  // Set the data input field depending on the selected type
  if (type === "file") {
    // File input
    dataElement = props.disabled ? (
      <Text>Filename</Text>
    ) : (
      <Box background="brand">
        <FileInput
          name="file"
          color="light-1"
          onChange={(event) => {
            if (event) {
              const fileList = event.target.files;
              if (fileList) {
                for (let i = 0; i < fileList.length; i += 1) {
                  const file = fileList[i];
                  console.debug("File:", file);
                }
              }
            }
          }}
          disabled={props.disabled}
        />
      </Box>
    );
  } else if (type === "date") {
    // Date picker
    dataElement = (
      <DateInput
        name="date"
        format="mm/dd/yyyy"
        value={data as string}
        onChange={({ value }) => setData(value.toString())}
        disabled={props.disabled}
      />
    );
  } else if (type === "sample") {
    // Sample picker
    dataElement = props.disabled ? (
      <Linky
        type="samples"
        id={(data as unknown as { name: string; id: string }).id}
      />
    ) : (
      <Select
        options={optionData.map((sample) => {
          return { name: sample.name, id: sample._id };
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
          setOptionData(sampleData.filter((sample) => exp.test(sample.name)));
        }}
        disabled={props.disabled}
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
      />
    );
  }

  return (
    <Box direction="row" gap="small" align="center">
      {/* Block name */}
      <FormField label="Name">
        <TextInput
          width="medium"
          placeholder="Block name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          disabled={props.disabled}
        />
      </FormField>

      {/* Block type */}
      <FormField label="Type">
        <Select
          options={VALID_TYPES}
          value={type}
          onChange={({ option }) => {
            setType(option);
          }}
          disabled={props.disabled}
        />
      </FormField>

      {/* Block data */}
      <FormField label="Data">
        {isLoaded ? dataElement : <Spinner size="small" />}
      </FormField>

      {isError && <ErrorLayer message={errorMessage} />}
    </Box>
  );
};

export default Block;
