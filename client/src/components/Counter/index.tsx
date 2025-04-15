// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, Select, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Custom types
import { CounterModel, CounterProps } from "@types";

// Utility functions and libraries
// import _ from "lodash";
import { gql, useQuery } from "@apollo/client";

const Counter = (props: CounterProps) => {
  const [counters, setCounters] = useState([] as CounterModel[]);
  const [selected, setSelected] = useState({} as CounterModel);

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
  const { data } = useQuery(GET_COUNTERS);

  const handleSelectCounter = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCounter = counters.filter(
      (counter) => counter._id === event.target.value,
    )[0];
    setSelected(selectedCounter);
    console.info(selectedCounter);

    // Propagate the selected Counter
    props.setCounter(selectedCounter._id);
  };

  // Assign data
  useEffect(() => {
    if (data?.counters) {
      setCounters(data.counters);
    }
  }, [data]);

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
          >
            Create
          </Button>
        </Flex>
      </Flex>

      {/* Counter information */}
      <Flex w={"100%"} gap={"2"}>
        <Text fontWeight={"semibold"} fontSize={"sm"} color={"gray.600"}>
          Current Value:
        </Text>
      </Flex>
    </Flex>
  );
};

export default Counter;
