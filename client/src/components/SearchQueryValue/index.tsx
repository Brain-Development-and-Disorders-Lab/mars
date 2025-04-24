import React, { useEffect, useState } from "react";
import {
  Input,
  Flex,
  Select,
  createListCollection,
  Portal,
} from "@chakra-ui/react";
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
  const [operatorsCollection, setOperatorsCollection] = useState(
    createListCollection({ items: ["contains", "does not contain"] }),
  );

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
        setOperatorsCollection(
          createListCollection({ items: ["contains", "does not contain"] }),
        );
        setAttributeValueOperator("contains");
        break;
      case "date":
        setAttributeValueInputType("date");
        setOperatorsCollection(
          createListCollection({ items: ["equals", ">", "<"] }),
        );
        setAttributeValueOperator("equals");
        break;
      case "number":
        setAttributeValueInputType("number");
        setOperatorsCollection(
          createListCollection({ items: ["equals", ">", "<"] }),
        );
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
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <Flex>
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

      {/* Relationships */}
      {_.isEqual("relationships", field) && (
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
            {/* Value type `Select` */}
            <Select.Root
              key={"select-value-type"}
              size={"sm"}
              collection={createListCollection({
                items: ["Text", "URL", "Number", "Date"],
              })}
              onValueChange={(details) =>
                updateValueType(details.items[0] as IValueType)
              }
            >
              <Select.HiddenSelect />
              <Select.Label>Select Value Type</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder={"Select Value type"} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {["Text", "URL", "Number", "Date"].map((valueType) => (
                      <Select.Item item={valueType} key={valueType}>
                        {valueType}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>

            {/* Operator `Select` */}
            <Select.Root
              key={"select-operator"}
              size={"sm"}
              collection={operatorsCollection}
              onValueChange={(details) =>
                handleOperatorChange(details.items[0])
              }
            >
              <Select.HiddenSelect />
              <Select.Label>Select Operator</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder={"Select Operator"} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {operatorsCollection.items.map((operator) => (
                      <Select.Item item={operator} key={operator}>
                        {operator}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
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
