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
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";

// Existing and custom types
import { IAttribute, IValue } from "@types";

// Utility functions and libraries
import { postData } from "@database/functions";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { isValidValues } from "src/util";

const Attribute = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  /**
   * Handle creation of a new Attribute
   */
  const onSubmit = () => {
    setIsSubmitting(true);

    // Push the data
    postData(`/attributes/create`, attributeData).then(() => {
      setIsSubmitting(false);
      navigate("/attributes");
    });
  };

  return (
    <Content>
      <Flex
        direction={"column"}
        alignSelf={"center"}
        gap={"6"}
        w={"100%"}
        h={"100%"}
        p={"4"}
        bg={"white"}
        maxW={"4xl"}
      >
        {/* Page header */}
        <Flex direction={"row"} align={"center"} justify={"space-between"}>
          <Heading fontWeight={"semibold"} size={"lg"}>
            Create a new template Attribute
          </Heading>
          <Button
            rightIcon={<Icon name={"info"} />}
            variant={"outline"}
            onClick={onOpen}
          >
            Info
          </Button>
        </Flex>

        <Flex direction={"column"} gap={"4"}>
          <FormControl isRequired>
            <FormLabel>Attribute Name</FormLabel>
            <Input
              w={["100%", "md"]}
              placeholder={"Name"}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            {isNameError && (
              <FormErrorMessage>
                A name must be specified for the Attribute.
              </FormErrorMessage>
            )}
            <FormHelperText>
              Provide a concise and descriptive name for the template Attribute.
            </FormHelperText>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Attribute Description</FormLabel>
            <Textarea
              w={["100%", "lg"]}
              value={description}
              placeholder={"Description"}
              onChange={(event) => setDescription(event.target.value)}
            />
            {isDescriptionError && (
              <FormErrorMessage>
                A description should be provided for the Attribute.
              </FormErrorMessage>
            )}
            <FormHelperText>
              Describe the purpose and contents of this template Attribute.
            </FormHelperText>
          </FormControl>
        </Flex>

        <Flex w={"100%"} h={"100%"}>
          <FormControl>
            <FormLabel>Values</FormLabel>
            <Values
              viewOnly={false}
              values={values}
              setValues={setValues}
            />
            <FormHelperText>
              Add Values to the template Attribute. Values must be named, but
              they are not required to have data associated with them. Data can
              be specified if desired.
            </FormHelperText>
          </FormControl>
        </Flex>

        {/* Action buttons */}
        <Flex direction={"row"} wrap={"wrap"} gap={"6"} p={"4"}>
          <Button
            colorScheme={"red"}
            variant={"outline"}
            rightIcon={<Icon name={"cross"} />}
            onClick={() => navigate("/attributes")}
          >
            Cancel
          </Button>
          <Spacer />
          <Button
            colorScheme={"green"}
            rightIcon={<Icon name={"check"} />}
            onClick={onSubmit}
            isDisabled={isDetailsError || isValueError || isSubmitting}
          >
            Finish
          </Button>
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
    </Content>
  );
};

export default Attribute;
