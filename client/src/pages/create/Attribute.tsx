// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Input, List, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, Textarea, useDisclosure } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";

// Existing and custom types
import { IAttribute, IValue } from "@types";

// Utility functions and libraries
import { postData } from "@database/functions";
import { isValidValues } from "src/util";

// Routing and navigation
import { useNavigate } from "react-router-dom";

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
  const [isValueError, setIsValueError] = useState(false);
  const isDetailsError = isNameError || isDescriptionError || isValueError;

  const attributeData: IAttribute = {
    name: name,
    description: description,
    values: values,
  };

  // Check the Values for errors each time they update
  useEffect(() => {
    setIsValueError(!isValidValues(values, true) || values.length === 0);
  }, [values]);

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
      <Flex direction={"column"} p={"2"} gap={"6"} wrap={"wrap"}>
        <Flex direction={"column"} w={"100%"} p={"4"} bg={"white"}>
          {/* Page header */}
          <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Heading fontWeight={"semibold"}>Create Attribute</Heading>
              <Button
                rightIcon={<Icon name={"info"} />}
                variant={"outline"}
                onClick={onOpen}
              >
                Info
              </Button>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            justify={"center"}
            align={"center"}
            gap={"6"}
            p={"2"}
            pb={"6"}
            mb={["12", "8"]}
          >
            <Flex direction={"column"} w={"100%"}>
              <Heading fontWeight={"semibold"} size={"lg"}>
                Details
              </Heading>
              <Text>
                Specify some basic details about this template Attribute. The
                metadata associated with this template should be specified using
                Values.
              </Text>
            </Flex>

            <Flex
              direction={"column"}
              gap={"2"}
              w={"100%"}
              maxW={"4xl"}
              wrap={["wrap", "nowrap"]}
            >
              <Flex direction={"row"} gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
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
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={description}
                    placeholder={"Attribute Description"}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                  {isDescriptionError && (
                    <FormErrorMessage>
                      A description should be provided for the Attribute.
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>

              <Flex>
                <FormControl isRequired isInvalid={isValueError}>
                  <FormLabel>Values</FormLabel>
                  <Values
                    collection={values}
                    viewOnly={false}
                    setValues={setValues}
                  />
                </FormControl>
              </Flex>
            </Flex>
          </Flex>

          {/* Action buttons */}
          <Flex
            direction={"row"}
            flexWrap={"wrap"}
            gap={"6"}
            justify={"space-between"}
            alignSelf={"center"}
            w={"100%"}
            p={"4"}
          >
            <Button
              colorScheme={"red"}
              variant={"outline"}
              rightIcon={<Icon name={"cross"} />}
              onClick={() => navigate("/attributes")}
            >
              Cancel
            </Button>
            <Button
              colorScheme={"green"}
              rightIcon={<Icon name={"check"} />}
              onClick={onSubmit}
              isDisabled={isDetailsError && !isSubmitting}
            >
              Finish
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Attributes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction={"column"} gap={"4"} p={"2"}>
              <Text>There are six supported types of metadata:</Text>
              <List spacing={2}>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_date"} color={"orange.300"} />
                    <Text>Date: Used to specify a point in time.</Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_text"} color={"blue.300"} />
                    <Text>Text: Used to specify text of variable length.</Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_number"} color={"green.300"} />
                    <Text>Number: Used to specify a numerical value.</Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_url"} color={"yellow.300"} />
                    <Text>URL: Used to specify a link.</Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"entity"} color={"purple.300"} />
                    <Text>
                      Entity: Used to specify a relation to another Entity.
                    </Text>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex gap={"2"} align={"center"}>
                    <Icon name={"v_select"} color={"teal.300"} />
                    <Text>
                      Select: Used to specify an option from a group of options.
                    </Text>
                  </Flex>
                </ListItem>
              </List>
              <Text>Values can be specified using the buttons.</Text>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Content>
  );
};

export default Attribute;
