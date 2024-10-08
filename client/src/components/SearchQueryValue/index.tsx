import React, { useEffect, useState } from "react";
import { Input, Flex, Select, Text } from "@chakra-ui/react";
import { ValueEditorProps } from "react-querybuilder";

// Custom components
import SearchSelect from "@components/SearchSelect";

// Custom types
import { IGenericItem, IValueType } from "@types";

// Utility imports
import _ from "lodash";

const SearchQueryValue = ({
  field,
  value,
  handleOnChange,
}: ValueEditorProps) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [selected, setSelected] = useState({} as IGenericItem);

  // `Attribute` field state
  const [valueType, setValueType] = useState("text" as IValueType);
  const [valueInputType, setValueInputType] = useState("text");
  const [operators, setOperators] = useState(["contains", "does not contain"]);

  const updateValueType = (updatedType: IValueType) => {
    switch (updatedType) {
      case "text":
      case "url":
        setValueInputType("text");
        setOperators(["contains", "does not contain"]);
        break;
      case "date":
        setValueInputType("datetime-local");
        setOperators(["equals", ">", "<"]);
        break;
      case "number":
        setValueInputType("number");
        setOperators(["equals", ">", "<"]);
        break;
    }
    setValueType(updatedType);
  };

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
        <Flex
          gap={"2"}
          direction={"column"}
          align={"center"}
          p={"2"}
          rounded={"md"}
          border={"1px"}
          borderColor={"gray.300"}
          w={"100%"}
        >
          <Flex direction={"row"} gap={"2"} align={"center"} w={"100%"}>
            <Text fontWeight={"semibold"} fontSize={"sm"}>
              Value:
            </Text>
            <Select
              value={valueType}
              onChange={(event) =>
                updateValueType(event.target.value as IValueType)
              }
            >
              <option value={"text"}>Text</option>
              <option value={"url"}>URL</option>
              <option value={"number"}>Number</option>
              <option value={"date"}>Date</option>
            </Select>
            <Select placeholder={operators[0]}>
              {operators.map((operator) => (
                <option>{operator}</option>
              ))}
            </Select>
          </Flex>
          <Flex w={"100%"}>
            <Input
              type={valueInputType}
              placeholder={"Value"}
              value={inputValue}
              onChange={handleInputChange}
              minW={"200px"}
              rounded={"md"}
              size={"sm"}
              backgroundColor={"white"}
              data-testid={"value-editor"}
            />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default SearchQueryValue;
