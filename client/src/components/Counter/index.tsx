// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, Select, Text, useToast } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Custom types
import { CounterModel, CounterProps, ResponseData } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { gql, useLazyQuery, useQuery } from "@apollo/client";

const Counter = (props: CounterProps) => {
  // Counter state
  const [counters, setCounters] = useState([] as CounterModel[]);
  const [selected, setSelected] = useState({} as CounterModel);
  const [nextValue, setNextValue] = useState("");

  // Toast
  const toast = useToast();

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
  const { data: counterData } = useQuery(GET_COUNTERS);

  const GET_COUNTER_NEXT = gql`
    query GetCounterNext($_id: String) {
      nextCounterValue(_id: $_id) {
        success
        message
        data
      }
    }
  `;
  const [
    nextCounterValue,
    { loading: nextValueLoading, error: nextValueError },
  ] = useLazyQuery<{ nextCounterValue: ResponseData<string> }>(
    GET_COUNTER_NEXT,
  );

  /**
   * Handle selection of a Counter
   * @param event `HTMLSelectElement` `ChangeEvent` raised when option selected
   */
  const handleSelectCounter = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCounter = counters.filter(
      (counter) => counter._id === event.target.value,
    )[0];
    setSelected(selectedCounter);

    // Propagate the selected Counter
    props.setCounter(selectedCounter._id);
  };

  // Assign data
  useEffect(() => {
    if (counterData?.counters) {
      setCounters(counterData.counters);
    }
  }, [counterData]);

  const getCounterPreview = async () => {
    const result = await nextCounterValue({ variables: { _id: selected._id } });

    // Handle any errors
    if (nextValueError) {
      toast({
        title: "Error",
        status: "error",
        description: nextValueError.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setNextValue(result.data?.nextCounterValue.data || "Invalid");
  };

  // Get the next Counter value
  useEffect(() => {
    if (selected?._id) {
      getCounterPreview();
    }
  }, [selected]);

  return (
    <Flex direction={"column"} gap={"2"} w={"100%"}>
      <Flex w={"100%"} gap={"2"}>
        <Select
          value={selected._id}
          placeholder={counters.length === 0 ? "No Counters" : "Select Counter"}
          size={"sm"}
          rounded={"md"}
          onChange={handleSelectCounter}
          isDisabled={counters.length === 0}
        >
          {counters.map((o: CounterModel) => {
            return (
              <option key={o._id} value={o._id}>
                {o.name}
              </option>
            );
          })}
        </Select>

        {/* Button to create new Counter */}
        <Flex>
          <Button
            size={"sm"}
            colorScheme={"green"}
            rightIcon={<Icon name={"add"} />}
            isDisabled
          >
            Create
          </Button>
        </Flex>
      </Flex>

      {/* Counter information */}
      <Flex w={"100%"} gap={"2"}>
        {!_.isUndefined(selected._id) ? (
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontWeight={"semibold"} fontSize={"sm"} color={"gray.600"}>
              Next Value:
            </Text>
            <Text
              fontSize={"sm"}
              color={nextValueLoading ? "gray.400" : "black"}
            >
              {nextValueLoading ? "Loading" : nextValue}
            </Text>
          </Flex>
        ) : (
          <Text fontWeight={"semibold"} fontSize={"sm"} color={"gray.600"}>
            Select a Counter to preview a value
          </Text>
        )}
      </Flex>
    </Flex>
  );
};

export default Counter;
