import React, { useState } from "react";
import { TabPanel, Flex, Button, useToast } from "@chakra-ui/react";
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
  const ruleProcessor: RuleProcessor = (rule: RuleType): String => {
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
    query Search($query: String, $isBuilder: Boolean, $limit: Int) {
      search(query: $query, isBuilder: $isBuilder, limit: $limit) {
        _id
        name
        description
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
        isBuilder: true,
        limit: 100,
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
    </TabPanel>
  );
};

export default SearchQueryBuilder;
