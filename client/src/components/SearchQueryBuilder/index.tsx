// React imports
import React, { useState, useCallback } from "react";

// Existing and custom components
import { Button, Flex, Input, type ListCollection, Text, createListCollection } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Select from "@components/Select";
import SelectSearch from "@components/SelectSearch";

// Custom types
import {
  IGenericItem,
  IValueType,
  SearchAttributeValue,
  SearchCombinator,
  SearchField,
  SearchQueryBuilderProps,
  SearchRule,
  SearchRuleSelectProps,
} from "@types";

// Utility imports
import { nanoid } from "nanoid";

// Variables
import { STYLES } from "@variables";

const FIELDS = createListCollection({
  items: ["name", "description", "projects", "relationships", "attributes"],
});

const TEXT_OPERATORS = createListCollection({ items: ["contains", "does not contain"] });
const PROJECT_OPERATORS = createListCollection({ items: ["member of", "not member of"] });
const RELATIONSHIP_OPERATORS = createListCollection({
  items: ["is related to", "is not related to", "is parent of", "is child of"],
});
const ATTR_VALUE_TYPES = createListCollection({ items: ["text", "url", "number", "date"] });
const ATTR_NUM_OPERATORS = createListCollection({ items: ["equals", ">", "<"] });
const COMBINATOR_OPS = createListCollection({ items: ["and", "or"] });

const FIELD_OPERATORS_MAP: Record<string, ListCollection<string>> = {
  name: TEXT_OPERATORS,
  description: TEXT_OPERATORS,
  projects: PROJECT_OPERATORS,
  relationships: RELATIONSHIP_OPERATORS,
  attributes: TEXT_OPERATORS,
};

const DEFAULT_OPERATORS: Record<SearchField, string> = {
  name: "contains",
  description: "contains",
  projects: "member of",
  relationships: "is related to",
  attributes: "contains",
};

const DEFAULT_ATTRIBUTE_VALUE: SearchAttributeValue = { type: "text", operator: "contains", data: "" };

/**
 * Compact Select following the project's string-item collection pattern.
 * Items are used as both the stored value and the display label.
 */
const SearchRuleSelect = ({
  value,
  collection,
  onChange,
  minW = "100px",
  placeholder = "Select...",
  testId,
}: SearchRuleSelectProps) => (
  <Select
    collection={collection}
    value={[value]}
    onValueChange={(d) => onChange(d.value[0])}
    minW={minW}
    placeholder={placeholder}
    testId={testId}
    fontSize={"xs"}
  />
);

/**
 * A single query rule: field selector, operator selector, and a value input
 * whose type depends on the selected field.
 *
 * Text inputs use local state to avoid focus loss on every keystroke while
 * still propagating changes to the parent query.
 */
