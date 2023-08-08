// React
import React, { useState } from "react";

// Existing and custom components
import { Button, Checkbox, CheckboxGroup, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, Textarea, Tooltip, useDisclosure } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Existing and custom types
import { ICollection } from "@types";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import { postData } from "@database/functions";
import dayjs from "dayjs";
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Collection = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [token, _useToken] = useToken();

  const [type, setType] = useState("collection" as "collection" | "project");
  const [name, setName] = useState("");
  const [created, setCreated] = useState(
    dayjs(Date.now()).format("YYYY-MM-DDTHH:mm")
  );
  const [owner, setOwner] = useState(token.username);
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isOwnerError || isDescriptionError;

  const collectionData: ICollection = {
    type: type,
    name: name,
    description: description,
    owner: owner,
    created: created,
    collections: [],
    entities: [],
    history: [],
  };

  return (
    <Content>
      <Flex
        direction={"column"}
        justify={"center"}
        p={"2"}
        gap={"6"}
        maxW={"7xl"}
        wrap={"wrap"}
      >
        <Flex
          direction={"column"}
          w={"100%"}
          p={"4"}
          bg={"white"}
          rounded={"md"}
        >
          {/* Page header */}
          <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Heading fontWeight={"semibold"}>Create Collection</Heading>
              <Button
                rightIcon={<Icon name={"info"} />}
                variant={"outline"}
                onClick={onOpen}
              >
                Info
              </Button>
            </Flex>
          </Flex>

          {/* Data input */}
          <Flex
            direction={"row"}
            justify={"center"}
            gap={"6"}
            p={"2"}
            pb={"6"}
            mb={["12", "8"]}
          >
            <Flex
              direction={"column"}
              gap={"2"}
              w={"100%"}
              maxW={"4xl"}
            >
              <Heading fontWeight={"semibold"} size={"lg"}>
                Details
              </Heading>
              <Text>Specify some basic details about this Collection.</Text>
              <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl isRequired isInvalid={isNameError}>
                  <FormLabel htmlFor="name" fontWeight={"normal"}>
                    Name
                  </FormLabel>
                  <Input
                    id="name"
                    name="name"
                    borderColor={"blackAlpha.300"}
                    focusBorderColor={"black"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {isNameError && (
                    <FormErrorMessage>
                      A name or ID must be specified.
                    </FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={isOwnerError}>
                  <FormLabel htmlFor="owner" fontWeight={"normal"}>
                    Owner
                  </FormLabel>
                  <Input
                    id="owner"
                    name="owner"
                    borderColor={"blackAlpha.300"}
                    focusBorderColor={"black"}
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                  />
                  {isOwnerError && (
                    <FormErrorMessage>
                      An owner of the Collection is required.
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>

              <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl>
                  <FormLabel htmlFor="date" fontWeight={"normal"}>
                    Created
                  </FormLabel>

                  <Input
                    size={"md"}
                    type={"datetime-local"}
                    value={created}
                    onChange={(event) =>
                      setCreated(
                        dayjs(event.target.value).format("YYYY-MM-DDTHH:mm")
                      )
                    }
                  />
                </FormControl>

                <FormControl isRequired isInvalid={isDescriptionError}>
                  <FormLabel htmlFor="description" fontWeight={"normal"}>
                    Description
                  </FormLabel>
                  <Textarea
                    id="description"
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                  {isDescriptionError && (
                    <FormErrorMessage>
                      A description must be provided.
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>

              <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl>
                  <FormLabel htmlFor="date" fontWeight={"normal"}>
                    Collection Type
                  </FormLabel>
                  <CheckboxGroup>
                    <Flex direction={"column"} gap={"4"}>
                      <Checkbox
                        isChecked={_.isEqual(type, "collection")}
                        onChange={(_event) => {
                          setType("collection");
                        }}
                      >
                        <Tooltip
                          label={
                            "A standard Collection with no special properties."
                          }
                        >
                          <Flex direction={"row"} gap={"4"} align={"center"}>
                            Standard
                            <Icon name={"info"} />
                          </Flex>
                        </Tooltip>
                      </Checkbox>
                      <Checkbox
                        isChecked={_.isEqual(type, "project")}
                        onChange={(_event) => {
                          setType("project");
                        }}
                      >
                        <Tooltip label={"A Collection denoted as a Project."}>
                          <Flex direction={"row"} gap={"4"} align={"center"}>
                            Project
                            <Icon name={"info"} />
                          </Flex>
                        </Tooltip>
                      </Checkbox>
                    </Flex>
                  </CheckboxGroup>
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
              rightIcon={<Icon name={"cross"} />}
              variant={"outline"}
              onClick={() => navigate("/collections")}
            >
              Cancel
            </Button>

            <Button
              colorScheme={"green"}
              rightIcon={<Icon name={"check"} />}
              onClick={() => {
                // Push the data
                setIsSubmitting(true);
                postData(`/collections/create`, collectionData).then(() => {
                  setIsSubmitting(false);
                  navigate("/collections");
                });
              }}
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
          <ModalHeader>Collections</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction={"column"} gap={"4"} p={"2"}>
              <Text>
                Collections can be used to organize Entities. Any type of Entity
                can be included in a Collection. Entities can be added and
                removed from a Collection after it has been created.
              </Text>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Content>
  );
};

export default Collection;
