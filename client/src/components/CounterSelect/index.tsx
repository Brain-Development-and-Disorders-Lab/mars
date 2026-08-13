// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import { Button, createListCollection, Flex, Portal, Select, Text } from "@chakra-ui/react";
import CreateCounterDialog from "@components/CreateCounterDialog";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Custom types
import { CounterModel, CounterProps, ISelectOption, ResponseData } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery, useQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { createSelectOptions, ignoreAbort } from "@lib/util";

// Variables
import { STYLES } from "@variables";

const CounterSelect = (props: CounterProps) => {
  // Counter state
  const [counters, setCounters] = useState([] as CounterModel[]);
  const [selected, setSelected] = useState({} as CounterModel);
  const [currentValue, setCurrentValue] = useState("");

  // Counter collection for `Select`
  const counterCollection = useMemo(() => {
    const items = createSelectOptions<CounterModel>(counters, "_id", "name");
    return createListCollection<ISelectOption>({
      items: items || [],
    });
  }, [counters]);

  // Create Counter dialog disclosure
  const [open, setOpen] = useState(false);

  // GraphQL operations
  const GET_COUNTERS = gql`
    query GetCounters {
      counters {
        _id
        name
        current
        increment
        format
      }
    }
  `;
  const { data: counterData, refetch: refetchCounterData } = useQuery<{
    counters: CounterModel[];
  }>(GET_COUNTERS, { fetchPolicy: "network-only" });

  const GET_COUNTER_CURRENT = gql`
    query GetCounterCurrent($_id: String) {
      currentCounterValue(_id: $_id) {
        success
        message
        data
      }
    }
  `;
  const [currentCounterValue, { loading: currentValueLoading, error: currentValueError }] = useLazyQuery<{
    currentCounterValue: ResponseData<string>;
  }>(GET_COUNTER_CURRENT, {
    fetchPolicy: "network-only",
  });

  /**
   * Update operation when a Counter is selected from the drop-down menu
   * @param _id Counter identifier
   */
  const updateSelectedCounter = (_id: string) => {
    const selectedCounter = counters.filter((counter) => counter._id === _id)[0];
    setSelected(selectedCounter);

    // Propagate the selected Counter
    props.setCounter(selectedCounter._id);
  };

  /**
   * Handle selection of a Counter
   * @param details
   */
  const handleSelectCounter = (details: { value: string[]; items: ISelectOption[] }) => {
    if (details.value.length > 0) {
      updateSelectedCounter(details.value[0]);
    }
  };

  /**
   * Handle creation of a new Counter, selecting it once the Counter list has been refreshed
   * @param _id Identifier of the newly created Counter
   */
  const handleCounterCreated = async (_id: string) => {
    const { data: refetchedData } = await refetchCounterData();
    const createdCounter = refetchedData?.counters.find((counter) => counter._id === _id);
    if (createdCounter) {
      updateSelectedCounter(createdCounter._id);
    }
  };

  // Assign data
  useEffect(() => {
    if (counterData?.counters) {
      setCounters(counterData.counters);
    }
  }, [counterData]);

  const getCounterPreview = async () => {
    const result = await currentCounterValue({
      variables: { _id: selected._id },
    });

    // Handle any errors
    if (currentValueError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: currentValueError.message,
        duration: 4000,
        closable: true,
      });
    }

    setCurrentValue(result.data?.currentCounterValue.data || "Invalid");
  };

  // Get the next Counter value when the selected Counter has been updated
  useEffect(() => {
    if (selected?._id) {
      getCounterPreview().catch(ignoreAbort);
    }
  }, [selected]);

  return (
    <Flex direction={"column"} gap={"1"} w={"100%"}>
      <Flex w={"100%"} gap={"2"}>
        <Select.Root
          key={"select-counter"}
          size={"xs"}
          rounded={"md"}
          minW={"100px"}
          collection={counterCollection}
          onValueChange={handleSelectCounter}
          disabled={counterCollection.items.length === 0}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger rounded={"md"}>
              <Select.ValueText placeholder={"Select Counter"} />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {counterCollection.items.map((counter) => (
                  <Select.Item item={counter} key={counter.value}>
                    {counter.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

        {/* Button to create new Counter */}
        {props.showCreate && (
          <Flex>
            <Button size={"xs"} rounded={"md"} colorPalette={"green"} onClick={() => setOpen(true)}>
              Create
              <Icon name={"add"} size={"xs"} />
            </Button>
          </Flex>
        )}
      </Flex>

      {/* Counter information */}
      <Flex w={"100%"} gap={"1"}>
        {!_.isUndefined(selected._id) ? (
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontWeight={"semibold"} fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
              Next Value:
            </Text>
            <Text fontSize={"xs"} color={currentValueLoading ? "gray.400" : "black"}>
              {currentValueLoading ? "Loading" : currentValue}
            </Text>
          </Flex>
        ) : (
          <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Select Counter to preview the next value
          </Text>
        )}
      </Flex>

      <CreateCounterDialog open={open} onClose={() => setOpen(false)} onCreated={handleCounterCreated} />
    </Flex>
  );
};

export default CounterSelect;