const RuleRow = React.memo(
  ({ rule, onChange, onRemove }: { rule: SearchRule; onChange: (rule: SearchRule) => void; onRemove: () => void }) => {
    const [localText, setLocalText] = useState(typeof rule.value === "string" ? rule.value : "");
    const [localAttrData, setLocalAttrData] = useState(typeof rule.value === "object" ? rule.value.data : "");
    const [localSelected, setLocalSelected] = useState<IGenericItem>({} as IGenericItem);

    const attrVal: SearchAttributeValue = typeof rule.value === "object" ? rule.value : DEFAULT_ATTRIBUTE_VALUE;
    const isNumericAttr = attrVal.type === "number" || attrVal.type === "date";
    const attrOperators = isNumericAttr ? ATTR_NUM_OPERATORS : TEXT_OPERATORS;
    const attrInputType = attrVal.type === "date" ? "date" : attrVal.type === "number" ? "number" : "text";

    const handleFieldChange = (field: string) => {
      setLocalText("");
      setLocalAttrData("");
      setLocalSelected({} as IGenericItem);
      onChange({
        ...rule,
        field: field as SearchField,
        operator: DEFAULT_OPERATORS[field as SearchField],
        value: field === "attributes" ? { ...DEFAULT_ATTRIBUTE_VALUE } : "",
      });
    };

    const handleAttrTypeChange = (type: IValueType) => {
      const numeric = type === "number" || type === "date";
      onChange({
        ...rule,
        value: { type, operator: numeric ? "equals" : "contains", data: attrVal.data },
      });
    };

    return (
      <Flex
        align={"flex-start"}
        gap={"2"}
        p={"2"}
        rounded={"md"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        bg={"white"}
        wrap={"wrap"}
      >
        {/* Field selector */}
        <Flex w={{ base: "100%", sm: "auto" }} direction={"column"} gap={"2"}>
          <Text fontWeight={"semibold"} fontSize={"xs"} color={"text.muted"} ml={"0.5"}>
            Entity Field
          </Text>
          <SearchRuleSelect
            value={rule.field}
            collection={FIELDS}
            onChange={handleFieldChange}
            minW={"110px"}
            testId={"rule-field-select"}
          />
        </Flex>

        {/* Operator selector */}
        <Flex w={{ base: "100%", sm: "auto" }} direction={"column"} gap={"2"}>
          <Text fontWeight={"semibold"} fontSize={"xs"} color={"text.muted"} ml={"0.5"}>
            Operator
          </Text>
          <SearchRuleSelect
            value={rule.operator}
            collection={FIELD_OPERATORS_MAP[rule.field]}
            onChange={(operator) => onChange({ ...rule, operator })}
            minW={"140px"}
            testId={"rule-operator-select"}
          />
        </Flex>

        {/* Value input, shape determined by field type */}
        <Flex flex={"1"} direction={"column"} minW={"180px"} w={{ base: "100%", sm: "auto" }} gap={"2"}>
          <Text fontWeight={"semibold"} fontSize={"xs"} color={"text.muted"} ml={"0.5"}>
            Value
          </Text>

          {(rule.field === "name" || rule.field === "description") && (
            <Input
              size={"xs"}
              rounded={"md"}
              backgroundColor={"white"}
              placeholder={rule.field === "name" ? "Name" : "Description"}
              value={localText}
              data-testid={"rule-value-input"}
              onChange={(e) => {
                setLocalText(e.target.value);
                onChange({ ...rule, value: e.target.value });
              }}
            />
          )}

          {rule.field === "projects" && (
            <SelectSearch
              value={localSelected}
              resultType={"project"}
              onChange={(item: IGenericItem) => {
                setLocalSelected(item);
                onChange({ ...rule, value: item._id });
              }}
            />
          )}

          {rule.field === "relationships" && (
            <SelectSearch
              value={localSelected}
              resultType={"entity"}
              onChange={(item: IGenericItem) => {
                setLocalSelected(item);
                onChange({ ...rule, value: item._id });
              }}
            />
          )}

          {rule.field === "attributes" && (
            <Flex
              direction={"row"}
              gap={"2"}
              wrap={"wrap"}
              align={"center"}
              p={"1.5"}
              rounded={"md"}
              bg={STYLES.card.bg}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
            >
              <SearchRuleSelect
                value={attrVal.type}
                collection={ATTR_VALUE_TYPES}
                onChange={(v) => handleAttrTypeChange(v as IValueType)}
                minW={"80px"}
                placeholder={"Type"}
                testId={"rule-attr-type-select"}
              />
              <SearchRuleSelect
                value={attrVal.operator}
                collection={attrOperators}
                onChange={(operator) =>
                  onChange({ ...rule, value: { ...attrVal, operator: operator as SearchAttributeValue["operator"] } })
                }
                minW={"130px"}
                placeholder={"Condition"}
                testId={"rule-attr-operator-select"}
              />
              <Input
                size={"xs"}
                rounded={"md"}
                backgroundColor={"white"}
                flex={"1"}
                minW={"100px"}
                type={attrInputType}
                placeholder={"Value"}
                value={localAttrData}
                data-testid={"rule-attr-value-input"}
                onChange={(e) => {
                  setLocalAttrData(e.target.value);
                  onChange({ ...rule, value: { ...attrVal, data: e.target.value } });
                }}
              />
            </Flex>
          )}
        </Flex>

        <Flex alignSelf={"end"}>
          <Button
            size={"xs"}
            variant={"solid"}
            colorPalette={"red"}
            onClick={onRemove}
            rounded={"md"}
            aria-label={"Remove rule"}
          >
            Remove
            <Icon name={"delete"} size={"xs"} />
          </Button>
        </Flex>
      </Flex>
    );
  },
);

/**
 * Bespoke MongoDB query builder supporting name, description, project membership,
 * entity relationships, and typed attribute value matching.
 * @param {SearchQuery} query
 */
const SearchQueryBuilder = ({ query, onQueryChange, isValid, onSearch, onClear }: SearchQueryBuilderProps) => {
  const addRule = () => {
    onQueryChange({
      ...query,
      rules: [...query.rules, { id: nanoid(), field: "name", operator: "contains", value: "" }],
    });
  };

  const updateRule = useCallback(
    (id: string, updated: SearchRule) =>
      onQueryChange({
        ...query,
        rules: query.rules.map((r) => (r.id === id ? updated : r)),
      }),
    [query, onQueryChange],
  );

  const removeRule = useCallback(
    (id: string) => onQueryChange({ ...query, rules: query.rules.filter((r) => r.id !== id) }),
    [query, onQueryChange],
  );

  return (
    <Flex direction={"column"} gap={"2"}>
      {/* Rule list with combinator selector rendered between each pair */}
      {query.rules.length > 0 ? (
        query.rules.map((rule, i) => (
          <Flex key={rule.id} direction={"column"} gap={"2"}>
            {i > 0 && (
              <Flex maxW={"50px"} ml={"6"}>
                <SearchRuleSelect
                  value={query.combinator}
                  collection={COMBINATOR_OPS}
                  onChange={(v) => onQueryChange({ ...query, combinator: v as SearchCombinator })}
                  testId={"rule-combinator-select"}
                />
              </Flex>
            )}
            <RuleRow
              rule={rule}
              onChange={(updated) => updateRule(rule.id, updated)}
              onRemove={() => removeRule(rule.id)}
            />
          </Flex>
        ))
      ) : (
        <Flex
          align={"center"}
          justify={"center"}
          gap={"2"}
          p={"2"}
          py={"4"}
          rounded={"md"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
          bg={STYLES.card.bg}
          wrap={"wrap"}
        >
          <Text fontWeight={"semibold"} fontSize={"xs"} color={"text.muted"}>
            No Rules
          </Text>
        </Flex>
      )}

      {/* Add Rule button and empty-state hint */}
      <Flex align={"center"} gap={"2"} justify={"space-between"}>
        <Button size={"xs"} variant={"solid"} rounded={"md"} colorPalette={"blue"} onClick={addRule}>
          Add Rule
          <Icon name={"add"} size={"xs"} />
        </Button>

        {/* Search and Clear actions */}
        <Flex align={"center"} gap={"2"}>
          <Button
            aria-label={"Run Query"}
            colorPalette={"green"}
            size={"xs"}
            rounded={"md"}
            onClick={onSearch}
            disabled={!isValid}
          >
            Search
            <Icon name={"search"} size={"xs"} />
          </Button>
          <Button
            size={"xs"}
            rounded={"md"}
            colorPalette={"gray"}
            variant={"outline"}
            disabled={query.rules.length === 0}
            onClick={onClear}
          >
            Clear
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SearchQueryBuilder;
