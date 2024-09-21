import React, { useContext, useEffect, useState } from "react";
import {
  Input,
  Button,
  Flex,
  useToast,
  InputGroup,
  InputRightElement,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

import { EntityModel, IGenericItem, SearchSelectProps } from "@types";

// Utility imports
import { debounce } from "lodash";
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import { WorkspaceContext } from "src/Context";

const SearchSelect = (props: SearchSelectProps) => {
  // Query to retrieve Entities
  const GET_ENTITIES = gql`
    query GetEntities($limit: Int, $archived: Boolean) {
      entities(limit: $limit, archived: $archived) {
        _id
        name
      }
    }
  `;
  const { loading, data, refetch } = useQuery<{
    entities: EntityModel[];
  }>(GET_ENTITIES, {
    variables: {
      limit: 20,
      archived: true,
    },
  });

  const [entities, setEntities] = useState([] as EntityModel[]);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entities) {
      // Unpack all the Entity data
      setEntities(data.entities);
    }
  }, [data]);

  const { workspace } = useContext(WorkspaceContext);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search($query: String, $isBuilder: Boolean, $showArchived: Boolean) {
      search(
        query: $query
        isBuilder: $isBuilder
        showArchived: $showArchived
      ) {
        _id
        name
        description
      }
    }
  `;
  const [searchText, { loading: searchLoading, error: searchError }] =
    useLazyQuery(SEARCH_TEXT);

  // State
  const [results, setResults] = useState([] as EntityModel[]);
  const [showResults, setShowResults] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const toast = useToast();

  // Function to fetch entities based on the search term
  const fetchEntities = debounce(async (query) => {
    const results = await searchText({
      variables: {
        query: query,
        isBuilder: false,
        showArchived: false,
      },
    });

    if (results.data.search) {
      setResults(results.data.search);

      // Once results have been updated, set `hasSearched` state
      setHasSearched(true);
    } else {
      setResults([]);
    }

    if (searchError) {
      toast({
        title: "Error",
        status: "error",
        description: searchError.message,
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
    if (event.target.value === "") {
      // Case where search input is empty, reset `hasSearched` state
      setHasSearched(false);
    }

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
    // Reset state
    setInputValue("");
    setResults([]);
    setShowResults(false);
    setHasSearched(false);

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
          rounded={"md"}
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
          borderColor={"gray.300"}
          borderRadius={"sm"}
          shadow={"md"}
          position={"absolute"}
          zIndex={"2"}
        >
          <Input
            size={"sm"}
            rounded={"md"}
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
            {/* Has searched, search operation complete, multiple results */}
            {hasSearched &&
              searchLoading === false &&
              results.length > 0 &&
              results.map((entity: IGenericItem) => (
                <Flex key={`e_${entity._id}`} p={"0"}>
                  <Button
                    key={entity._id}
                    variant={"ghost"}
                    onClick={() => handleSelectEntity(entity)}
                    width={"full"}
                    isDisabled={searchLoading}
                    size={"sm"}
                  >
                    <Flex w={"100%"} justify={"left"}>
                      {entity.name}
                    </Flex>
                  </Button>
                </Flex>
              ))}

            {/* Has searched, search operation complete, no results */}
            {hasSearched && searchLoading === false && results.length === 0 && (
              <Flex p={"2"}>
                <Text fontSize={"sm"} fontWeight={"semibold"}>
                  No Results
                </Text>
              </Flex>
            )}

            {/* Has not yet searched, search operation complete */}
            {!hasSearched &&
              searchLoading === false &&
              entities.map((entity: IGenericItem) => (
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

            {/* Search operation in-progress */}
            {searchLoading === true && (
              <Flex>
                <Skeleton height={"20px"} />
              </Flex>
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default SearchSelect;
