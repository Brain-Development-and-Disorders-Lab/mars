// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  EmptyState,
  Flex,
  Heading,
  Input,
  Menu,
  Portal,
  Spacer,
  Spinner,
  Tabs,
  Tag,
  Text,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTableRemix from "@components/DataTableRemix";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// `react-querybuilder` imports
import QueryBuilder, {
  defaultOperators,
  defaultRuleProcessorMongoDB,
  Field,
  formatQuery,
  RuleGroupType,
  RuleProcessor,
  RuleType,
} from "react-querybuilder";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import * as ReactDnD from "react-dnd";
import * as ReactDndHtml5Backend from "react-dnd-html5-backend";
import { QueryBuilderChakra } from "@react-querybuilder/chakra";

// SearchQueryValue component for searching Entity fields
import SearchQueryValue from "@components/SearchQueryValue";

// Custom hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Existing and custom types
import { EntityModel, DataTableAction } from "@types";

// Utility functions and libraries
import { request } from "@database/functions";
import _ from "lodash";
import { createColumnHelper } from "@tanstack/react-table";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility libraries and functions
import FileSaver from "file-saver";
import slugify from "slugify";
import dayjs from "dayjs";
import { gql, useLazyQuery } from "@apollo/client";
import { JSONPath } from "jsonpath-plus";

