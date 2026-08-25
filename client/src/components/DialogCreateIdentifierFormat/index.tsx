// React
import React, { useState } from "react";

// Existing and custom components
import { Button, Checkbox, CloseButton, Dialog, Field, Fieldset, Flex, Input, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Custom types
import { DialogCreateIdentifierFormatProps, IIdentifierFormat, ResponseData } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// Utility functions and libraries
import dayjs from "dayjs";

// Hooks
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { STYLES } from "@variables";

/**
 * Dialog for creating a new custom Identifier Format, used both from the Counter selection drop-down
 * and directly from the Workspace view.
 */
const DialogCreateIdentifierFormat = (props: DialogCreateIdentifierFormatProps) => {
  // Workspace
  const { workspace } = useWorkspace();

  // Counter creation state
  const [formatName, setFormatName] = useState("");
  const [formatFixedLength, setFormatFixedLength] = useState(0);
  const [formatAlphanumeric, setFormatAlphanumeric] = useState(true); // Default to `true`
  const [formatLettersOnly, setFormatLettersOnly] = useState(false);
  const [formatNumbersOnly, setFormatNumbersOnly] = useState(false);
  const [formatSpecialCharacters, setFormatSpecialCharacters] = useState(false);
  const [formatUppercase, setFormatUppercase] = useState(false);

  // Mutually exclusive character options, enforced at the point of selection
  const handleFormatAlphanumericChange = (checked: boolean) => {
    setFormatAlphanumeric(checked);
    if (checked) {
      setFormatLettersOnly(false);
      setFormatNumbersOnly(false);
    }
  };

  const handleFormatLettersOnlyChange = (checked: boolean) => {
    setFormatLettersOnly(checked);
    if (checked) {
      setFormatAlphanumeric(false);
      setFormatNumbersOnly(false);
    }
  };

  const handleFormatNumbersOnlyChange = (checked: boolean) => {
    setFormatNumbersOnly(checked);
    if (checked) {
      setFormatAlphanumeric(false);
      setFormatLettersOnly(false);
      setFormatUppercase(false);
    }
  };

  const validFormat = formatName !== "" && formatFixedLength > 0;

  // GraphQL operations
  const CREATE_IDENTIFIER_FORMAT = gql`
    mutation CreateIdentifierFormat($format: IdentifierFormatInput) {
      createIdentifierFormat(format: $format) {
        success
        message
        data
      }
    }
  `;
  const [createIdentifierFormat, { loading, error }] = useMutation<{
    createIdentifierFormat: ResponseData<string>;
  }>(CREATE_IDENTIFIER_FORMAT);

  const onDoneClick = async () => {
    // Create the ICounter object
    const format: IIdentifierFormat = {
      name: formatName,
      created: dayjs(Date.now()).toISOString(),
      workspace: workspace,
      fixedLength: formatFixedLength,
      alphanumericOnly: formatAlphanumeric,
      lettersOnly: formatLettersOnly,
      numbersOnly: formatNumbersOnly,
      allowSpecialCharacters: formatSpecialCharacters,
      uppercaseRequired: formatUppercase,
    };

    const result = await createIdentifierFormat({
      variables: {
        format: format,
      },
    });

    if (error) {
      toaster.create({
        title: "Error",
        type: "error",
        description: error.message,
        duration: 4000,
        closable: true,
      });
      return;
    }

    if (result.data?.createIdentifierFormat.data) {
      props.onCreated(result.data.createIdentifierFormat.data);
      props.onClose();
    }
  };

  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={(event) => {
        if (!event.open) {
          props.onClose();
        }
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
                <Icon name={"format"} />
                <Text fontWeight={"semibold"} fontSize={"xs"}>
                  Create Custom Identifier Format
                </Text>
              </Flex>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={() => props.onClose()} colorPalette={"template"} />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body p={"2"} gap={"1"}>
            <Flex direction={"column"} w={"100%"} gap={"2"}>
              <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} lineHeight={"1.5"} ml={"0.5"}>
                Entities allow "secondary identifiers" to be specified, containing known identifiers such as GUIDs or
                internal tracking identifiers that are associated with that Entity. Custom formats can be specified to
                ensure internal secondary identifiers can be validated.
              </Text>

              <Flex>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root gap={"0.5"} required>
                      <Field.Label fontSize={"xs"} ml={"0.5"}>
                        Format Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        value={formatName}
                        size={"xs"}
                        rounded={"md"}
                        onChange={(event) => setFormatName(event.target.value)}
                      />
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>

              <Flex direction={"column"}>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root gap={"0.5"} required invalid={formatFixedLength <= 0}>
                      <Field.Label fontSize={"xs"} ml={"0.5"}>
                        Fixed Length
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        value={formatFixedLength}
                        type={"number"}
                        size={"xs"}
                        rounded={"md"}
                        onChange={(event) => setFormatFixedLength(parseInt(event.target.value))}
                      />
                      <Field.ErrorText ml={"0.5"}>Identifier format must be at least 1 character long</Field.ErrorText>
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>

              <Flex
                direction={"row"}
                gap={"4"}
                rounded={"md"}
                p={"2"}
                border={STYLES.border.style}
                borderColor={STYLES.border.color}
              >
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"semibold"} fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
                    Character Options
                  </Text>
                  <Fieldset.Root>
                    <Fieldset.Content gap={"1"}>
                      <Field.Root gap={"0.5"}>
                        <Checkbox.Root
                          size={"xs"}
                          colorPalette={"blue"}
                          checked={formatAlphanumeric}
                          onCheckedChange={(event) => handleFormatAlphanumericChange(!!event.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>Alphanumeric (a-z, A-Z, 0-9)</Checkbox.Label>
                        </Checkbox.Root>
                      </Field.Root>
                      <Field.Root gap={"0.5"}>
                        <Checkbox.Root
                          size={"xs"}
                          colorPalette={"blue"}
                          checked={formatLettersOnly}
                          onCheckedChange={(event) => handleFormatLettersOnlyChange(!!event.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>Letters (a-z, A-Z) only</Checkbox.Label>
                        </Checkbox.Root>
                      </Field.Root>
                      <Field.Root gap={"0.5"}>
                        <Checkbox.Root
                          size={"xs"}
                          colorPalette={"blue"}
                          checked={formatNumbersOnly}
                          onCheckedChange={(event) => handleFormatNumbersOnlyChange(!!event.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>Numeric (0-9) only</Checkbox.Label>
                        </Checkbox.Root>
                      </Field.Root>
                      <Field.Root gap={"0.5"}>
                        <Checkbox.Root
                          size={"xs"}
                          colorPalette={"blue"}
                          checked={formatSpecialCharacters}
                          onCheckedChange={(event) => setFormatSpecialCharacters(!!event.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>Allow special characters (!, @, #, $, %)</Checkbox.Label>
                        </Checkbox.Root>
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"semibold"} fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
                    Format Options
                  </Text>
                  <Fieldset.Root>
                    <Fieldset.Content gap={"1"}>
                      <Field.Root gap={"0.5"}>
                        <Checkbox.Root
                          size={"xs"}
                          colorPalette={"blue"}
                          checked={formatUppercase}
                          disabled={formatNumbersOnly}
                          onCheckedChange={(event) => setFormatUppercase(!!event.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>Require Uppercase</Checkbox.Label>
                        </Checkbox.Root>
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>
              </Flex>
            </Flex>
          </Dialog.Body>

          <Dialog.Footer p={"2"} bg={"surface.muted"} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
              <Button variant={"solid"} colorPalette={"red"} size={"xs"} rounded={"md"} onClick={() => props.onClose()}>
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>

              <Button
                size={"xs"}
                rounded={"md"}
                colorPalette={"green"}
                loading={loading}
                onClick={onDoneClick}
                disabled={!validFormat}
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

export default DialogCreateIdentifierFormat;
