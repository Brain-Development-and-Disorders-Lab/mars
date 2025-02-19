// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";
import { UnsavedChangesModal } from "@components/WarningModal";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import { GenericValueType, IAttribute, IValue } from "@types";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";

// Utility functions and libraries
import { gql, useMutation } from "@apollo/client";
import { isValidValues } from "src/util";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Posthog
import { usePostHog } from "posthog-js/react";

const Template = () => {
  const posthog = usePostHog();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { token } = useAuthentication();

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
  const [createTemplate, { loading, error }] = useMutation(CREATE_TEMPLATE);

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

    if (response.data.createTemplate.success) {
      setIsSubmitting(false);
      navigate("/templates");
    }
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error]);

  return (
    <Content isLoaded={!loading}>
      <Flex direction={"column"}>
        {/* Page header */}
        <Flex
          direction={"row"}
          p={"2"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"template"} size={"md"} />
            <Heading size={"md"}>Create Template</Heading>
            <Spacer />
            <Button
              size={"sm"}
              rightIcon={<Icon name={"info"} />}
              variant={"outline"}
              onClick={onOpen}
            >
              Info
            </Button>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            w={{ base: "100%", md: "50%" }}
            p={"2"}
            pt={{ base: "0", lg: "2" }}
            gap={"2"}
            grow={"1"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"2"}
              border={"1px"}
              borderColor={"gray.300"}
              rounded={"md"}
            >
              <FormControl isRequired>
                <FormLabel fontSize={"sm"}>Template Name</FormLabel>
                <Input
                  size={"sm"}
                  placeholder={"Name"}
                  rounded={"md"}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                {isNameError && (
                  <FormErrorMessage fontSize={"sm"}>
                    A name must be specified for the Template.
                  </FormErrorMessage>
                )}
                <FormHelperText fontSize={"sm"}>
                  Provide a concise and descriptive name for the Template.
                </FormHelperText>
              </FormControl>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            w={{ base: "100%", md: "50%" }}
            p={"2"}
            pl={{ base: "2", lg: "0" }}
            pt={{ base: "0", lg: "2" }}
            gap={"2"}
            grow={"1"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormControl isRequired>
                <FormLabel fontSize={"sm"}>Template Description</FormLabel>
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
                  <FormErrorMessage fontSize={"sm"}>
                    A description should be provided for the Template.
                  </FormErrorMessage>
                )}
                <FormHelperText fontSize={"sm"}>
                  Describe the purpose and contents of this Template.
                </FormHelperText>
              </FormControl>
            </Flex>
          </Flex>
        </Flex>

        <Flex w={"100%"} p={"2"} gap={"2"} direction={"column"}>
          <Values viewOnly={false} values={values} setValues={setValues} />
        </Flex>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={"2xl"} isCentered>
        <ModalOverlay />
        <ModalContent p={"2"} w={["lg", "xl", "2xl"]}>
          <ModalHeader p={"2"}>Template Attributes</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={"2"}>
            <Flex gap={"4"} direction={"column"}>
              <Flex direction={"column"} gap={"2"}>
                <Heading size={"sm"}>Overview</Heading>
                <Text fontSize={"sm"}>
                  Create a new template Attribute to be used to specify metadata
                  associated with Entities. Using Values, predefined metadata
                  fields can be associated with Entities. After creating a
                  template Attribute, it can be used during the Entity creation
                  process to pre-populate Attribute information and Entity
                  metadata.
                </Text>
              </Flex>

              <Flex direction={"column"} gap={"2"}>
                <Heading size={"sm"}>Values</Heading>
                <Text fontSize={"sm"}>
                  Values can be added to the template Attribute by clicking "Add
                  Value" and selecting the specific type of Value. There are six
                  supported Value types:
                </Text>
                <List spacing={"1"}>
                  <ListItem>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_date"} color={"orange.300"} />
                      <Text fontWeight={"semibold"} fontSize={"sm"}>
                        Date:
                      </Text>
                      <Text fontSize={"sm"}>
                        Used to specify a point in time.
                      </Text>
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_text"} color={"blue.300"} />
                      <Text fontWeight={"semibold"} fontSize={"sm"}>
                        Text:
                      </Text>
                      <Text fontSize={"sm"}>
                        Used to specify text of variable length.
                      </Text>
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_number"} color={"green.300"} />
                      <Text fontWeight={"semibold"} fontSize={"sm"}>
                        Number:
                      </Text>
                      <Text fontSize={"sm"}>
                        Used to specify a numerical value.
                      </Text>
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_url"} color={"yellow.300"} />
                      <Text fontWeight={"semibold"} fontSize={"sm"}>
                        URL:
                      </Text>
                      <Text fontSize={"sm"}>Used to specify a link.</Text>
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"entity"} color={"purple.300"} />
                      <Text fontWeight={"semibold"} fontSize={"sm"}>
                        Entity:
                      </Text>
                      <Text fontSize={"sm"}>
                        Used to specify a relation to another Entity.
                      </Text>
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Flex gap={"1"} align={"center"}>
                      <Icon name={"v_select"} color={"teal.300"} />
                      <Text fontWeight={"semibold"} fontSize={"sm"}>
                        Select:
                      </Text>
                      <Text fontSize={"sm"}>
                        Used to specify an option from a group of options.
                      </Text>
                    </Flex>
                  </ListItem>
                </List>
              </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Place the action buttons at the bottom of the screen on desktop */}
      <Spacer />

      {/* Action buttons */}
      <Flex direction={"row"} wrap={"wrap"} p={"2"}>
        <Button
          size={"sm"}
          colorScheme={"red"}
          variant={"outline"}
          rightIcon={<Icon name={"cross"} />}
          onClick={() => navigate("/templates")}
        >
          Cancel
        </Button>
        <Spacer />
        <Button
          size={"sm"}
          colorScheme={"green"}
          rightIcon={<Icon name={"check"} />}
          onClick={onSubmit}
          isDisabled={isDetailsError || isValueError || isSubmitting}
        >
          Finish
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
