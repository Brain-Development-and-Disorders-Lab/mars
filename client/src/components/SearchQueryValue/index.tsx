import React, { useState, useEffect } from "react";
import { Input, Button, Flex, Text, useToast } from "@chakra-ui/react";

import { ValueEditorProps } from "react-querybuilder";
import { EntityModel } from "@types";

// Utility imports
import { debounce } from "lodash";
import _ from "lodash";
import { gql, useLazyQuery } from "@apollo/client";

const SearchQueryValue = ({
  field,
  value,
  handleOnChange,
}: ValueEditorProps) => {
  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search($query: String, $isBuilder: Boolean, $limit: Int) {
      search(query: $query, isBuilder: $isBuilder, limit: $limit) {
        _id
        name
        description
      }
    }
  `;
  const [searchText, { loading, error }] = useLazyQuery(SEARCH_TEXT);

  const [inputValue, setInputValue] = useState(value || "");
  const [results, setResults] = useState([] as EntityModel[]);
  const [showResults, setShowResults] = useState(false);

  const toast = useToast();

  // Function to fetch entities based on the search term
  const fetchEntities = debounce(async (query) => {
    if (field === "origins" || field === "products") {
      const results = await searchText({
        variables: {
          query: query,
          isBuilder: false,
          limit: 100,
        },
      });

      if (results.data.search) {
        setResults(results.data.search);
      } else {
        setResults([]);
      }

      if (error) {
        toast({
          title: "Error",
          status: "error",
          description: error.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      } else {
        setShowResults(true);
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
      setResults([]);
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
    setResults([]);
    setShowResults(false);
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
      {showResults && (
        <Flex
          w={"100%"}
          p={"2"}
          mt={"10"}
          gap={"2"}
          direction={"column"}
          bg={"gray.50"}
          borderRadius={"md"}
          position={"absolute"}
          maxW={"200px"}
        >
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            Results: {results.length}
          </Text>
          <Flex
            direction={"column"}
            maxH={"200px"}
            overflowY={"auto"}
            gap={"2"}
            p={"0"}
          >
            {results.map((entity: any) => (
              <Flex key={`e_${entity._id}`}>
                <Button
                  key={entity._id}
                  onClick={() => handleSelectEntity(entity)}
                  width={"full"}
                  isDisabled={loading}
                >
                  {entity.name}
                </Button>
              </Flex>
            ))}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default SearchQueryValue;
