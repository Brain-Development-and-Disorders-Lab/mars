// React
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  createListCollection,
  Dialog,
  Field,
  Fieldset,
  Flex,
  Input,
  Portal,
  Select,
  Text,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Custom types
import {
  CounterModel,
  CounterProps,
  ICounter,
  ISelectOption,
  ResponseData,
} from "@types";

// Custom hooks
import { useWorkspace } from "@hooks/useWorkspace";

// Utility functions and libraries
import _ from "lodash";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { createSelectOptions } from "src/util";

const CounterSelect = (props: CounterProps) => {
  // Counter state
  const [counters, setCounters] = useState([] as CounterModel[]);
  const [selected, setSelected] = useState({} as CounterModel);
  const [currentValue, setCurrentValue] = useState("");

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

  // Counter collection for `Select`
  const counterCollection = useMemo(() => {
    const items = createSelectOptions<CounterModel>(counters, "_id", "name");
    return createListCollection<ISelectOption>({
      items: items || [],
    });
  }, [counters]);

  // Overall error state
  const isValidInput =
    counterName !== "" && isValidFormat && isValidInitial && isValidIncrement;

  // Create Counter modal disclosure
  const [open, setOpen] = useState(false);

  // Workspace context value
  const { workspace } = useWorkspace();

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
  const { data: counterData, refetch: refetchCounterData } =
    useQuery(GET_COUNTERS);

  const GET_COUNTER_CURRENT = gql`
    query GetCounterCurrent($_id: String) {
      currentCounterValue(_id: $_id) {
        success
        message
        data
      }
    }
  `;
  const [
    currentCounterValue,
    { loading: currentValueLoading, error: currentValueError },
  ] = useLazyQuery<{ currentCounterValue: ResponseData<string> }>(
    GET_COUNTER_CURRENT,
    {
      fetchPolicy: "network-only",
    },
  );

  const CREATE_COUNTER = gql`
    mutation CreateCounter($counter: CounterInput) {
      createCounter(counter: $counter) {
        success
        message
        data
      }
    }
  `;
  const [
    createCounter,
    { loading: createCounterLoading, error: createCounterError },
  ] = useMutation<{ createCounter: ResponseData<string> }>(CREATE_COUNTER);

  /**
   * Update operation when a Counter is selected from the drop-down menu
   * @param _id Counter identifier
   */
  const updateSelectedCounter = (_id: string) => {
    const selectedCounter = counters.filter(
      (counter) => counter._id === _id,
    )[0];
    setSelected(selectedCounter);

    // Propagate the selected Counter
    props.setCounter(selectedCounter._id);
  };

  /**
   * Handle selection of a Counter
   * @param details
   */
  const handleSelectCounter = (details: {
    value: string[];
    items: ISelectOption[];
  }) => {
    if (details.value.length > 0) {
      updateSelectedCounter(details.value[0]);
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

  const onDoneClick = async () => {
    // Create the ICounter object
    const counter: ICounter = {
      workspace: workspace,
      name: counterName,
      format: counterFormat,
      current: counterInitial,
      increment: counterIncrement,
      created: "",
    };

    const result = await createCounter({
      variables: {
        counter: counter,
      },
    });

    if (createCounterError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: createCounterError.message,
        duration: 4000,
        closable: true,
      });
      return;
    }

    if (result.data?.createCounter) {
      // Refetch the Counter data
      await refetchCounterData();

      const selectedCounter = counterData.counters.filter(
        (counter: CounterModel) =>
          counter._id === result.data?.createCounter.data,
      );

      // Update the selected Counter
      setSelected(selectedCounter);
      setOpen(false);
    }
  };

  // Get the next Counter value when the selected Counter has been updated
  useEffect(() => {
    if (selected?._id) {
      getCounterPreview();
    }
  }, [selected]);

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
    } else if (!_isValidFormat) {
      setCurrentCounterPreview("Invalid format string");
      setNextCounterPreview("Invalid format string");
    } else if (!_isValidInitial) {
      setCurrentCounterPreview("Invalid initial value");
      setNextCounterPreview("Invalid initial value");
    } else if (!_isValidIncrement) {
      setCurrentCounterPreview("Invalid increment");
      setNextCounterPreview("Invalid increment");
    }

    // Store the valid state
    setIsValidFormat(_isValidFormat);
    setIsValidInitial(_isValidInitial);
    setIsValidIncrement(_isValidIncrement);
  }, [counterFormat, counterInitial, counterIncrement]);

  return (
    <Flex direction={"column"} gap={"1"} w={"100%"}>
      <Flex w={"100%"} gap={"1"}>
        <Select.Root
          key={"select-counter"}
          size={"xs"}
          rounded={"md"}
          minW={"200px"}
          collection={counterCollection}
          onValueChange={handleSelectCounter}
          disabled={counterCollection.items.length === 0}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
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
            <Button
              size={"xs"}
              rounded={"md"}
              colorPalette={"green"}
              onClick={() => setOpen(true)}
            >
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
            <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.600"}>
              Next Value:
            </Text>
            <Text
              fontSize={"xs"}
              color={currentValueLoading ? "gray.400" : "black"}
            >
              {currentValueLoading ? "Loading" : currentValue}
            </Text>
          </Flex>
        ) : (
          <Text fontSize={"xs"} color={"gray.600"} ml={"0.5"}>
            Select Counter to preview the next value
          </Text>
        )}
      </Flex>

      <Dialog.Root
        open={open}
        onOpenChange={(details) => setOpen(details.open)}
        size={"lg"}
        placement={"center"}
        scrollBehavior={"inside"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Positioner />
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header
              px={"1"}
              py={"2"}
              fontWeight={"semibold"}
              fontSize={"sm"}
              roundedTop={"md"}
              bg={"blue.300"}
            >
              Create Counter
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size={"2xs"}
                  top={"6px"}
                  onClick={() => setOpen(false)}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body px={"1"} gap={"1"}>
              <Flex direction={"column"} w={"100%"} gap={"2"}>
                <Text
                  fontSize={"xs"}
                  color={"gray.600"}
                  lineHeight={"1.5"}
                  ml={"0.5"}
                >
                  Counters are used to standardize name formats using letters
                  and a number.
                  <br />
                  The format string must contain one "{"{}"}" marking the
                  position of the numeric value.
                </Text>

                <Flex>
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root>
                        <Field.Label fontSize={"xs"} ml={"0.5"}>
                          Name
                          <Field.RequiredIndicator />
                        </Field.Label>
                        <Input
                          value={counterName}
                          size={"xs"}
                          rounded={"md"}
                          onChange={onNameInputChange}
                        />
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Flex>
                  <Fieldset.Root invalid={!isValidFormat}>
                    <Fieldset.Content>
                      <Field.Root>
                        <Field.Label fontSize={"xs"} ml={"0.5"}>
                          Format
                          <Field.RequiredIndicator />
                        </Field.Label>
                        <Input
                          value={counterFormat}
                          size={"xs"}
                          rounded={"md"}
                          onChange={onFormatInputChange}
                        />
                        {!isValidFormat && (
                          <Field.ErrorText fontSize={"xs"} ml={"0.5"}>
                            {formatErrorMessage}
                          </Field.ErrorText>
                        )}
                        <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                          Example: "Counter_{"{}"}" generates "Counter_1",
                          "Counter_2", etc.
                        </Field.HelperText>
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Flex direction={"row"} gap={"2"}>
                  <Fieldset.Root invalid={!isValidInitial}>
                    <Fieldset.Content>
                      <Field.Root>
                        <Field.Label fontSize={"xs"} ml={"0.5"}>
                          Initial Value
                          <Field.RequiredIndicator />
                        </Field.Label>
                        <Input
                          type={"number"}
                          value={counterInitial}
                          size={"xs"}
                          rounded={"md"}
                          onChange={onInitialInputChange}
                        />
                        <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                          The initial value of the counter.
                        </Field.HelperText>
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>

                  <Fieldset.Root invalid={!isValidIncrement}>
                    <Fieldset.Content>
                      <Field.Root>
                        <Field.Label fontSize={"xs"} ml={"0.5"}>
                          Increment
                          <Field.RequiredIndicator />
                        </Field.Label>
                        <Input
                          type={"number"}
                          value={counterIncrement}
                          size={"xs"}
                          rounded={"md"}
                          onChange={onIncrementInputChange}
                        />
                        <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                          The step size of the counter.
                        </Field.HelperText>
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Flex
                  p={"1"}
                  gap={"1"}
                  direction={"column"}
                  rounded={"md"}
                  bg={"gray.100"}
                >
                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Initial Counter Value:
                    </Text>
                    <Text fontSize={"xs"}>{currentCounterPreview}</Text>
                  </Flex>

                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Next Counter Value:
                    </Text>
                    <Text fontSize={"xs"}>{nextCounterPreview}</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
              <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                <Button
                  variant={"solid"}
                  colorPalette={"red"}
                  size={"xs"}
                  rounded={"md"}
                  onClick={() => {
                    setOpen(false);
                    setCounterName("");
                    setCounterFormat("");
                    setCounterInitial(0);
                    setCounterIncrement(1);
                  }}
                >
                  Cancel
                  <Icon name={"cross"} size={"xs"} />
                </Button>

                <Button
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  disabled={
                    !isValidFormat ||
                    !isValidIncrement ||
                    !isValidInput ||
                    createCounterLoading
                  }
                  loading={createCounterLoading}
                  onClick={onDoneClick}
                >
                  Done
                  <Icon name="check" size={"xs"} />
                </Button>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
};

export default CounterSelect;
