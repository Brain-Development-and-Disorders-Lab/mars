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
  const [selectedEntity, setSelectedEntity] = useState({} as IGenericItem);

  useEffect(() => {
    handleOnChange(selectedEntity._id);
  }, [selectedEntity]);

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
            value={selectedEntity}
            resultType={"entity"}
            onChange={setSelectedEntity}
          />
        );
      case "project":
        return (
          <SearchSelect
            value={selectedEntity}
            resultType={"project"}
            onChange={setSelectedEntity}
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
