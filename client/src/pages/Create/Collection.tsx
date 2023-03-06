import React, { useState } from "react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import {
  Button,
  Flex,
  FormControl,
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
import { CheckIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { PageContainer } from "@components/PageContainer";
import { useNavigate } from "react-router-dom";
import { postData, pseudoId } from "@database/functions";
import { CollectionStruct } from "@types";

export const Start = ({}) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [name, setName] = useState(pseudoId("collection"));
  const [created, setCreated] = useState(new Date());
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");

  const collectionData: CollectionStruct = {
    name: name,
    description: description,
    owner: owner,
    created: created,
    entities: [],
  };

  return (
    <PageContainer>
      <Flex direction={"column"} w={["full", "4xl", "7xl"]}>
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
          <Flex
            direction={"column"}
            gap={"2"}
            w={["full", "4xl"]}
            maxW={"4xl"}
          >
            <Heading fontWeight={"semibold"} size={"lg"}>Details</Heading>
            <Text>Specify some basic details about this Collection.</Text>
            <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
              <FormControl isRequired>
                <FormLabel htmlFor="name" fontWeight={"normal"}>
                  Collection Name
                </FormLabel>
                <Input
                  id="name"
                  name="name"
                  borderColor={"blackAlpha.300"}
                  focusBorderColor={"black"}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="owner" fontWeight={"normal"}>
                  Collection Owner
                </FormLabel>
                <Input
                  id="owner"
                  name="owner"
                  borderColor={"blackAlpha.300"}
                  focusBorderColor={"black"}
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                />
              </FormControl>
            </Flex>

            <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
              <FormControl>
                <FormLabel htmlFor="date" fontWeight={"normal"}>
                  Creation Date
                </FormLabel>

                <SingleDatepicker
                  id="owner"
                  name="owner"
                  propsConfigs={{
                    dateNavBtnProps: {
                      colorScheme: "gray",
                    },
                    dayOfMonthBtnProps: {
                      defaultBtnProps: {
                        borderColor: "blackAlpha.300",
                        _hover: {
                          background: "black",
                          color: "white",
                        },
                      },
                      selectedBtnProps: {
                        background: "black",
                        color: "white",
                      },
                      todayBtnProps: {
                        borderColor: "blackAlpha.300",
                        background: "gray.50",
                        color: "black",
                      },
                    },
                  }}
                  date={created}
                  onDateChange={setCreated}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="description" fontWeight={"normal"}>
                  Description
                </FormLabel>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </FormControl>
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
        bg={"gray.50"}
        rounded={"20px"}
      >
        <Button
          colorScheme={"red"}
          rightIcon={<CloseIcon />}
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
            postData(`/collections/create`, collectionData).then(() =>
              navigate("/collections")
            );
          }}
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
    </PageContainer>
  );
};

export default Start;
