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

  useEffect(() => {
    handleOnChange(selected._id);
  }, [selected]);

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
    handleOnChange(event.target.value);
  };

  const getSelectComponent = (field: string) => {
    switch (field) {
      case "origins":
      case "products":
        return (
          <SearchSelect
            value={selected}
            resultType={"entity"}
            onChange={setSelected}
          />
        );
      case "projects":
        return (
          <SearchSelect
            value={selected}
            resultType={"project"}
            onChange={setSelected}
          />
        );
      case "attributes":
        return (
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
        );
      case "values":
        return (
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
        );
      default:
        return (
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
        );
    }
  };

  return <Flex w={"100%"}>{getSelectComponent(field)}</Flex>;
};

export default SearchQueryValue;
