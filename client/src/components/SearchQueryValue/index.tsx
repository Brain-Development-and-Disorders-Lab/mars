import React, { useEffect, useState } from "react";
import { Input, Flex } from "@chakra-ui/react";
import { ValueEditorProps } from "react-querybuilder";
import SearchSelect from "@components/SearchSelect";

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

  return (
    <Flex>
      {field === "origins" || field === "products" ? (
        <SearchSelect value={selectedEntity} onChange={setSelectedEntity} />
      ) : (
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
    </Flex>
  );
};

export default SearchQueryValue;