const Search = () => {
  const [query, setQuery] = useState("");

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();
  const { breakpoint } = useBreakpoint();

  // Store results as a set of IDs
  const [results, setResults] = useState([] as Partial<EntityModel>[]);
  const [visibleColumns, setVisibleColumns] = useState({});

  // Include archived Entities
  const [showArchived, setShowArchived] = useState(false);

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
          owner
          archived
          description
          projects
          attributes {
            _id
            name
            description
            values {
              _id
              name
              type
              data
            }
          }
        }
      }
    }
  `;
  const [searchText, { error }] = useLazyQuery(SEARCH_TEXT);

  const runSearch = async () => {
    // Initial check if a specific ID search was not found
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    const results = await searchText({
      variables: {
        query: query,
        resultType: "entity",
        isBuilder: false,
        showArchived: showArchived,
      },
    });

    if (results.data.search) {
      setResults(results.data.search);
    }

    if (error) {
      setIsError(true);
      toaster.create({
        title: "Error",
        type: "error",
        description: error.message,
        duration: 4000,
        closable: true,
      });
    }

    setIsSearching(false);
  };

  const onTabChange = () => {
    // Reset search state
    setResults([]);
    setHasSearched(false);
  };

  // Effect to adjust column visibility
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      description: !isMobile,
      owner: !isMobile,
      created: !isMobile,
    });
  }, [breakpoint]);

  const searchResultColumnHelper = createColumnHelper<EntityModel>();
  const searchResultColumns = [
    searchResultColumnHelper.accessor("name", {
      cell: (info) => (
        <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
          <Tooltip
            content={info.getValue()}
            disabled={info.getValue().length < 20}
            showArrow
          >
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 20 })}
            </Text>
          </Tooltip>
          <Button
            size="2xs"
            mx={"1"}
            variant="subtle"
            colorPalette="gray"
            aria-label={"View Entity"}
            onClick={() => navigate(`/entities/${info.row.original._id}`)}
          >
            View
            <Icon name={"a_right"} size={"xs"} />
          </Button>
        </Flex>
      ),
      header: "Name",
    }),
    searchResultColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Tooltip
            content={info.getValue()}
            disabled={info.getValue().length < 30}
          >
            <Text fontSize={"xs"} lineClamp={1}>
              {_.truncate(info.getValue(), { length: 30 })}
            </Text>
          </Tooltip>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    searchResultColumnHelper.accessor("owner", {
      cell: (info) => {
        return (
          <ActorTag
            orcid={info.getValue()}
            fallback={"Unknown User"}
            size={"sm"}
            inline
          />
        );
      },
      header: "Owner",
    }),
    searchResultColumnHelper.accessor("attributes", {
      cell: (info) => {
        return (
          <Tag.Root colorPalette={"green"}>
            <Tag.Label fontSize={"xs"}>
              {_.isUndefined(info.getValue()) ? 0 : info.getValue().length}
            </Tag.Label>
          </Tag.Root>
        );
      },
      header: "Attributes",
    }),
    searchResultColumnHelper.accessor("archived", {
      cell: (info) => {
        return (
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Icon
              name={info.getValue() ? "archive" : "check"}
              color={info.getValue() ? "orange" : "green"}
            />
            <Text
              fontWeight={"semibold"}
              fontSize={"xs"}
              color={info.getValue() ? "orange" : "green"}
            >
              {info.getValue() ? "Archived" : "Active"}
            </Text>
          </Flex>
        );
      },
      header: "Status",
    }),
  ];
  const searchResultActions: DataTableAction[] = [
    {
      label: "Export Entities CSV",
      icon: "download",
      action: async (table, rows) => {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        const response = await request<any>("POST", "/entities/export", {
          entities: toExport,
        });
        if (response.success) {
          FileSaver.saveAs(
            new Blob([response.data]),
            slugify(
              `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.csv`,
            ),
          );
        }

        table.resetRowSelection();
      },
    },
    {
      label: "Export Entities JSON",
      icon: "download",
      action: async (table, rows: any) => {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        const response = await request<any>("POST", "/entities/export", {
          entities: toExport,
          format: "json",
        });
        if (response.success) {
          FileSaver.saveAs(
            new Blob([response.data]),
            slugify(
              `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`,
            ),
          );
        }

        table.resetRowSelection();
      },
    },
  ];

  const advancedQueryFields: Field[] = [
    {
      name: "name",
      label: "Name",
      operators: [
        { name: "=", label: "is" },
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain", "beginsWith", "endsWith"].includes(
            operator.name,
          ),
        ),
      ],
    },
    {
      name: "description",
      label: "Description",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "projects",
      label: "Projects",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "relationships",
      label: "Relationships",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "attributes",
      label: "Attributes",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
  ];

  // Setup the initial query
  const initialAdvancedQuery: RuleGroupType = {
    combinator: "and",
    rules: [],
  };

  /**
   * Custom function for processing specific fields within a search query,
   * specifically `relationships`
   * @param {RuleType} rule Rule for processing value
   * @return {any}
   */
  const ruleProcessor: RuleProcessor = (rule: RuleType): any => {
    if (rule.field === "name") {
      const value = { $regex: new RegExp(rule.value, "gi").toString() };
      if (rule.operator === "doesNotContain") {
        return {
          name: {
            $not: value,
          },
        };
      } else if (rule.operator === "contains") {
        return {
          name: value,
        };
      } else {
        return defaultRuleProcessorMongoDB(rule);
      }
    } else if (rule.field === "relationships") {
      // Handle `relationships` field
      if (rule.operator === "doesNotContain") {
        // If `doesNotContain`, include `$not`
        return {
          relationships: {
            $not: {
              $elemMatch: {
                "target._id": rule.value,
              },
            },
          },
        };
      } else {
        return {
          relationships: {
            $elemMatch: {
              "target._id": rule.value,
            },
          },
        };
      }
    } else if (rule.field === "attributes") {
      // Parse the custom rule
      const customRule = JSON.parse(rule.value);

      // Create a base custom rule structure
      const processedCustomRules: Record<string, any>[] = [
        { "attributes.values.type": customRule.type },
      ];

      // Append query components depending on the specified operator
      if (customRule.operator === "contains") {
        processedCustomRules.push({
          "attributes.values.data": {
            $regex: new RegExp(customRule.value, "gi").toString(),
          },
        });
      } else if (customRule.operator === "does not contain") {
        processedCustomRules.push({
          "attributes.values.data": {
            $not: {
              $regex: new RegExp(customRule.value, "gi").toString(),
            },
          },
        });
      } else if (customRule.operator === "equals") {
        if (customRule.type === "number") {
          processedCustomRules.push({
            "attributes.values.data": {
              $eq: parseFloat(customRule.value),
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $eq: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          });
        }
      } else if (customRule.operator === ">") {
        if (customRule.type === "number") {
          processedCustomRules.push({
            "attributes.values.data": {
              $gt: parseFloat(customRule.value),
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $gt: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          });
        }
      } else if (customRule.operator === "<") {
        if (customRule.type === "number") {
          processedCustomRules.push({
            "attributes.values.data": {
              $lt: parseFloat(customRule.value),
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $lt: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          });
        }
      }

      // Handle the operator
      if (rule.operator === "doesNotContain") {
        return { $nor: processedCustomRules };
      } else {
        return { $and: processedCustomRules };
      }
    }

    // Default rule applied
    return defaultRuleProcessorMongoDB(rule);
  };

  // Query to search by text value
  const SEARCH_ADVANCED = gql`
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
          owner
          archived
          description
          projects
          attributes {
            _id
            name
            description
            values {
              _id
              name
              type
              data
            }
          }
        }
      }
    }
  `;
  const [searchAdvanced, { error: searchAdvancedError }] =
    useLazyQuery(SEARCH_ADVANCED);

  // State to hold the query
  const [advancedQuery, setAdvancedQuery] = useState(initialAdvancedQuery);
  const [isValid, setIsValid] = useState(false);

  const onSearchBuiltQuery = async () => {
    setIsSearching(true);
    setHasSearched(true);

    // Format the query in `mongodb` format before sending
    const results = await searchAdvanced({
      variables: {
        query: JSON.stringify(
          formatQuery(advancedQuery, {
            format: "mongodb_query",
            ruleProcessor: ruleProcessor,
          }),
        ),
        resultType: "entity",
        isBuilder: true,
        showArchived: false,
      },
      fetchPolicy: "network-only",
    });

    if (results.data.search) {
      setResults(results.data.search);
    }

    if (searchAdvancedError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: searchAdvancedError.message,
        duration: 4000,
        closable: true,
      });
    }

    setIsSearching(false);
  };

  /**
   * Validate the query as it changes
   * @param {RuleGroupType} query Query to validate
   */
  const validateQuery = (query: RuleGroupType) => {
    if (query.rules.length > 0) {
      // Validation involves making sure all fields have a value
      // Extract all `value` statements from the query
      const values = JSONPath({
        path: "$..value",
        json: query,
        resultType: "path",
      });
      for (const value of values) {
        // Break the path down into an array of keys
        const path: string[] = [];
        for (let key of value.slice(2, -1).split("][")) {
          // Remove the quotes from the key
          key = key.replace(/'/g, "");
          path.push(key);
        }

        // Iterate down the path until the `value` statement is found
        let currentLevel = query as any;
        for (const key of path) {
          if (key in currentLevel) {
            // If the key is a `value` statement, check if it is valid
            if (key === "value") {
              if (
                _.isUndefined(currentLevel[key]) ||
                currentLevel[key] === ""
              ) {
                setIsValid(false);
                return;
              }
            } else {
              // Otherwise, continue down the path
              currentLevel = currentLevel[key];
            }
          }
        }
      }
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  useEffect(() => {
    // Validate the query as it changes
    validateQuery(advancedQuery);
  }, [advancedQuery]);

  return (
    <Content isError={isError}>
      <Flex direction={"column"} p={"1"} gap={"1"}>
        {/* Page header */}
        <Flex
          direction={"row"}
          p={"1"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"1"} w={"100%"}>
            <Icon name={"search"} size={"sm"} />
            <Text fontSize={"md"} fontWeight={"semibold"}>
              Search
            </Text>
          </Flex>
        </Flex>

        {/* Search components */}
        <Tabs.Root
          w={"100%"}
          size={"sm"}
          defaultValue={"text"}
          variant={"subtle"}
          onValueChange={onTabChange}
        >
          <Tabs.List p={"1"} gap={"1"} pb={"0"}>
            <Flex gap={"1"} align={"center"}>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                Search Using:
              </Text>
              <Tabs.Trigger
                value={"text"}
                disabled={isSearching}
                fontSize={"xs"}
                gap={"1"}
              >
                <Icon name={"text"} size={"xs"} />
                Text
              </Tabs.Trigger>
              <Tabs.Trigger
                value={"advanced"}
                disabled={isSearching}
                fontSize={"xs"}
                gap={"1"}
              >
                <Icon name={"search_query"} size={"xs"} />
                Query Builder
              </Tabs.Trigger>
            </Flex>
          </Tabs.List>

          {/* Text search */}
          <Tabs.Content value={"text"} p={"1"}>
            <Flex direction={"column"} gap={"1"}>
              {/* Search options */}
              <Flex align={"center"} gap={"1"}>
                <Menu.Root size={"sm"}>
                  <Menu.Trigger asChild>
                    <Button
                      variant={"outline"}
                      colorPalette={"gray"}
                      size={"xs"}
                      rounded={"md"}
                    >
                      <Icon name={"settings"} size={"xs"} />
                      Search Options
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.ItemGroup>
                          <Menu.CheckboxItem
                            fontSize={"xs"}
                            key={"archived"}
                            value={"archived"}
                            checked={showArchived}
                            onCheckedChange={(event) => setShowArchived(event)}
                          >
                            Show Archived Entities
                            <Menu.ItemIndicator />
                          </Menu.CheckboxItem>
                        </Menu.ItemGroup>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>

                <Menu.Root size={"sm"}>
                  <Menu.Trigger asChild>
                    <Button
                      variant={"outline"}
                      colorPalette={"gray"}
                      size={"xs"}
                      rounded={"md"}
                      disabled
                    >
                      <Icon name={"filter"} size={"xs"} />
                      Search Filters
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content></Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Flex>

              {/* Search input and submit */}
              <Flex
                w={"100%"}
                direction={"row"}
                gap={"1"}
                align={"center"}
                border={"1px"}
                borderColor={"gray.300"}
                rounded={"md"}
              >
                <Flex w={"100%"}>
                  <Input
                    size={"xs"}
                    rounded={"md"}
                    value={query}
                    placeholder={"Search..."}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyUp={(event) => {
                      // Listen for "Enter" key when entering a query
                      if (event.key === "Enter" && query !== "") {
                        runSearch();
                      }
                    }}
                  />
                </Flex>

                <Spacer />

                <Button
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"gray"}
                  variant={"outline"}
                  disabled={query === ""}
                  onClick={() => {
                    setQuery("");
                    setHasSearched(false);
                    setResults([]);
                    setIsSearching(false);
                  }}
                >
                  Clear
                </Button>

                <Button
                  aria-label={"Search"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  disabled={query === ""}
                  onClick={() => runSearch()}
                >
                  Search
                  <Icon name={"search"} size={"xs"} />
                </Button>
              </Flex>
            </Flex>
          </Tabs.Content>

          {/* Query builder */}
          <Tabs.Content value={"advanced"} p={"1"}>
            <Flex direction={"column"} gap={"1"}>
              <Flex direction={"column"} gap={"1"}>
                <QueryBuilderChakra>
                  <QueryBuilderDnD
                    dnd={{ ...ReactDnD, ...ReactDndHtml5Backend }}
                  >
                    <QueryBuilder
                      controlClassnames={{
                        queryBuilder: "queryBuilder-branches",
                      }}
                      fields={advancedQueryFields}
                      query={advancedQuery}
                      onQueryChange={setAdvancedQuery}
                      controlElements={{ valueEditor: SearchQueryValue }}
                      enableDragAndDrop
                    />
                  </QueryBuilderDnD>
                </QueryBuilderChakra>
                <Flex justify={"right"} gap={"1"}>
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"gray"}
                    variant={"outline"}
                    disabled={advancedQuery.rules.length === 0}
                    onClick={() => {
                      setAdvancedQuery(initialAdvancedQuery);
                      setHasSearched(false);
                      setResults([]);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    aria-label={"Run Query"}
                    colorPalette={"green"}
                    size={"xs"}
                    rounded={"md"}
                    onClick={() => onSearchBuiltQuery()}
                    disabled={!isValid}
                  >
                    Search
                    <Icon name={"search"} size={"xs"} />
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          </Tabs.Content>
        </Tabs.Root>

        {/* Search Results */}
        <Flex gap={"1"} p={"1"} w={"100%"}>
          {isSearching && (
            <Flex w={"full"} minH={"200px"} align={"center"} justify={"center"}>
              <Spinner size={"lg"} color={"gray.600"} />
            </Flex>
          )}

          {hasSearched && !isSearching && (
            <Flex
              id={"resultsContainer"}
              direction={"column"}
              w={"100%"}
              gap={"1"}
            >
              {results.length > 0 ? (
                <>
                  <Heading
                    id={"resultsHeading"}
                    size={"sm"}
                    fontWeight={"semibold"}
                  >
                    {results.length} result
                    {results.length > 1 ? "s" : ""}
                  </Heading>
                  <DataTableRemix
                    columns={searchResultColumns}
                    visibleColumns={visibleColumns}
                    selectedRows={{}}
                    data={results}
                    showPagination
                    showSelection
                    actions={searchResultActions}
                  />
                </>
              ) : (
                <Flex
                  w={"100%"}
                  minH={"200px"}
                  align={"center"}
                  justify={"center"}
                >
                  <Text
                    fontSize={"sm"}
                    fontWeight={"semibold"}
                    color={"gray.600"}
                  >
                    No results found
                  </Text>
                </Flex>
              )}
            </Flex>
          )}

          {!hasSearched && !isSearching && (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"search"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  Enter a search query to find Entities
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Search;
