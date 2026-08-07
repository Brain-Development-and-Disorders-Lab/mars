// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import { Button, CloseButton, Code, Dialog, Field, Fieldset, Flex, Input, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Custom types
import { CreateCounterDialogProps, ICounter, ResponseData } from "@types";

// Custom hooks
import { useWorkspace } from "@hooks/useWorkspace";

// GraphQL imports
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

/**
 * Dialog for creating a new Counter, used both from the Counter selection drop-down
 * and directly from the Workspace view.
 */
const CreateCounterDialog = (props: CreateCounterDialogProps) => {
  // Counter creation state
  const [counterName, setCounterName] = useState("");

  // Counter format state
  const [counterFormat, setCounterFormat] = useState("");
  const [isValidFormat, setIsValidFormat] = useState(false);
  const [formatErrorMessage, setFormatErrorMessage] = useState("Invalid format string");

  // Counter numeric state
  const [counterIncrement, setCounterIncrement] = useState(1);
  const [isValidIncrement, setIsValidIncrement] = useState(false);
  const [counterInitial, setCounterInitial] = useState(0);
  const [isValidInitial, setIsValidInitial] = useState(false);

  // Counter previews
  const [currentCounterPreview, setCurrentCounterPreview] = useState("");
  const [nextCounterPreview, setNextCounterPreview] = useState("");

  // Overall error state
  const isValidInput = counterName !== "" && isValidFormat && isValidInitial && isValidIncrement;

  // Workspace context value
  const { workspace } = useWorkspace();

  // GraphQL operations
  const CREATE_COUNTER = gql`
    mutation CreateCounter($counter: CounterInput) {
      createCounter(counter: $counter) {
        success
        message
        data
      }
    }
  `;
  const [createCounter, { loading: createCounterLoading, error: createCounterError }] = useMutation<{
    createCounter: ResponseData<string>;
  }>(CREATE_COUNTER);

  const reset = () => {
    setCounterName("");
    setCounterFormat("");
    setCounterInitial(0);
    setCounterIncrement(1);
  };

  const handleClose = () => {
    reset();
    props.onClose();
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

    if (result.data?.createCounter.data) {
      props.onCreated(result.data.createCounter.data);
      handleClose();
    }
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
      if (openingBraceCount !== 1 || closingBraceCount !== 1 || !counterFormat.includes("{}")) {
        _isValidFormat = false;
        setFormatErrorMessage('Invalid braces, braces must appear as "{}" in one location');
      }
    } else {
      _isValidFormat = false;
      setFormatErrorMessage('Missing braces "{}" to specify position of numeric value');
    }

    _isValidInitial = counterInitial >= 0 && !_.isNaN(counterInitial);
    _isValidIncrement = counterIncrement >= 0 && !_.isNaN(counterIncrement);

    // Update the Counter preview output
    if (_isValidFormat && _isValidInitial && _isValidIncrement) {
      setCurrentCounterPreview(counterFormat.replace("{}", counterInitial.toString()));
      setNextCounterPreview(counterFormat.replace("{}", (counterInitial + counterIncrement).toString()));
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
    <Dialog.Root
      open={props.open}
      onOpenChange={(event) => {
        if (!event.open) handleClose();
      }}
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
            p={"1"}
            flexShrink={0}
            bg={"template.light"}
            color={"template.dark"}
            borderBottom={"2px"}
            roundedTop={"md"}
          >
            <Flex direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
              <Flex align={"center"} gap={"1"} p={"1"} border={"2px"} rounded={"md"}>
                <Icon name={"counter"} />
                <Text fontWeight={"semibold"} fontSize={"xs"}>
                  Create Counter
                </Text>
              </Flex>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={handleClose} colorPalette={"template"} />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body p={"2"} gap={"1"}>
            <Flex direction={"column"} w={"100%"} gap={"2"}>
              <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} lineHeight={"1.5"} ml={"0.5"}>
                Counters are used to standardize name formats using letters and a number.
                <br />
                The format string must contain one "{"{}"}" marking the position of the numeric value.
              </Text>

              <Flex>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root gap={"0.5"} required>
                      <Field.Label fontSize={"xs"} ml={"0.5"}>
                        Counter Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input value={counterName} size={"xs"} rounded={"md"} onChange={onNameInputChange} />
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>

              <Flex>
                <Fieldset.Root invalid={!isValidFormat}>
                  <Fieldset.Content>
                    <Field.Root gap={"0.5"} required>
                      <Field.Label fontSize={"xs"} ml={"0.5"}>
                        Format String
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input value={counterFormat} size={"xs"} rounded={"md"} onChange={onFormatInputChange} />
                      {!isValidFormat && (
                        <Field.ErrorText fontSize={"xs"} ml={"0.5"}>
                          {formatErrorMessage}
                        </Field.ErrorText>
                      )}
                      <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                        Example: Format string <Code>Counter_{"{}"}</Code> generates <Code>Counter_1</Code>,{" "}
                        <Code>Counter_2</Code>, etc.
                      </Field.HelperText>
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>

              <Flex direction={"row"} gap={"2"}>
                <Fieldset.Root invalid={!isValidInitial}>
                  <Fieldset.Content>
                    <Field.Root gap={"0.5"} required>
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
                    <Field.Root gap={"0.5"} required>
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

              <Flex direction={"column"} gap={"0.5"}>
                <Text fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"}>
                  Counter Preview
                </Text>
                <Flex
                  p={"1"}
                  gap={"0.5"}
                  direction={"column"}
                  rounded={"md"}
                  border={STYLES.border.style}
                  borderColor={STYLES.border.color}
                >
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Initial Counter Value:
                    </Text>
                    <Code fontSize={"xs"}>{currentCounterPreview}</Code>
                  </Flex>

                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Next Counter Value:
                    </Text>
                    <Code fontSize={"xs"}>{nextCounterPreview}</Code>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Dialog.Body>

          <Dialog.Footer p={"2"} bg={"surface.muted"} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
              <Button variant={"solid"} colorPalette={"red"} size={"xs"} rounded={"md"} onClick={handleClose}>
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>

              <Button
                size={"xs"}
                rounded={"md"}
                colorPalette={"green"}
                disabled={!isValidFormat || !isValidIncrement || !isValidInput || createCounterLoading}
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
  );
};

export default CreateCounterDialog;
