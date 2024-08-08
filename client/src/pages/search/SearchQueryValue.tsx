import React, { useState, useEffect } from "react";
import { Input, Button, VStack, Flex } from "@chakra-ui/react";

// Utility imports
import { debounce } from "lodash";
import { request } from "@database/functions"; // Adjust this import based on your project structure.
import { ValueEditorProps } from "react-querybuilder";
import { EntityModel } from "@types";

const SearchQueryValue = ({
  field,
  value,
  handleOnChange,
}: ValueEditorProps) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [searchResults, setSearchResults] = useState([] as EntityModel[]);

  // Function to fetch entities based on the search term
  const fetchEntities = debounce(async (query) => {
    if (field === "origin" || field === "product") {
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
    if (inputValue.length > 2 && (field === "origin" || field === "product")) {
      fetchEntities(inputValue);
    } else {
      setSearchResults([]);
    }
  }, [inputValue, field]);

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
  };

  const handleSelectEntity = (entity: any) => {
    handleOnChange(entity._id);
    setInputValue(entity.name);
    setSearchResults([]);
  };

  return (
    <Flex>
      <Input
        placeholder={`Search for ${field}`}
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
