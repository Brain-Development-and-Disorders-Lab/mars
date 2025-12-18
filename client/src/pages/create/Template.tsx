// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  Fieldset,
  Flex,
  Heading,
  Input,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";
import { UnsavedChangesModal } from "@components/WarningModal";
import { toaster } from "@components/Toast";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import { GenericValueType, IAttribute, IValue, ResponseData } from "@types";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";

// Utility functions and libraries
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { isValidValues } from "@lib/util";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Posthog
import { usePostHog } from "posthog-js/react";

const Template = () => {
  const posthog = usePostHog();
  const { token } = useAuthentication();

  const [informationOpen, setInformationOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState([] as IValue<GenericValueType>[]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Various validation error states
  const isNameError = name === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isDescriptionError;
  const [isValueError, setIsValueError] = useState(false);
  useEffect(() => {
    setIsValueError(!isValidValues(values, true));
  }, [values]);

  // Capture event
  useEffect(() => {
    posthog?.capture("create_template_start");
  }, [posthog]);

  // Store Template data
  const templateData: IAttribute = {
    name: name,
    owner: token.orcid,
    archived: false,
    description: description,
    values: values,
  };

  // GraphQL operations
  const CREATE_TEMPLATE = gql`
    mutation CreateTemplate($template: AttributeCreateInput) {
      createTemplate(template: $template) {
        success
        message
      }
    }
  `;
  const [createTemplate, { loading, error }] = useMutation<{
    createTemplate: ResponseData<string>;
  }>(CREATE_TEMPLATE);

  // Navigation and routing
  const navigate = useNavigate();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    // Check if this is during the `create` mutation
    if (isSubmitting) {
      return false;
    }

    // Default blocker condition
    return (
      (name !== "" || description !== "" || values.length > 0) &&
      currentLocation.pathname !== nextLocation.pathname
    );
  });
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  /**
   * Handle creation of a new Attribute
   */
  const onSubmit = async () => {
    // Capture event
    posthog?.capture("create_template_finish");

    setIsSubmitting(true);

    // Execute the GraphQL mutation
    const response = await createTemplate({
      variables: {
        template: templateData,
      },
    });

    if (
      !response.data?.createTemplate ||
      !response.data.createTemplate.success
    ) {
      toaster.create({
        title: "Error",
        description: "An error occurred when creating Template",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.createTemplate.success) {
      toaster.create({
        title: "Template created successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setIsSubmitting(false);
      navigate("/templates");
    }
  };

  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Error",
        description: error.message,
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  }, [error]);

  return (
    <Content isLoaded={!loading}>
      <Flex direction={"column"}>
        {/* Page header */}
        <Flex
          direction={"row"}
          p={"1"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"1"} w={"100%"}>
            <Icon name={"template"} size={"xs"} />
            <Heading size={"sm"}>Create Template</Heading>
            <Spacer />
            <Button
              size={"xs"}
              rounded={"md"}
              variant={"outline"}
              onClick={() => setInformationOpen(true)}
            >
              Info
              <Icon name={"info"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            w={{ base: "100%", md: "50%" }}
            p={"1"}
            pt={{ base: "0", lg: "1" }}
            gap={"1"}
            grow={"1"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"1"}
              border={"1px solid"}
              borderColor={"gray.300"}
              rounded={"md"}
            >
              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root required gap={"1"}>
                    <Field.Label
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      ml={"0.5"}
                    >
                      Template Name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      size={"xs"}
                      placeholder={"Name"}
                      rounded={"md"}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                    {isNameError && (
                      <Field.ErrorText fontSize={"xs"}>
                        A name must be specified for the Template.
                      </Field.ErrorText>
                    )}
                    <Field.HelperText fontSize={"xs"}>
                      Provide a concise and descriptive name for the Template.
                    </Field.HelperText>
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            w={{ base: "100%", md: "50%" }}
            p={"1"}
            pl={{ base: "1", lg: "0" }}
            pt={{ base: "0", lg: "1" }}
            gap={"1"}
            grow={"1"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root required gap={"1"}>
                    <Field.Label
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      ml={"0.5"}
                    >
                      Template Description
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <MDEditor
                      height={150}
                      minHeight={100}
                      maxHeight={400}
                      style={{ width: "100%" }}
                      value={description}
                      preview={"edit"}
                      extraCommands={[]}
                      onChange={(value) => {
                        setDescription(value || "");
                      }}
                    />
                    {isDescriptionError && (
                      <Field.ErrorText fontSize={"xs"}>
                        A description should be provided for the Template.
                      </Field.ErrorText>
                    )}
                    <Field.HelperText fontSize={"xs"}>
                      Describe the purpose and contents of this Template.
                    </Field.HelperText>
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>
            </Flex>
          </Flex>
        </Flex>

        <Flex w={"100%"} p={"1"} gap={"1"} direction={"column"}>
          <Values
            viewOnly={false}
            values={values}
            setValues={setValues}
            requireData={true}
          />
        </Flex>
      </Flex>

      {/* Information modal */}
      <Dialog.Root
        open={informationOpen}
        onOpenChange={(event) => setInformationOpen(event.open)}
        size={"lg"}
        placement={"center"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Trigger />
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size={"2xs"}
                top={"6px"}
                onClick={() => setInformationOpen(false)}
              />
            </Dialog.CloseTrigger>
            <Dialog.Header
              p={"2"}
              fontWeight={"semibold"}
              fontSize={"xs"}
              bg={"blue.300"}
              roundedTop={"md"}
            >
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Icon name={"template"} size={"xs"} />
                Template Attributes
              </Flex>
            </Dialog.Header>
            <Dialog.Body p={"1"}>
              <Flex gap={"1"} direction={"column"}>
                <Flex
                  direction={"column"}
                  gap={"1"}
                  bg={"gray.100"}
                  p={"1"}
                  rounded={"md"}
                >
                  <Heading size={"xs"}>Overview</Heading>
                  <Text fontSize={"xs"}>
                    Create a new template Attribute to be used to specify
                    metadata associated with Entities. Using Values, predefined
                    metadata fields can be associated with Entities. After
                    creating a template Attribute, it can be used during the
                    Entity creation process to pre-populate Attribute
                    information and Entity metadata.
                  </Text>
                </Flex>

                <Flex direction={"column"} gap={"1"} ml={"0.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Values
                  </Text>
                  <Text fontSize={"xs"}>
                    Values can be added to the template Attribute by clicking
                    "Add Value" and selecting the specific type of Value. There
                    are six supported Value types:
                  </Text>
                  <Box as={"ul"} listStyleType={"circle"}>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_date"} color={"orange.300"} />
                      <Text fontWeight={"semibold"} fontSize={"xs"}>
                        Date:
                      </Text>
                      <Text fontSize={"xs"}>
                        Used to specify a point in time.
                      </Text>
                    </Flex>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_text"} color={"blue.300"} />
                      <Text fontWeight={"semibold"} fontSize={"xs"}>
                        Text:
                      </Text>
                      <Text fontSize={"xs"}>
                        Used to specify text of variable length.
                      </Text>
                    </Flex>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_number"} color={"green.300"} />
                      <Text fontWeight={"semibold"} fontSize={"xs"}>
                        Number:
                      </Text>
                      <Text fontSize={"xs"}>
                        Used to specify a numerical value.
                      </Text>
                    </Flex>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_url"} color={"yellow.300"} />
                      <Text fontWeight={"semibold"} fontSize={"xs"}>
                        URL:
                      </Text>
                      <Text fontSize={"xs"}>Used to specify a link.</Text>
                    </Flex>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"entity"} color={"purple.300"} />
                      <Text fontWeight={"semibold"} fontSize={"xs"}>
                        Entity:
                      </Text>
                      <Text fontSize={"xs"}>
                        Used to specify a relation to another Entity.
                      </Text>
                    </Flex>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_select"} color={"teal.300"} />
                      <Text fontWeight={"semibold"} fontSize={"xs"}>
                        Select:
                      </Text>
                      <Text fontSize={"xs"}>
                        Used to specify an option from a group of options.
                      </Text>
                    </Flex>
                  </Box>
                </Flex>
              </Flex>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Place the action buttons at the bottom of the screen on desktop */}
      <Spacer />

      {/* Action buttons */}
      <Flex direction={"row"} wrap={"wrap"} p={"1"}>
        <Button
          size={"xs"}
          rounded={"md"}
          colorPalette={"red"}
          variant={"solid"}
          onClick={() => navigate("/templates")}
        >
          Cancel
          <Icon name={"cross"} size={"xs"} />
        </Button>
        <Spacer />
        <Button
          size={"xs"}
          rounded={"md"}
          colorPalette={"green"}
          onClick={onSubmit}
          disabled={isDetailsError || isValueError || isSubmitting}
        >
          Finish
          <Icon name={"check"} size={"xs"} />
        </Button>
      </Flex>

      {/* Blocker warning message */}
      <UnsavedChangesModal
        blocker={blocker}
        cancelBlockerRef={cancelBlockerRef}
        onClose={onBlockerClose}
        callback={onBlockerClose}
      />
    </Content>
  );
};

export default Template;
