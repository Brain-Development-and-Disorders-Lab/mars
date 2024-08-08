import React, { useState, useEffect } from "react";
import { Input, Button, VStack, Flex } from "@chakra-ui/react";

import { EntityModel } from "@types";

// Utility imports
import { debounce } from "lodash";
import { request } from "@database/functions";
import { ValueEditorProps } from "react-querybuilder";
import _ from "lodash";

const SearchQueryValue = ({
  field,
  value,
  handleOnChange,
}: ValueEditorProps) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [searchResults, setSearchResults] = useState([] as EntityModel[]);

  // Function to fetch entities based on the search term
  const fetchEntities = debounce(async (query) => {
    if (field === "origins" || field === "products") {
      const response = await request<EntityModel[]>(
        "POST",
        "/entities/searchByTerm",
        { query },
      );
      if (response.success) {
        setSearchResults(response.data || []);
      } else {
        setSearchResults([]);
      }
    }
  }, 300);

  useEffect(() => {
    // useEffect hook for handling `origin` and `product` fields
    if (
      (field === "origins" || field === "products") &&
      inputValue.length > 2
    ) {
      fetchEntities(inputValue);
    } else {
      setSearchResults([]);
    }
  }, [inputValue, field]);

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);

    // If this is a standard text input, ensure `handleOnChange` is called
    if (field !== "origins" && field !== "products") {
      handleOnChange(event.target.value);
    }
  };

  const handleSelectEntity = (entity: any) => {
    handleOnChange(entity._id);
    setInputValue(entity.name);
    setSearchResults([]);
  };

  return (
    <Flex>
      <Input
        placeholder={_.capitalize(field)}
        value={inputValue}
        onChange={handleInputChange}
        minW={"300px"}
        backgroundColor={"white"}
        data-testid="value-editor"
      />
      {searchResults.length > 0 && (
        <VStack
          gap={2}
          w={"100%"} // Ensures the stack takes full width of the parent
          p={2} // Adds padding around the stack for better spacing
          bg={"gray.50"} // Sets a light background for the list
          borderRadius={"md"} // Rounds the corners
        >
          <Flex w={"full"} p={2} textAlign={"center"} color={"gray.600"}>
            Please select an Entity:
          </Flex>
          {searchResults.map((entity: any) => (
            <Button
              key={entity._id}
              onClick={() => handleSelectEntity(entity)}
              variant={"ghost"}
              justifyContent={"start"} // Aligns text to the left
              width="full" // Button takes full width of its container
              _hover={{ bg: "gray.100" }} // Changes background on hover for better interaction
            >
              {entity.name}
            </Button>
          ))}
        </VStack>
      )}
    </Flex>
  );
};

export default SearchQueryValue;
