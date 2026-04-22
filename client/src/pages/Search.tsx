// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  EmptyState,
  Flex,
  Heading,
  Input,
  Spinner,
  Tabs,
  Tag,
  Text,
  Checkbox,
  Collapsible,
  InputGroup,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// `react-querybuilder` imports
import {
  defaultOperators,
  defaultRuleProcessorMongoDB,
  Field,
  formatQuery,
  RuleGroupType,
  RuleProcessor,
  RuleType,
} from "react-querybuilder";

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

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility libraries and functions
import { ignoreAbort } from "@lib/util";
import FileSaver from "file-saver";
import slugify from "slugify";
import dayjs from "dayjs";
import { JSONPath } from "jsonpath-plus";

// Variables
import { GLOBAL_STYLES } from "@variables";

import SearchQueryBuilder from "@components/SearchQueryBuilder";

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

  const [activeTab, setActiveTab] = useState<"text" | "advanced">("text");
  const [isAISearch, setIsAISearch] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Include archived Entities
  const [showArchived, setShowArchived] = useState(false);

  // Text search filters
  const [textSearchFilters, setTextSearchFilters] = useState({
    startDate: "",
    endDate: "",
    hasAttachments: false,
    hasAttributes: false,
    hasRelationships: false,
  });

  // Collapsible state for text search filters
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Active filter count for text search filters
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search(
      $query: String
      $resultType: String
      $isBuilder: Boolean
      $showArchived: Boolean
      $filters: EntityFilterInput
    ) {
      search(
        query: $query
        resultType: $resultType
        isBuilder: $isBuilder
        showArchived: $showArchived
        filters: $filters
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
  const [searchText, { error }] = useLazyQuery<{ search: EntityModel[] }>(SEARCH_TEXT, { fetchPolicy: "network-only" });

  // Query to translate the natural language to MongoDB JSON search
  const TRANSLATE_SEARCH = gql`
    query TranslateSearch($query: String!) {
      translateSearch(query: $query)
    }
  `;
  const [runTranslateSearch] = useLazyQuery<{ translateSearch: string }>(TRANSLATE_SEARCH, {
    fetchPolicy: "network-only",
  });

  const runSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    // Translate natural language to a MongoDB query, then run as a builder query
    if (isAISearch) {
      setIsTranslating(true);
      // useLazyQuery resolves (not rejects) on GraphQL errors
      const translation = await runTranslateSearch({ variables: { query } }).catch(ignoreAbort);
      setIsTranslating(false);

      if (!translation) {
        setIsSearching(false);
        return;
      }

      if (translation.error) {
        toaster.create({
          title: "Error",
          type: "error",
          description: "Unable to translate query, please try again",
          duration: 2000,
          closable: true,
        });
        setIsSearching(false);
        return;
      }

      if (!translation.data?.translateSearch) {
        setIsSearching(false);
        return;
      }

      const results = await searchText({
        variables: {
          query: translation.data.translateSearch,
          resultType: "entity",
          isBuilder: true,
          showArchived,
        },
      }).catch(ignoreAbort);

      if (!results) {
        setIsSearching(false);
        return;
      }

      if (!results.data?.search) {
        toaster.create({
          title: "Error",
          type: "error",
          description: "Unable to retrieve search results",
          duration: 4000,
          closable: true,
        });
        setIsError(true);
      } else {
        setResults(results.data.search);
      }

      setIsSearching(false);
      return;
    }

    const hasFilters =
      textSearchFilters.startDate ||
      textSearchFilters.endDate ||
      textSearchFilters.hasAttachments ||
      textSearchFilters.hasAttributes ||
      textSearchFilters.hasRelationships;

    const filters = hasFilters
      ? {
          startDate: textSearchFilters.startDate || undefined,
          endDate: textSearchFilters.endDate || undefined,
          hasAttachments: textSearchFilters.hasAttachments || undefined,
          hasAttributes: textSearchFilters.hasAttributes || undefined,
          hasRelationships: textSearchFilters.hasRelationships || undefined,
        }
      : undefined;

    const results = await searchText({
      variables: {
        query: query,
        resultType: "entity",
        isBuilder: false,
        showArchived: showArchived,
        filters,
      },
    }).catch(ignoreAbort);

    if (!results) {
      setIsSearching(false);
      return;
    }

    if (error || !results.data?.search) {
      toaster.create({
        title: "Error",
        type: "error",
        description: error?.message || "Unable to retrieve search results",
        duration: 4000,
        closable: true,
      });
      setIsError(true);
    } else if (results.data.search) {
      setResults(results.data.search);
    }

    setIsSearching(false);
  };

  const onTabChange = (tab: "text" | "advanced") => {
    setActiveTab(tab);
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
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 48 })}
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
      meta: {
        minWidth: 400,
      },
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
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 64}>
            <Text fontSize={"xs"} lineClamp={1}>
              {_.truncate(info.getValue(), { length: 64 })}
            </Text>
          </Tooltip>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 400,
      },
    }),
    searchResultColumnHelper.accessor("attributes", {
      cell: (info) => {
        return (
          <Tag.Root colorPalette={info.getValue().length > 0 ? "green" : "orange"}>
            <Tag.Label fontSize={"xs"}>{info.getValue().length > 0 ? info.getValue().length : "None"}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Attributes",
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    searchResultColumnHelper.accessor("created", {
      cell: (info) => {
        return (
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
        );
      },
      header: "Created",
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    searchResultColumnHelper.accessor("archived", {
      cell: (info) => {
        return (
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Icon name={info.getValue() ? "archive" : "check"} color={info.getValue() ? "orange" : "green"} />
            <Text fontWeight={"semibold"} fontSize={"xs"} color={info.getValue() ? "orange" : "green"}>
              {info.getValue() ? "Archived" : "Active"}
            </Text>
          </Flex>
        );
      },
      header: "Status",
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    searchResultColumnHelper.accessor("owner", {
      cell: (info) => {
        return <ActorTag identifier={info.getValue()} fallback={"Unknown User"} size={"sm"} inline />;
      },
      header: "Owner",
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
            slugify(`export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.csv`),
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
            slugify(`export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`),
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
          ["contains", "doesNotContain", "beginsWith", "endsWith"].includes(operator.name),
        ),
      ],
    },
    {
      name: "description",
      label: "Description",
      operators: [...defaultOperators.filter((operator) => ["contains", "doesNotContain"].includes(operator.name))],
    },
    {
      name: "projects",
      label: "Projects",
      operators: [...defaultOperators.filter((operator) => ["contains", "doesNotContain"].includes(operator.name))],
    },
    {
      name: "relationships",
      label: "Relationships",
      operators: [...defaultOperators.filter((operator) => ["contains", "doesNotContain"].includes(operator.name))],
    },
    {
      name: "attributes",
      label: "Attributes",
      operators: [...defaultOperators.filter((operator) => ["contains", "doesNotContain"].includes(operator.name))],
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
      const processedCustomRules: Record<string, any>[] = [{ "attributes.values.type": customRule.type }];

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
            $expr: {
              $anyElementTrue: {
                $map: {
                  input: "$attributes",
                  as: "a",
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: "$$a.values",
                        as: "v",
                        in: {
                          $and: [
                            { $eq: ["$$v.type", "number"] },
                            {
                              $eq: [{ $toDouble: "$$v.data" }, parseFloat(customRule.value)],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $regex: new RegExp("^" + dayjs(customRule.value).format("YYYY-MM-DD")).toString(),
            },
          });
        }
      } else if (customRule.operator === ">") {
        if (customRule.type === "number") {
          processedCustomRules.push({
            $expr: {
              $anyElementTrue: {
                $map: {
                  input: "$attributes",
                  as: "a",
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: "$$a.values",
                        as: "v",
                        in: {
                          $and: [
                            { $eq: ["$$v.type", "number"] },
                            {
                              $gt: [{ $toDouble: "$$v.data" }, parseFloat(customRule.value)],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $gt: dayjs(customRule.value).endOf("day").toISOString(),
            },
          });
        }
      } else if (customRule.operator === "<") {
        if (customRule.type === "number") {
          processedCustomRules.push({
            $expr: {
              $anyElementTrue: {
                $map: {
                  input: "$attributes",
                  as: "a",
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: "$$a.values",
                        as: "v",
                        in: {
                          $and: [
                            { $eq: ["$$v.type", "number"] },
                            {
                              $lt: [{ $toDouble: "$$v.data" }, parseFloat(customRule.value)],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $lt: dayjs(customRule.value).startOf("day").toISOString(),
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
    query Search($query: String, $resultType: String, $isBuilder: Boolean, $showArchived: Boolean) {
      search(query: $query, resultType: $resultType, isBuilder: $isBuilder, showArchived: $showArchived) {
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
  const [searchAdvanced, { error: searchAdvancedError }] = useLazyQuery<{
    search: EntityModel[];
  }>(SEARCH_ADVANCED, {
    fetchPolicy: "network-only",
  });

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
    }).catch(ignoreAbort);

    if (!results) {
      setIsSearching(false);
      return;
    }

    if (searchAdvancedError || !results.data?.search) {
      toaster.create({
        title: "Error",
        type: "error",
        description: searchAdvancedError?.message || "Unable to retrieve search results",
        duration: 4000,
        closable: true,
      });
      setIsError(true);
    } else if (results.data.search) {
      setResults(results.data.search);
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
              if (_.isUndefined(currentLevel[key]) || currentLevel[key] === "") {
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

  // Calculate active filter count for text search filters
  useEffect(() => {
    let count = 0;
    if (showArchived) count++;
    if (textSearchFilters.startDate) count++;
    if (textSearchFilters.endDate) count++;
    if (textSearchFilters.hasAttachments) count++;
    if (textSearchFilters.hasAttributes) count++;
    if (textSearchFilters.hasRelationships) count++;
    setActiveFilterCount(count);
  }, [showArchived, textSearchFilters]);

  // Reset text search results when filters change
  useEffect(() => {
    // If filters change, clear current results so the next search reflects the new filters
    setResults([]);
    setHasSearched(false);
    setIsSearching(false);
  }, [showArchived, textSearchFilters]);

  return (
    <Content isError={isError}>
      <Flex direction={"row"} p={"1"} rounded={"md"} bg={"white"} wrap={"wrap"} gap={"1"} minW="0" maxW="100%">
        <Flex w={"100%"} minW="0" direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} minW="0">
            <Icon name={"search"} size={"sm"} />
            <Heading size={"md"}>Search</Heading>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"} minW="0" maxW="100%">
          <Flex direction={"column"} ml={"0.5"} gap={"1"}>
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              Search across Entities in the current Workspace
            </Text>
            <Text fontSize={"xs"}>
              Use "Text" to search by keyword or with AI, build structured search queries using "Query Builder"
            </Text>
          </Flex>

          {/* Search components */}
          <Tabs.Root
            w={"100%"}
            value={activeTab}
            onValueChange={(details) => onTabChange(details.value as "text" | "advanced")}
          >
            <Flex bg={"gray.100"} rounded={"md"} p={"0.5"} gap={"0.5"} w={"fit-content"}>
              <Button
                size={"xs"}
                rounded={"sm"}
                variant={"ghost"}
                colorPalette={"gray"}
                bg={activeTab === "text" ? "white" : "transparent"}
                shadow={activeTab === "text" ? "xs" : "none"}
                disabled={isSearching}
                onClick={() => onTabChange("text")}
              >
                <Icon name={"text"} size={"xs"} />
                Text
              </Button>
              <Button
                size={"xs"}
                rounded={"sm"}
                variant={"ghost"}
                colorPalette={"gray"}
                bg={activeTab === "advanced" ? "white" : "transparent"}
                shadow={activeTab === "advanced" ? "xs" : "none"}
                disabled={isSearching}
                onClick={() => onTabChange("advanced")}
              >
                <Icon name={"search_query"} size={"xs"} />
                Query Builder
              </Button>
            </Flex>

            {/* Text search */}
            <Tabs.Content value={"text"} p={"0"} pt={"1"}>
              <Flex direction={"column"} gap={"1"}>
                {/* Filter section */}
                <Collapsible.Root open={filtersOpen} onOpenChange={(event) => setFiltersOpen(event.open)}>
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    p={"1"}
                    rounded={"md"}
                    border={GLOBAL_STYLES.border.style}
                    borderColor={GLOBAL_STYLES.border.color}
                  >
                    <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"}>
                      <Flex direction={"row"} gap={"1"} align={"center"}>
                        <Icon name={"filter"} size={"sm"} />
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Search Filters:
                        </Text>
                        <Text
                          fontWeight={"semibold"}
                          fontSize={"xs"}
                          color={activeFilterCount >= 1 ? "green.700" : "black"}
                        >
                          {activeFilterCount} Active
                        </Text>
                      </Flex>
                      <Collapsible.Trigger asChild>
                        <Button size={"xs"} variant={"ghost"} colorPalette={"gray"}>
                          {filtersOpen ? "Hide" : "Show"} Filters
                          <Icon name={filtersOpen ? "c_up" : "c_down"} size={"xs"} />
                        </Button>
                      </Collapsible.Trigger>
                    </Flex>
                    <Collapsible.Content>
                      <Flex direction={"column"} gap={"2"} p={"1"}>
                        <Flex direction={"row"} gap={["2", "4"]} wrap={"wrap"}>
                          {/* Search options section */}
                          <Flex direction={"column"} gap={"1"} minW={"220px"} flexShrink={0}>
                            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                              Search Options
                            </Text>
                            <Checkbox.Root
                              size={"xs"}
                              colorPalette={"blue"}
                              checked={showArchived}
                              onCheckedChange={(details) => setShowArchived(details.checked as boolean)}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label fontSize={"xs"}>Show Archived Entities</Checkbox.Label>
                            </Checkbox.Root>
                          </Flex>

                          {/* Entity filters section */}
                          <Flex direction={"column"} gap={"1"} minW={"260px"} flexShrink={0}>
                            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                              Entity Filters
                            </Text>

                            <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
                              {/* Date range */}
                              <Flex direction={"row"} gap={"1"} align={"center"}>
                                <Flex direction={"column"} gap={"0.5"}>
                                  <Text fontSize={"2xs"} color={"gray.600"}>
                                    Created Start
                                  </Text>
                                  <Input
                                    type={"date"}
                                    size={"xs"}
                                    bg={"white"}
                                    value={textSearchFilters.startDate}
                                    onChange={(e) =>
                                      setTextSearchFilters((prev) => ({
                                        ...prev,
                                        startDate: e.target.value,
                                      }))
                                    }
                                  />
                                </Flex>
                                <Flex direction={"column"} gap={"0.5"}>
                                  <Text fontSize={"2xs"} color={"gray.600"}>
                                    Created End
                                  </Text>
                                  <Input
                                    type={"date"}
                                    size={"xs"}
                                    bg={"white"}
                                    value={textSearchFilters.endDate}
                                    onChange={(e) =>
                                      setTextSearchFilters((prev) => ({
                                        ...prev,
                                        endDate: e.target.value,
                                      }))
                                    }
                                  />
                                </Flex>
                              </Flex>

                              {/* Boolean filters */}
                              <Flex direction={"column"} gap={"1"} mt={"1"}>
                                <Checkbox.Root
                                  size={"xs"}
                                  colorPalette={"blue"}
                                  checked={textSearchFilters.hasAttachments}
                                  onCheckedChange={(details) =>
                                    setTextSearchFilters((prev) => ({
                                      ...prev,
                                      hasAttachments: details.checked as boolean,
                                    }))
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize={"xs"}>Has Attachments</Checkbox.Label>
                                </Checkbox.Root>
                                <Checkbox.Root
                                  size={"xs"}
                                  colorPalette={"blue"}
                                  checked={textSearchFilters.hasAttributes}
                                  onCheckedChange={(details) =>
                                    setTextSearchFilters((prev) => ({
                                      ...prev,
                                      hasAttributes: details.checked as boolean,
                                    }))
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize={"xs"}>Has Attributes</Checkbox.Label>
                                </Checkbox.Root>
                                <Checkbox.Root
                                  size={"xs"}
                                  colorPalette={"blue"}
                                  checked={textSearchFilters.hasRelationships}
                                  onCheckedChange={(details) =>
                                    setTextSearchFilters((prev) => ({
                                      ...prev,
                                      hasRelationships: details.checked as boolean,
                                    }))
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize={"xs"}>Has Relationships</Checkbox.Label>
                                </Checkbox.Root>
                              </Flex>
                            </Flex>
                          </Flex>
                        </Flex>
                      </Flex>

                      {/* Filter control buttons */}
                      <Flex direction={"row"} gap={"1"} align={"center"} justify={"flex-end"}>
                        <Button
                          size={"xs"}
                          variant={"outline"}
                          rounded={"md"}
                          colorPalette={"gray"}
                          bg={"white"}
                          _hover={{ bg: "gray.50" }}
                          disabled={activeFilterCount === 0}
                          onClick={() => {
                            setShowArchived(false);
                            setTextSearchFilters({
                              startDate: "",
                              endDate: "",
                              hasAttachments: false,
                              hasAttributes: false,
                              hasRelationships: false,
                            });
                            setResults([]);
                            setHasSearched(false);
                            setIsSearching(false);
                          }}
                        >
                          Reset Filters
                        </Button>
                      </Flex>
                    </Collapsible.Content>
                  </Flex>
                </Collapsible.Root>

                {/* Search input and submit */}
                <Flex w={"100%"} direction={"row"} gap={"1"} align={"center"}>
                  <InputGroup startElement={isAISearch && <Icon name={"lightning"} size={"xs"} color={"purple.400"} />}>
                    <Input
                      size={"xs"}
                      rounded={"md"}
                      value={query}
                      placeholder={isAISearch ? "Describe what you're looking for..." : "Search..."}
                      borderColor={isAISearch ? "purple.400" : undefined}
                      outlineColor={isAISearch ? "purple.400" : undefined}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyUp={(event) => {
                        if (event.key === "Enter" && query !== "") runSearch();
                      }}
                    />
                  </InputGroup>
                  <Tooltip content={isAISearch ? "AI search on" : "Enable AI natural language search"} showArrow>
                    <Button
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={isAISearch ? "purple" : "gray"}
                      variant={isAISearch ? "solid" : "outline"}
                      disabled={isSearching}
                      onClick={() => setIsAISearch((prev) => !prev)}
                    >
                      <Icon name={"lightning"} size={"xs"} />
                      AI
                    </Button>
                  </Tooltip>
                  <Button
                    aria-label={"Search"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={isAISearch ? "purple" : "green"}
                    disabled={query === "" || isTranslating}
                    loading={isTranslating || isSearching}
                    loadingText={"Searching..."}
                    onClick={() => runSearch()}
                  >
                    Search
                    <Icon name={"search"} size={"xs"} />
                  </Button>
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
                </Flex>
              </Flex>
            </Tabs.Content>

            {/* Query builder */}
            <Tabs.Content value={"advanced"} p={"0"} pt={"1"}>
              <SearchQueryBuilder
                query={advancedQuery}
                onQueryChange={setAdvancedQuery}
                fields={advancedQueryFields}
                isValid={isValid}
                onSearch={onSearchBuiltQuery}
                onClear={() => {
                  setAdvancedQuery(initialAdvancedQuery);
                  setHasSearched(false);
                  setResults([]);
                }}
              />
            </Tabs.Content>
          </Tabs.Root>

          {/* Search Results */}
          <Flex gap={"1"} p={"0"} w={"100%"}>
            {isSearching && (
              <Flex w={"full"} minH={"200px"} align={"center"} justify={"center"}>
                <Spinner size={"lg"} color={"gray.600"} />
              </Flex>
            )}

            {hasSearched && !isSearching && (
              <Flex id={"resultsContainer"} direction={"column"} w={"100%"} gap={"1"}>
                {results.length > 0 ? (
                  <>
                    <Heading id={"resultsHeading"} size={"sm"} fontWeight={"semibold"}>
                      {results.length} result
                      {results.length > 1 ? "s" : ""}
                    </Heading>
                    <DataTable
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
                  <Flex w={"100%"} minH={"200px"} align={"center"} justify={"center"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.600"}>
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
                  <EmptyState.Description>Enter a search query to find Entities</EmptyState.Description>
                </EmptyState.Content>
              </EmptyState.Root>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Search;
