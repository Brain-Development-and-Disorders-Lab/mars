import React, { useState } from "react";
import { TabPanel, Flex, Button, Text, useToast } from "@chakra-ui/react";
import Icon from "@components/Icon";

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
import { QueryBuilderChakra } from "@react-querybuilder/chakra";

// SearchQueryValue component for searching Entity fields
import SearchQueryValue from "@components/SearchQueryValue";
import { SearchQueryBuilderProps } from "@types";

// GraphQL
import { gql, useLazyQuery } from "@apollo/client";

// Utility functions and libraries
import dayjs from "dayjs";

const SearchQueryBuilder: React.FC<SearchQueryBuilderProps> = ({
  setHasSearched,
  setResults,
  setIsSearching,
}) => {
  const fields: Field[] = [
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
  const initialQuery: RuleGroupType = {
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
    console.log(rule);
    if (rule.field === "name") {
      if (rule.operator === "doesNotContain") {
        return {
          name: {
            $not: { $regex: new RegExp(rule.value, "gi").toString() },
          },
        };
      } else if (rule.operator === "contains") {
        return {
          name: {
            $regex: new RegExp(rule.value, "gi").toString(),
          },
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
      // Construct the base query components
      const customRule = JSON.parse(rule.value);
      const processed = {
        "attributes.values.type": customRule.type,
      };

      // Append query components depending on the specified operator
      if (customRule.operator === "contains") {
        return {
          ...processed,
          "attributes.values.data": {
            $regex: new RegExp(customRule.value, "gi").toString(),
          },
        };
      } else if (customRule.operator === "does not contain") {
        return {
          ...processed,
          "attributes.values.data": {
            $not: {
              $regex: new RegExp(customRule.value, "gi").toString(),
            },
          },
        };
      } else if (customRule.operator === "equals") {
        if (customRule.type === "number") {
          return {
            ...processed,
            "attributes.values.data": {
              $eq: parseFloat(customRule.value),
            },
          };
        } else {
          return {
            ...processed,
            "attributes.values.data": {
              $eq: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          };
        }
      } else if (customRule.operator === ">") {
        if (customRule.type === "number") {
          return {
            ...processed,
            "attributes.values.data": {
              $gt: parseFloat(customRule.value),
            },
          };
        } else {
          return {
            ...processed,
            "attributes.values.data": {
              $gt: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          };
        }
      } else if (customRule.operator === "<") {
        if (customRule.type === "number") {
          return {
            ...processed,
            "attributes.values.data": {
              $lt: parseFloat(customRule.value),
            },
          };
        } else {
          return {
            ...processed,
            "attributes.values.data": {
              $lt: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          };
        }
      }

      return processed;
    }

    // Default rule applied
    return defaultRuleProcessorMongoDB(rule);
  };

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

  // State to hold the query
  const [query, setQuery] = useState(initialQuery);

  const toast = useToast();

  const onSearchBuiltQuery = async () => {
    setIsSearching(true);
    setHasSearched(true);

    // Format the query in `mongodb` format before sending
    const results = await searchText({
      variables: {
        query: JSON.stringify(
          formatQuery(query, {
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

    if (error) {
      toast({
        title: "Error",
        status: "error",
        description: error.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setIsSearching(false);
  };

  return (
    <TabPanel p={"2"}>
      <Flex direction={"column"} gap={"2"}>
        <Flex
          direction={"row"}
          gap={"2"}
          p={"2"}
          rounded={"md"}
          bg={"blue.100"}
          align={"center"}
          w={"fit-content"}
        >
          <Icon name={"info"} color={"blue.300"} />
          <Flex direction={"column"} gap={"1"}>
            <Text fontWeight={"semibold"} fontSize={"sm"} color={"blue.700"}>
              Use the query builder to construct advanced queries to search for
              Entities within the Workspace.
            </Text>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"}>
          <QueryBuilderChakra>
            <QueryBuilder
              fields={fields}
              onQueryChange={setQuery}
              controlElements={{ valueEditor: SearchQueryValue }}
              showCloneButtons
              showNotToggle
            />
          </QueryBuilderChakra>
          <Flex>
            <Button
              aria-label={"Run Query"}
              colorScheme={"green"}
              size={"sm"}
              rightIcon={<Icon name={"search"} />}
              onClick={() => onSearchBuiltQuery()}
              isDisabled={query.rules.length === 0}
            >
              Run Query
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </TabPanel>
  );
};

export default SearchQueryBuilder;
