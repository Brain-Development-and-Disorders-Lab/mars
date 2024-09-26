import React, { useEffect, useState } from "react";
import { Input, Flex, Select } from "@chakra-ui/react";
import { ValueEditorProps } from "react-querybuilder";

// Custom components
import SearchSelect from "@components/SearchSelect";

// Custom types
import { IGenericItem } from "@types";

// Utility imports
import _ from "lodash";

const SearchQueryValue = ({
  field,
  value,
  handleOnChange,
}: ValueEditorProps) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [selected, setSelected] = useState({} as IGenericItem);

  /**
   * Handle the input value changing
   * @param event Event object and data
   */
  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
    handleOnChange(event.target.value);
  };

  // Bubble up a change from the `SearchSelect` components
  useEffect(() => {
    handleOnChange(selected._id);
  }, [selected]);

  return (
    <Flex w={"100%"}>
      {/* Name and Description */}
      {_.includes(["name", "description"], field) && (
        <Input
          placeholder={_.capitalize(field)}
          value={inputValue}
          onChange={handleInputChange}
          minW={"300px"}
          rounded={"md"}
          size={"sm"}
          backgroundColor={"white"}
          data-testid={"value-editor"}
        />
      )}

      {/* Origins and Products */}
      {_.includes(["origins", "products"], field) && (
        <SearchSelect
          value={selected}
          resultType={"entity"}
          onChange={setSelected}
        />
      )}

      {/* Projects */}
      {_.isEqual("projects", field) && (
        <SearchSelect
          value={selected}
          resultType={"project"}
          onChange={setSelected}
        />
      )}

      {/* Attributes */}
      {_.isEqual("attributes", field) && (
        <Flex gap={"2"}>
          <Select placeholder={"Type"}>
            <option>Text</option>
            <option>Number</option>
            <option>Date</option>
            <option>URL</option>
          </Select>
          <Select placeholder={"contains"}>
            <option>contains</option>
            <option>does not contain</option>
            <option>between</option>
            <option>equals</option>
            <option>&gt;</option>
            <option>&lt;</option>
          </Select>
        </Flex>
      )}

      {/* Values */}
      {_.isEqual("values", field) && (
        <Flex gap={"2"}>
          <Flex w={"100%"}>
            <Select placeholder={"Type"}>
              <option>Text</option>
              <option>Number</option>
              <option>Date</option>
              <option>URL</option>
            </Select>
          </Flex>
          <Input
            placeholder={_.capitalize(field)}
            value={inputValue}
            onChange={handleInputChange}
            minW={"300px"}
            rounded={"md"}
            size={"sm"}
            backgroundColor={"white"}
            data-testid={"value-editor"}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default SearchQueryValue;
