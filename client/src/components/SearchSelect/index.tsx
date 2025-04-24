import React, { useEffect, useState } from "react";
import {
  Input,
  Button,
  Flex,
  InputGroup,
  InputRightElement,
  Text,
  Spinner,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

import { EntityModel, IGenericItem, SearchSelectProps } from "@types";

// Utility imports
import { debounce } from "lodash";
import { gql, useLazyQuery } from "@apollo/client";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

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
  const [getEntities, { loading: entitiesLoading, error: entitiesError }] =
    useLazyQuery<{
      entities: IGenericItem[];
    }>(GET_ENTITIES, {
      variables: {
        limit: 20,
        archived: true,
      },
    });

  // Query to retrieve Entities
  const GET_PROJECTS = gql`
    query GetProjects($limit: Int) {
      projects(limit: $limit) {
        _id
        name
      }
    }
  `;
  const [getProjects, { loading: projectsLoading, error: projectsError }] =
    useLazyQuery<{
      projects: IGenericItem[];
    }>(GET_PROJECTS);

  const [placeholder, setPlaceholder] = useState("Select Result");
  const [options, setOptions] = useState([] as IGenericItem[]);

  const getSelectOptions = async () => {
    if (props.resultType == "entity") {
      // Get Entities
      const result = await getEntities({
        variables: {
          limit: 20,
          archived: true,
        },
      });

      if (result.data?.entities) {
        setOptions(result.data.entities);
      }
    } else {
      // Get Projects
      const result = await getProjects({
        variables: {
          limit: 20,
        },
      });

      if (result.data?.projects) {
        setOptions(result.data.projects);
      }
    }

    if (entitiesError || projectsError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Error while retrieving options for selection",
        duration: 4000,
        closable: true,
      });
    }
  };

  // Retrieve the options on component load, depending on the specified target
  useEffect(() => {
    getSelectOptions();

    // Set the placeholder text
    if (props.placeholder) {
      setPlaceholder(props.placeholder);
    } else if (props.resultType === "entity") {
      setPlaceholder("Select Entity");
    } else if (props.resultType === "project") {
      setPlaceholder("Select Project");
    }
  }, []);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    getSelectOptions();
  }, [workspace]);

  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search(
      $query: String
      $resultType: String
      $isBuilder: Boolean
      $showArchived: Boolean
    ) {
      search(
        query: $query
        resultType: $resultType
        isBuilder: $isBuilder
        showArchived: $showArchived
      ) {
        __typename
        ... on Entity {
          _id
          name
          description
        }
        ... on Project {
          _id
          name
          description
        }
      }
    }
  `;
  const [searchText, { loading: searchLoading, error: searchError }] =
    useLazyQuery(SEARCH_TEXT);

  // State
  const [results, setResults] = useState([] as EntityModel[]);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Function to fetch results based on the search term
  const fetchResults = debounce(async (query) => {
    const results = await searchText({
      variables: {
        query: query,
        resultType: props.resultType,
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
      toaster.create({
        title: "Error",
        type: "error",
        description: searchError.message,
        duration: 4000,
        closable: true,
      });
    } else {
      setShowResults(true);
    }
  }, 200);

  /**
   * Handle clicking the `Input` componet dropdown
   */
  const onInputClick = () => {
    if (props?.disabled !== true) {
      setShowResults(!showResults);
    }
  };

  /**
   * Handle search text input
   * @param event Input event
   */
  const handleInputChange = async (event: any) => {
    if (event.target.value === "") {
      // Case where search input is empty, reset `hasSearched` state
      setHasSearched(false);
    }

    if (event.target.value.length > 0) {
      await fetchResults(event.target.value);
    }
  };

  /**
   * Handle selecting an result from the collection of search results
   * @param {IGenericItem} result Selected result
   */
  const handleSelectResult = (result: IGenericItem) => {
    // Reset state
    setResults([]);
    setShowResults(false);
    setHasSearched(false);

    // Invoke the `onChange` callback if specified
    props.onChange?.(result);
  };

  return (
    <Flex id={props.id || "searchSelect"} pos={"relative"} w={"100%"}>
      <InputGroup size={"sm"} onClick={onInputClick}>
        <Input
          placeholder={placeholder}
          value={props.value?.name || ""}
          backgroundColor={"white"}
          data-testid={"value-editor"}
          size={"sm"}
          rounded={"md"}
          disabled={props?.disabled || false}
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
              results.map((result: IGenericItem) => (
                <Flex key={`r_${result._id}`} p={"0"}>
                  <Button
                    key={result._id}
                    variant={"ghost"}
                    onClick={() => handleSelectResult(result)}
                    width={"full"}
                    disabled={searchLoading}
                    size={"sm"}
                  >
                    <Flex w={"100%"} justify={"left"}>
                      {result.name}
                    </Flex>
                  </Button>
                </Flex>
              ))}

            {/* Has searched, search operation complete, no results */}
            {hasSearched && searchLoading === false && results.length === 0 && (
              <Flex
                w={"100%"}
                minH={"100px"}
                align={"center"}
                justify={"center"}
              >
                <Text fontSize={"sm"} fontWeight={"semibold"}>
                  No Results
                </Text>
              </Flex>
            )}

            {/* Has not yet searched, search operation complete */}
            {!hasSearched &&
              searchLoading === false &&
              options.map((option: IGenericItem) => (
                <Flex key={`o_${option._id}`}>
                  <Button
                    key={option._id}
                    variant={"ghost"}
                    onClick={() => handleSelectResult(option)}
                    width={"full"}
                    disabled={entitiesLoading || projectsLoading}
                    size={"sm"}
                  >
                    <Flex w={"100%"} justify={"left"}>
                      {option.name}
                    </Flex>
                  </Button>
                </Flex>
              ))}

            {/* Search operation in-progress */}
            {searchLoading === true && (
              <Flex
                w={"100%"}
                minH={"100px"}
                align={"center"}
                justify={"center"}
              >
                <Spinner />
              </Flex>
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default SearchSelect;
