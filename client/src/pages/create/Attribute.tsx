// React
import React, { useEffect, useState } from "react";

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
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";

// Existing and custom types
import { IAttribute, IValue } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { isValidValues } from "src/util";
import { gql, useMutation } from "@apollo/client";
import _ from "lodash";

const Attribute = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState([] as IValue<any>[]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Various validation error states
  const isNameError = name === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isDescriptionError;
  const [isValueError, setIsValueError] = useState(false);
  useEffect(() => {
    setIsValueError(!isValidValues(values, true));
  }, [values]);

  // Store Attribute data
  const attributeData: IAttribute = {
    name: name,
    description: description,
    values: values,
  };

  // GraphQL operations
  const CREATE_ATTRIBUTE = gql`
    mutation CreateAttribute($attribute: AttributeCreateInput) {
      createAttribute(attribute: $attribute) {
        success
        message
      }
    }
  `;
  const [createAttribute, { loading, error }] = useMutation(CREATE_ATTRIBUTE);

  /**
   * Handle creation of a new Attribute
   */
  const onSubmit = async () => {
    setIsSubmitting(true);

    // Execute the GraphQL mutation
    const response = await createAttribute({
      variables: {
        attribute: attributeData,
      },
    });

    if (response.data.createAttribute.success) {
      setIsSubmitting(false);
      navigate("/attributes");
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
            <Icon name={"attribute"} size={"md"} />
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
            p={"2"}
            pt={{ base: "0", lg: "2" }}
            gap={"2"}
            grow={"1"}
            basis={"50%"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"2"}
              border={"1px"}
              borderColor={"gray.200"}
              rounded={"md"}
            >
              <FormControl isRequired>
                <FormLabel>Template Name</FormLabel>
                <Input
                  w={["100%", "md"]}
                  placeholder={"Name"}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                {isNameError && (
                  <FormErrorMessage>
                    A name must be specified for the Template.
                  </FormErrorMessage>
                )}
                <FormHelperText>
                  Provide a concise and descriptive name for the Template.
                </FormHelperText>
              </FormControl>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            p={"2"}
            pl={{ base: "2", lg: "0" }}
            pt={{ base: "0", lg: "2" }}
            gap={"2"}
            grow={"1"}
            basis={"50%"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.200"}
            >
              <FormControl isRequired>
                <FormLabel>Template Description</FormLabel>
                <Textarea
                  w={["100%", "lg"]}
                  value={description}
                  placeholder={"Description"}
                  onChange={(event) => setDescription(event.target.value)}
                />
                {isDescriptionError && (
                  <FormErrorMessage>
                    A description should be provided for the Template.
                  </FormErrorMessage>
                )}
                <FormHelperText>
                  Describe the purpose and contents of this Template.
                </FormHelperText>
              </FormControl>
            </Flex>
          </Flex>
        </Flex>

        <Flex w={"100%"} p={"2"} gap={"2"} direction={"column"}>
          <Text>
            Add Values to the Template. Values must be named, but they are not
            required to have data specified.
          </Text>
          <Values viewOnly={false} values={values} setValues={setValues} />
        </Flex>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={"2xl"} isCentered>
        <ModalOverlay />
        <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
          <ModalHeader p={"2"}>Creating Template Attributes</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={"2"}>
            <Flex direction={"column"} gap={"4"} p={"4"}>
              <Heading size={"md"}>Overview</Heading>
              <Text>
                Create a new template Attribute to be used to specify metadata
                associated with Entities. Using Values, predefined metadata
                fields can be associated with Entities. After creating a
                template Attribute, it can be used during the Entity creation
                process to pre-populate Attribute information and Entity
                metadata.
              </Text>

              <Heading size={"md"}>Values</Heading>
              <Text>There are six supported Value types:</Text>
              <List spacing={2}>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_date"} color={"orange.300"} />
                    <Text>
                      <b>Date:</b> Used to specify a point in time.
                    </Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_text"} color={"blue.300"} />
                    <Text>
                      <b>Text:</b> Used to specify text of variable length.
                    </Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_number"} color={"green.300"} />
                    <Text>
                      <b>Number:</b> Used to specify a numerical value.
                    </Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_url"} color={"yellow.300"} />
                    <Text>
                      <b>URL:</b> Used to specify a link.
                    </Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"entity"} color={"purple.300"} />
                    <Text>
                      <b>Entity:</b> Used to specify a relation to another
                      Entity.
                    </Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_select"} color={"teal.300"} />
                    <Text>
                      <b>Select:</b> Used to specify an option from a group of
                      options.
                    </Text>
                  </Flex>
                </ListItem>
              </List>
              <Text>
                Values can be added to the template Attribute by clicking "Add
                Value" and selecting the specific type of Value.
              </Text>
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
          onClick={() => navigate("/attributes")}
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
    </Content>
  );
};

export default Attribute;
