import {
  TabPanel,
  Flex,
  FormControl,
  FormLabel,
  Select,
  Input,
  Spacer,
  IconButton,
  VStack,
  Tag,
  Button,
  useToast,
  Box,
} from "@chakra-ui/react";
import {
  QueryFocusType,
  QueryParameters,
  QueryQualifier,
  QuerySubQualifier,
  QueryOperator,
  EntityModel,
} from "@types";
import Icon from "@components/Icon";
import QueryBuilder, { formatQuery } from "react-querybuilder";

import _ from "lodash";
import React, { useState } from "react";
import { request } from "@database/functions";
import QueryBuilderEditorCustomValue from "./QueryBuilderEditorCustomValue";

interface QueryBuilderTabProps {
  [key: string]: any;
}

const QueryBuilderTab: React.FC<QueryBuilderTabProps> = ({
  queryType,
  setQueryType,
  queryParameter,
  setQueryParameter,
  queryQualifier,
  setQueryQualifier,
  querySubQualifier,
  setQuerySubQualifier,
  queryOperator,
  setQueryOperator,
  queryKey,
  setQueryKey,
  queryValue,
  setQueryValue,
  queryComponents,
  setQueryComponents,
  setHasSearched,
  setResults,
  isLoaded,
  projects,
  entities,
  runQuerySearch,
  setIsSearching,
}: QueryBuilderTabProps) => {
  const fields = [
    { name: "name", label: "Name" },
    { name: "description", label: "Description" },
    { name: "project", label: "Project" },
    { name: "origin", label: "Origin" },
    { name: "product", label: "Product" },
    { name: "attribute", label: "Attribute" },
    // Add other fields as needed
  ];

  // State to hold the query
  const [query, setQuery] = useState({});

  const toast = useToast();

  // Function to handle query changes
  const onQueryChange = (q: any) => {
    setQuery(formatQuery(q, "mongodb"));
  };

  const onSearchBuiltQuery = async () => {
    setIsSearching(true);
    setHasSearched(true);

    const response = await request<any>("POST", "/search/query_built", {
      query: query,
    });
    if (response.success) {
      setResults(response.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not get search results.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setIsSearching(false);
  };

  return (
    <TabPanel>
      <Box>
        <QueryBuilder
          fields={fields}
          onQueryChange={onQueryChange}
          controlElements={{ valueEditor: QueryBuilderEditorCustomValue }}
          // You can add more props as needed
        />
        <Flex direction={"row"} w={"100%"} gap={"4"} justify={"right"} mt={2}>
          <Button
            aria-label={"Run Query"}
            colorScheme={"green"}
            size={"sm"}
            rightIcon={<Icon name={"search"} />}
            onClick={() => onSearchBuiltQuery()}
            isDisabled={_.isEqual(query, {})}
          >
            Run Query
          </Button>
        </Flex>
      </Box>
      {false /* disableled Legacy Query builder components */ && (
        <Flex w={"100%"} direction={"column"} gap={"4"}>
          <Flex
            direction={"column"}
            p={"2"}
            rounded={"md"}
            border={"2px"}
            borderColor={"gray.200"}
          >
            <Flex direction={"row"} p={"2"} gap={"4"} wrap={"wrap"}>
              {/* Query builder components */}
              <FormControl w={"auto"}>
                <FormLabel>Target</FormLabel>
                <Select
                  value={queryType}
                  onChange={(event) =>
                    setQueryType(event.target.value as QueryFocusType)
                  }
                >
                  <option>Entity</option>
                </Select>
              </FormControl>

              <FormControl w={"auto"}>
                <FormLabel>Parameter</FormLabel>
                <Select
                  w={"auto"}
                  value={queryParameter}
                  onChange={(event) => {
                    setQueryParameter(event.target.value as QueryParameters);
                    // Set the query qualifier to prevent selection of disabled options
                    setQueryQualifier("Contains");
                  }}
                >
                  <option>Name</option>
                  <option>Description</option>
                  <option>Projects</option>
                  <option>Origins</option>
                  <option>Products</option>
                  <option>Attributes</option>
                </Select>
              </FormControl>

              <FormControl w={"auto"}>
                <FormLabel>Qualifier</FormLabel>
                <Select
                  w={"auto"}
                  value={queryQualifier}
                  onChange={(event) =>
                    setQueryQualifier(event.target.value as QueryQualifier)
                  }
                >
                  <option>Contains</option>
                  <option>Does Not Contain</option>
                  <option
                    disabled={
                      _.isEqual(queryParameter, "Projects") ||
                      _.isEqual(queryParameter, "Origins") ||
                      _.isEqual(queryParameter, "Products") ||
                      _.isEqual(queryParameter, "Attributes")
                    }
                  >
                    Is Not
                  </option>
                  <option
                    disabled={
                      _.isEqual(queryParameter, "Projects") ||
                      _.isEqual(queryParameter, "Origins") ||
                      _.isEqual(queryParameter, "Products") ||
                      _.isEqual(queryParameter, "Attributes")
                    }
                  >
                    Is
                  </option>
                </Select>
              </FormControl>

              <FormControl w={"auto"}>
                <FormLabel>Value: {queryParameter}</FormLabel>
                {/* Projects */}
                {_.isEqual(queryParameter, "Projects") && isLoaded && (
                  <Select
                    w={"auto"}
                    placeholder={"Select Project"}
                    value={queryKey}
                    onChange={(event) => {
                      setQueryKey(event.target.value);
                      setQueryValue(
                        event.target.options[event.target.selectedIndex]
                          .innerText,
                      );
                    }}
                  >
                    {projects.map((project: any) => {
                      return (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      );
                    })}
                  </Select>
                )}

                {/* Origins and Products */}
                {_.includes(["Origins", "Products"], queryParameter) &&
                  isLoaded && (
                    <Select
                      w={"auto"}
                      placeholder={"Select Entity"}
                      value={queryKey}
                      onChange={(event) => {
                        setQueryKey(event.target.value);
                        setQueryValue(
                          event.target.options[event.target.selectedIndex]
                            .innerText,
                        );
                      }}
                    >
                      {entities.map((entity: EntityModel) => {
                        return (
                          <option key={entity._id} value={entity._id}>
                            {entity.name}
                          </option>
                        );
                      })}
                    </Select>
                  )}

                {/* Name and Description */}
                {_.includes(["Name", "Description"], queryParameter) && (
                  <Input
                    w={"auto"}
                    value={queryValue}
                    placeholder={"Value"}
                    onChange={(event) => {
                      setQueryKey(event.target.value);
                      setQueryValue(event.target.value);
                    }}
                  />
                )}

                {/* Attributes */}
                {_.includes(["Attributes"], queryParameter) && (
                  <Flex gap={"4"}>
                    <Select
                      w={"auto"}
                      value={querySubQualifier}
                      onChange={(event) => {
                        setQuerySubQualifier(
                          event.target.value as QuerySubQualifier,
                        );
                      }}
                    >
                      <option>Date</option>
                      <option>Text</option>
                      <option>Number</option>
                      <option>URL</option>
                      <option>Entity</option>
                      <option>Select</option>
                    </Select>
                    {_.isEqual(querySubQualifier, "Date") && (
                      <Input
                        w={"auto"}
                        value={queryValue}
                        placeholder={"Value"}
                        type={"date"}
                        onChange={(event) => {
                          setQueryKey(event.target.value);
                          setQueryValue(event.target.value);
                        }}
                      />
                    )}
                    {_.isEqual(querySubQualifier, "Number") && (
                      <Input
                        w={"auto"}
                        value={queryValue}
                        placeholder={"Value"}
                        type={"number"}
                        onChange={(event) => {
                          setQueryKey(event.target.value);
                          setQueryValue(event.target.value);
                        }}
                      />
                    )}
                    {_.isEqual(querySubQualifier, "Entity") && isLoaded && (
                      <Select
                        w={"auto"}
                        placeholder={"Select Entity"}
                        value={queryKey}
                        onChange={(event) => {
                          setQueryKey(event.target.value);
                          setQueryValue(
                            event.target.options[event.target.selectedIndex]
                              .innerText,
                          );
                        }}
                      >
                        {entities.map((entity: EntityModel) => {
                          return (
                            <option key={entity._id} value={entity._id}>
                              {entity.name}
                            </option>
                          );
                        })}
                      </Select>
                    )}
                    {_.includes(
                      ["Text", "URL", "Select"],
                      querySubQualifier,
                    ) && (
                      <Input
                        w={"auto"}
                        value={queryValue}
                        placeholder={"Value"}
                        type={"text"}
                        onChange={(event) => {
                          setQueryKey(event.target.value);
                          setQueryValue(event.target.value);
                        }}
                      />
                    )}
                  </Flex>
                )}
              </FormControl>

              <Spacer />

              <IconButton
                aria-label={"Add query component"}
                colorScheme={"telegram"}
                icon={<Icon name={"add"} />}
                isDisabled={_.isEqual(queryValue, "")}
                onClick={() => {
                  setQueryComponents([
                    ...queryComponents,
                    {
                      operator: queryOperator,
                      focus: queryType,
                      parameter: queryParameter,
                      qualifier: queryQualifier,
                      subQualifier: querySubQualifier,
                      key: queryKey,
                      value: queryValue,
                    },
                  ]);

                  // Reset query input
                  setQueryType("Entity");
                  setQueryParameter("Name");
                  setQueryQualifier("Contains");
                  setQuerySubQualifier("Date");
                  setQueryKey("");
                  setQueryValue("");

                  // Clear search results
                  setHasSearched(false);
                  setResults([]);
                }}
              />
            </Flex>

            <VStack p={"2"} gap={"4"} align={"start"}>
              {queryComponents?.map((component: any, index: any) => {
                return (
                  <Flex
                    key={`qc_${index}`}
                    direction={"row"}
                    gap={"4"}
                    w={"fit-content"}
                    align={"center"}
                    p={"2"}
                    bg={"gray.50"}
                    rounded={"md"}
                    wrap={"wrap"}
                  >
                    {index > 0 && (
                      <Select
                        w={"auto"}
                        value={_.isEqual(index, 0) ? "" : component.operator}
                        onChange={(event) => {
                          // Update the component operator state
                          const updatedQueryComponents =
                            _.cloneDeep(queryComponents);
                          updatedQueryComponents[index].operator = event.target
                            .value as QueryOperator;
                          setQueryComponents(updatedQueryComponents);

                          // Update the operator state
                          setQueryOperator(event.target.value as QueryOperator);
                        }}
                      >
                        <option>AND</option>
                        <option>OR</option>
                      </Select>
                    )}

                    <Flex direction={"row"} gap={"4"} h={"fit-content"}>
                      <Tag colorScheme={"blue"}>{component.focus}</Tag>
                      <Tag colorScheme={"purple"}>{component.parameter}</Tag>
                      <Tag colorScheme={"green"}>{component.qualifier}</Tag>
                      {_.isEqual("Attributes", component.parameter) && (
                        <Tag colorScheme={"yellow"}>
                          {component.subQualifier}
                        </Tag>
                      )}
                    </Flex>

                    {_.includes(
                      ["Origins", "Products", "Projects"],
                      component.parameter,
                    ) &&
                      isLoaded && (
                        <Select
                          w={"fit-content"}
                          value={component.value}
                          disabled
                        >
                          <option>{component.value}</option>
                        </Select>
                      )}
                    {_.includes(
                      ["Name", "Description"],
                      component.parameter,
                    ) && (
                      <Input
                        w={"fit-content"}
                        value={component.value}
                        disabled
                      />
                    )}
                    {_.isEqual("Attributes", component.parameter) &&
                      _.isEqual(component.subQualifier, "Date") && (
                        <Input
                          w={"fit-content"}
                          type={"date"}
                          value={component.value}
                          disabled
                        />
                      )}
                    {_.isEqual("Attributes", component.parameter) &&
                      _.includes(
                        ["Text", "Number", "URL", "Select"],
                        component.subQualifier,
                      ) && (
                        <Input
                          w={"fit-content"}
                          type={"text"}
                          value={component.value}
                          disabled
                        />
                      )}
                    {_.isEqual("Attributes", component.parameter) &&
                      _.isEqual(component.subQualifier, "Entity") && (
                        <Select
                          w={"fit-content"}
                          value={component.value}
                          disabled
                        >
                          <option>{component.value}</option>
                        </Select>
                      )}

                    <IconButton
                      aria-label={"Remove search component"}
                      icon={<Icon name={"delete"} />}
                      colorScheme={"red"}
                      onClick={() => {
                        // Remove the query component
                        let updatedQueryComponents =
                          _.cloneDeep(queryComponents);
                        updatedQueryComponents.splice(index, 1);
                        setQueryComponents(updatedQueryComponents);

                        // Clear search results
                        setHasSearched(false);
                        setResults([]);
                      }}
                    />
                  </Flex>
                );
              })}
            </VStack>
          </Flex>
          <Flex direction={"row"} w={"100%"} gap={"4"} justify={"right"}>
            <Button
              rightIcon={<Icon name={"rewind"} />}
              isDisabled={queryComponents?.length === 0}
              onClick={() => {
                setQueryComponents([]);
                setHasSearched(false);
                setResults([]);
              }}
            >
              Reset
            </Button>
            <IconButton
              aria-label={"Search"}
              colorScheme={"green"}
              icon={<Icon name={"search"} />}
              isDisabled={queryComponents?.length === 0}
              onClick={() => runQuerySearch()}
            />
          </Flex>
        </Flex>
      )}
    </TabPanel>
  );
};

export default QueryBuilderTab;
