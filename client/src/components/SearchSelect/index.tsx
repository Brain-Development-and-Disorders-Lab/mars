import React, { useState } from "react";
import {
  Input,
  Button,
  Flex,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

import { EntityModel, IGenericItem, SearchSelectProps } from "@types";

// Utility imports
import { debounce } from "lodash";
import _ from "lodash";
import { gql, useLazyQuery } from "@apollo/client";

const SearchSelect = (props: SearchSelectProps) => {
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
  const [results, setResults] = useState([] as EntityModel[]);
  const [showResults, setShowResults] = useState(false);

  const [inputValue, setInputValue] = useState("");

  const toast = useToast();

  // Function to fetch entities based on the search term
  const fetchEntities = debounce(async (query) => {
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
  }, 200);

  /**
   * Handle clicking the `Input` componet dropdown
   */
  const onInputClick = () => {
    if (props?.isDisabled !== true) {
      setShowResults(!showResults);
    }
  };

  /**
   * Handle search text input
   * @param event Input event
   */
  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
    if (inputValue.length > 2) {
      fetchEntities(inputValue);
    }
  };

  /**
   * Handle selecting an Entity from the search results
   * @param entity Selected Entity
   */
  const handleSelectEntity = (entity: IGenericItem) => {
    setInputValue("");
    setResults([]);
    setShowResults(false);

    // Invoke the `onChange` callback if specified
    props.onChange?.(entity);
  };

  return (
    <Flex pos={"relative"} w={"100%"}>
      <InputGroup size={"sm"} onClick={onInputClick}>
        <Input
          placeholder={props?.placeholder || "Select Entity"}
          value={props.value?.name || ""}
          backgroundColor={"white"}
          data-testid={"value-editor"}
          size={"sm"}
          isDisabled={props?.isDisabled || false}
          isReadOnly
        />
        <InputRightElement>
          {showResults ? <Icon name={"c_up"} /> : <Icon name={"c_down"} />}
        </InputRightElement>
      </InputGroup>
      {showResults && (
        <Flex
          w={"100%"}
          p={"2"}
          mt={"9"}
          gap={"2"}
          direction={"column"}
          bg={"white"}
          border={"1px"}
          borderColor={"gray.200"}
          borderRadius={"sm"}
          shadow={"md"}
          position={"absolute"}
          zIndex={"2"}
        >
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            Results: {results.length}
          </Text>
          <Input
            size={"sm"}
            placeholder={"Search"}
            value={inputValue}
            onChange={handleInputChange}
            autoFocus
          />
          <Flex
            direction={"column"}
            maxH={"200px"}
            overflowY={"auto"}
            gap={"2"}
            p={"0"}
          >
            {results.map((entity: IGenericItem) => (
              <Flex key={`e_${entity._id}`}>
                <Button
                  key={entity._id}
                  variant={"ghost"}
                  onClick={() => handleSelectEntity(entity)}
                  width={"full"}
                  isDisabled={loading}
                  size={"sm"}
                >
                  <Flex w={"100%"} justify={"left"}>
                    {entity.name}
                  </Flex>
                </Button>
              </Flex>
            ))}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default SearchSelect;
