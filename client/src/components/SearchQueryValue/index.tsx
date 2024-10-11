import React, { useEffect, useState } from "react";
import { Input, Flex, Select } from "@chakra-ui/react";
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
  const [operators, setOperators] = useState(["contains", "does not contain"]);

  // `Attribute` field state
  const [attributeValue, setAttributeValue] = useState("");
  const [attributeValueType, setAttributeValueType] = useState(
    "text" as IValueType,
  );
  const [attributeValueInputType, setAttributeValueInputType] =
    useState("text");
  const [attributeValueOperator, setAttributeValueOperator] =
    useState("contains");

  const updateValueType = (updatedType: IValueType) => {
    switch (updatedType) {
      case "text":
      case "url":
        setAttributeValueInputType("text");
        setOperators(["contains", "does not contain"]);
        setAttributeValueOperator("contains");
        break;
      case "date":
        setAttributeValueInputType("date");
        setOperators(["equals", ">", "<"]);
        setAttributeValueOperator("equals");
        break;
      case "number":
        setAttributeValueInputType("number");
        setOperators(["equals", ">", "<"]);
        setAttributeValueOperator("equals");
        break;
    }
    setAttributeValueType(updatedType);
  };

  /**
   * Handle the `operator` value being changed
   * @param operator Updated `operator` value
   */
  const handleOperatorChange = (operator: string) => {
    setAttributeValueOperator(operator);
  };

  /**
   * Handle the input value changing
   * @param event Event object and data
   */
  const handleInputChange = (event: any) => {
    if (_.isEqual(field, "attributes")) {
      // Handle `attributes` field differently
      setAttributeValue(event.target.value);
    } else {
      setInputValue(event.target.value);
      handleOnChange(event.target.value);
    }
  };

  // Effect to update the search query parameters
  useEffect(() => {
    handleOnChange(
      JSON.stringify({
        type: attributeValueType,
        operator: attributeValueOperator,
        value: attributeValue,
      }),
    );
  }, [attributeValueType, attributeValueOperator, attributeValue]);

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
            <Select
              className={"rule-value-type"}
              value={attributeValueType}
              onChange={(event) =>
                updateValueType(event.target.value as IValueType)
              }
            >
              <option value={"text"}>Text</option>
              <option value={"url"}>URL</option>
              <option value={"number"}>Number</option>
              <option value={"date"}>Date</option>
            </Select>
            <Select
              className={"rule-value-operators"}
              value={attributeValueOperator}
              onChange={(event) => handleOperatorChange(event.target.value)}
            >
              {operators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </Select>
          </Flex>
          <Flex w={"100%"}>
            <Input
              className={"rule-value-input"}
              type={attributeValueInputType}
              placeholder={"Value"}
              value={attributeValue}
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
