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

// SearchQueryValue component for searching Origins, Products, and Projects
import SearchQueryValue from "@components/SearchQueryValue";
import { SearchQueryBuilderProps } from "@types";

// GraphQL
import { gql, useLazyQuery } from "@apollo/client";

import _ from "lodash";

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
          ["contains", "beginsWith", "endsWith"].includes(operator.name),
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
      name: "project",
      label: "Project",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "origins",
      label: "Origins",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "products",
      label: "Products",
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
    {
      name: "values",
      label: "Values",
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
   * specifically `origins` and `products`
   * @param {RuleType} rule Rule for processing value
   * @return {String}
   */
  const ruleProcessor: RuleProcessor = (rule: RuleType): string => {
    if (rule.field === "origins") {
      // Handle `origins` field
      if (rule.operator === "doesNotContain") {
        // If `doesNotContain`, include `$not`
        return JSON.stringify({
          "associations.origins": {
            $not: {
              $elemMatch: {
                _id: rule.value,
              },
            },
          },
        });
      }
      return JSON.stringify({
        "associations.origins": {
          $elemMatch: {
            _id: rule.value,
          },
        },
      });
    } else if (rule.field === "products") {
      // Handle `products` field
      if (rule.operator === "doesNotContain") {
        // If `doesNotContain`, include `$not`
        return JSON.stringify({
          "associations.products": {
            $not: {
              $elemMatch: {
                _id: rule.value,
              },
            },
          },
        });
      }
      return JSON.stringify({
        "associations.products": {
          $elemMatch: {
            _id: rule.value,
          },
        },
      });
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
  const [searchText, { loading, error }] = useLazyQuery(SEARCH_TEXT);

  // State to hold the query
  const [query, setQuery] = useState(initialQuery);

  const toast = useToast();

  const onSearchBuiltQuery = async () => {
    setIsSearching(loading);
    setHasSearched(true);

    // Format the query in `mongodb` format before sending
    const results = await searchText({
      variables: {
        query: formatQuery(query, {
          format: "mongodb",
          ruleProcessor: ruleProcessor,
        }),
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

    setIsSearching(loading);
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
            <Text fontWeight={"semibold"} fontSize={"sm"} color={"blue.700"}>
              Query builder can be used to search for specific conditions within
              Entities and their Attributes, as well as Project membership and
              relationships to other Entities.
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
