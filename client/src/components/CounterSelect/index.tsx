// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import { Information } from "@components/Label";

// Custom types
import { CounterModel, CounterProps, ResponseData } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { gql, useLazyQuery, useQuery } from "@apollo/client";

const CounterSelect = (props: CounterProps) => {
  // Counter state
  const [counters, setCounters] = useState([] as CounterModel[]);
  const [selected, setSelected] = useState({} as CounterModel);
  const [nextValue, setNextValue] = useState("");

  // Counter creation state
  const [counterName, setCounterName] = useState("");

  // Counter format state
  const [counterFormat, setCounterFormat] = useState("");
  const [isValidFormat, setIsValidFormat] = useState(false);
  const [formatErrorMessage, setFormatErrorMessage] = useState(
    "Invalid format string",
  );

  // Counter numeric state
  const [counterIncrement, setCounterIncrement] = useState(1);
  const [isValidIncrement, setIsValidIncrement] = useState(false);
  const [counterInitial, setCounterInitial] = useState(0);
  const [isValidInitial, setIsValidInitial] = useState(false);

  // Counter previews
  const [currentCounterPreview, setCurrentCounterPreview] = useState("");
  const [nextCounterPreview, setNextCounterPreview] = useState("");

  // Overall error state
  const isValidInput =
    counterName !== "" && isValidFormat && isValidInitial && isValidIncrement;

  // Create Counter modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const onNameInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCounterName(event.target.value);
  };

  const onFormatInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCounterFormat(event.target.value);
  };

  const onInitialInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCounterInitial(parseInt(event.target.value));
  };

  const onIncrementInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCounterIncrement(parseInt(event.target.value));
  };

  useEffect(() => {
    // Evaluate the format, initial value, and increment
    let _isValidFormat = true;
    let _isValidInitial = true;
    let _isValidIncrement = true;
    if (counterFormat.includes("{") && counterFormat.includes("}")) {
      // Check the number of braces
      let openingBraceCount = 0;
      let closingBraceCount = 0;
      for (const c of counterFormat) {
        if (c === "{") openingBraceCount++;
        if (c === "}") closingBraceCount++;
      }
      if (
        openingBraceCount !== 1 ||
        closingBraceCount !== 1 ||
        !counterFormat.includes("{}")
      ) {
        _isValidFormat = false;
        setFormatErrorMessage(
          'Invalid braces, braces must appear as "{}" in one location',
        );
      }
    } else {
      _isValidFormat = false;
      setFormatErrorMessage(
        'Missing braces "{}" to specify position of numeric value',
      );
    }

    _isValidInitial = counterInitial >= 0 && !_.isNaN(counterInitial);
    _isValidIncrement = counterIncrement >= 0 && !_.isNaN(counterIncrement);

    // Update the Counter preview output
    if (_isValidFormat && _isValidInitial && _isValidIncrement) {
      setCurrentCounterPreview(
        counterFormat.replace("{}", counterInitial.toString()),
      );
      setNextCounterPreview(
        counterFormat.replace(
          "{}",
          (counterInitial + counterIncrement).toString(),
        ),
      );
    } else {
      setCurrentCounterPreview("Provide a valid format string");
      setNextCounterPreview("Provide a valid format string");
    }

    // Store the valid state
    setIsValidFormat(_isValidFormat);
    setIsValidInitial(_isValidInitial);
    setIsValidIncrement(_isValidIncrement);
  }, [counterFormat, counterInitial, counterIncrement]);

  useEffect(() => {
    // Evaluate the increment
  }, [counterIncrement]);

  useEffect(() => {
    // Evaluate the increment
  }, [counterInitial]);

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
        {props.showCreate && (
          <Flex>
            <Button
              size={"sm"}
              colorScheme={"green"}
              rightIcon={<Icon name={"add"} />}
              onClick={() => onOpen()}
            >
              Create
            </Button>
          </Flex>
        )}
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

      <Modal
        onEsc={onClose}
        onClose={onClose}
        isOpen={isOpen}
        size={"2xl"}
        isCentered
        scrollBehavior={"inside"}
      >
        <ModalOverlay />

        <ModalContent p={"2"} gap={"0"}>
          <ModalHeader p={"2"}>Create Counter</ModalHeader>
          <ModalCloseButton />

          <ModalBody px={"2"} gap={"2"}>
            <Flex direction={"column"} w={"100%"} gap={"2"}>
              <Information
                text={
                  "Counters are used to standardize name formats using letters and a number."
                }
              />

              <Flex>
                <FormControl isRequired>
                  <FormLabel fontSize={"sm"}>Name</FormLabel>
                  <Input
                    value={counterName}
                    size={"sm"}
                    rounded={"md"}
                    onChange={onNameInputChange}
                  />
                </FormControl>
              </Flex>

              <Flex>
                <FormControl isRequired isInvalid={!isValidFormat}>
                  <FormLabel fontSize={"sm"}>Format</FormLabel>
                  <Input
                    value={counterFormat}
                    size={"sm"}
                    rounded={"md"}
                    onChange={onFormatInputChange}
                  />
                  {!isValidFormat && (
                    <FormErrorMessage fontSize={"sm"}>
                      {formatErrorMessage}
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>

              <Flex direction={"row"} gap={"2"}>
                <FormControl isRequired isInvalid={!isValidInitial}>
                  <FormLabel fontSize={"sm"}>Initial Numeric Value</FormLabel>
                  <Input
                    type={"number"}
                    value={counterInitial}
                    size={"sm"}
                    rounded={"md"}
                    onChange={onInitialInputChange}
                  />
                </FormControl>

                <FormControl isRequired isInvalid={!isValidIncrement}>
                  <FormLabel fontSize={"sm"}>Increment</FormLabel>
                  <Input
                    type={"number"}
                    value={counterIncrement}
                    size={"sm"}
                    rounded={"md"}
                    onChange={onIncrementInputChange}
                  />
                </FormControl>
              </Flex>

              <Flex
                p={"2"}
                gap={"2"}
                direction={"column"}
                rounded={"md"}
                bg={"gray.100"}
              >
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Initial Counter Value:
                  </Text>
                  <Text fontSize={"sm"}>{currentCounterPreview}</Text>
                </Flex>

                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Next Counter Value:
                  </Text>
                  <Text fontSize={"sm"}>{nextCounterPreview}</Text>
                </Flex>
              </Flex>
            </Flex>
          </ModalBody>
          <ModalFooter p={"2"}>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
              <Button variant={"outline"} size={"sm"}>
                Cancel
              </Button>

              <Button
                size={"sm"}
                colorScheme={"green"}
                isDisabled={
                  !isValidFormat || !isValidIncrement || !isValidInput
                }
                rightIcon={<Icon name="check" />}
              >
                Done
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default CounterSelect;
