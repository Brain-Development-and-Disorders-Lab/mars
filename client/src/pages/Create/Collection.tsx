import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { CheckIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { BsXLg } from "react-icons/bs";
import { ContentContainer } from "@components/ContentContainer";
import { postData } from "@database/functions";
import { Collection } from "@types";

export const Start = ({}) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [name, setName] = useState("");
  const [created, setCreated] = useState("");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isOwnerError || isDescriptionError;

  const collectionData: Collection = {
    name: name,
    description: description,
    owner: owner,
    created: created,
    entities: [],
  };

  return (
    <ContentContainer>
      <Flex
        direction={"column"}
        justify={"center"}
        p={"2"}
        gap={"6"}
        maxW={"7xl"}
        wrap={"wrap"}
      >
        <Flex direction={"column"} w={["full", "4xl", "7xl"]} p={"2"} bg={"white"} rounded={"md"}>
          {/* Page header */}
          <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Heading fontWeight={"semibold"}>Create Collection</Heading>
              <Button
                rightIcon={<InfoOutlineIcon />}
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
            <Flex direction={"column"} gap={"2"} w={["full", "4xl"]} maxW={"4xl"}>
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
                  {!isNameError ? (
                    <FormHelperText>A name or ID for the Collection.</FormHelperText>
                  ) : (
                    <FormErrorMessage>A name or ID must be specified.</FormErrorMessage>
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
                  {!isOwnerError ? (
                    <FormHelperText>Owner of the Collection.</FormHelperText>
                  ) : (
                    <FormErrorMessage>An owner of the Collection is required.</FormErrorMessage>
                  )}
                </FormControl>
              </Flex>

              <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl>
                  <FormLabel htmlFor="date" fontWeight={"normal"}>
                    Created
                  </FormLabel>

                  <Input
                    placeholder="Select Date and Time"
                    size="md"
                    type="datetime-local"
                    value={created}
                    onChange={(event) => setCreated(event.target.value)}
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
                  {!isDescriptionError ? (
                    <FormHelperText>A description of the Collection.</FormHelperText>
                  ) : (
                    <FormErrorMessage>A description must be provided.</FormErrorMessage>
                  )}
                </FormControl>
              </Flex>
            </Flex>
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
        w={["sm", "xl", "3xl"]}
        maxW={"7xl"}
        p={"4"}
        m={"4"}
        position={"fixed"}
        bottom={"0%"}
        bg={"white"}
        rounded={"md"}
      >
        <Button
          colorScheme={"red"}
          rightIcon={<BsXLg />}
          variant={"outline"}
          onClick={() => navigate("/")}
        >
          Cancel
        </Button>

        <Button
          colorScheme={"green"}
          rightIcon={<CheckIcon />}
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

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Collections</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Collections can be used to organize Entities. Any type of Entity
              can be included in a Collection. Entities can be added and removed
              from a Collection after it has been created.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </ContentContainer>
  );
};

export default Start;
