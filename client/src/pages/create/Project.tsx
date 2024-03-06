// React
import React, { useState } from "react";

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
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Existing and custom types
import { IProject } from "@types";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import { postData } from "@database/functions";
import dayjs from "dayjs";
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Project = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [token, _useToken] = useToken();

  const [name, setName] = useState("");
  const [created, setCreated] = useState(
    dayjs(Date.now()).format("YYYY-MM-DDTHH:mm")
  );
  const [owner, _setOwner] = useState(token.orcid);
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isOwnerError || isDescriptionError;

  const projectData: IProject = {
    name: name,
    description: description,
    owner: owner,
    shared: [],
    created: created,
    entities: [],
    history: [],
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
            Create a new Project
          </Heading>
          <Button
            rightIcon={<Icon name={"info"} />}
            variant={"outline"}
            onClick={onOpen}
          >
            Info
          </Button>
        </Flex>

        {/* Data input */}
        <Flex direction={"column"} gap={"6"} p={"2"} h={"100%"}>
          <FormControl isRequired isInvalid={isNameError}>
            <FormLabel htmlFor={"name"} fontWeight={"normal"}>
              Name
            </FormLabel>
            <Input
              id={"name"}
              name={"name"}
              w={["100%", "md"]}
              placeholder={"Name"}
              borderColor={"gray.300"}
              focusBorderColor={"black"}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {isNameError && (
              <FormErrorMessage>
                A name to identify the Project must be specified.
              </FormErrorMessage>
            )}
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="date" fontWeight={"normal"}>
              Date Created or Started
            </FormLabel>

            <Input
              w={["100%", "md"]}
              type={"datetime-local"}
              value={created}
              onChange={(event) =>
                setCreated(dayjs(event.target.value).format("YYYY-MM-DDTHH:mm"))
              }
            />

            <FormHelperText>
              Specify a timestamp for the Project.
            </FormHelperText>
          </FormControl>

          <FormControl isRequired isInvalid={isDescriptionError}>
            <FormLabel htmlFor="description" fontWeight={"normal"}>
              Description
            </FormLabel>
            <Textarea
              id={"description"}
              name={"description"}
              w={["100%", "lg"]}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            {isDescriptionError && (
              <FormErrorMessage>
                A description must be provided.
              </FormErrorMessage>
            )}
            <FormHelperText>
              Describe the Project and its contents.
            </FormHelperText>
          </FormControl>
        </Flex>

        {/* Action buttons */}
        <Flex
          direction={"row"}
          wrap={"wrap"}
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
            onClick={() => navigate("/projects")}
          >
            Cancel
          </Button>

          <Button
            colorScheme={"green"}
            rightIcon={<Icon name={"check"} />}
            onClick={() => {
              // Push the data
              setIsSubmitting(true);
              postData(`/projects/create`, projectData).then(() => {
                setIsSubmitting(false);
                navigate("/projects");
              });
            }}
            isDisabled={isDetailsError && !isSubmitting}
          >
            Finish
          </Button>
        </Flex>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
          <ModalHeader p={"2"}>Projects</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={"2"}>
            <Flex direction={"column"} gap={"4"} p={"2"}>
              <Text>
                Projects can be used to organize and share Entities.
              </Text>
              <Text>
                Any type of Entity can be included in a Project. Entities can be
                added and removed from a Project after it has been created.
              </Text>

              <Heading size={"sm"}>Name*</Heading>
              <Text>
                Specify the name of a Project. This should be unique and will
                act as a searchable identifier.
              </Text>

              <Heading size={"sm"}>Date Created or Started</Heading>
              <Text>
                A timestamp assigned to the Project. For example, if this is a
                set of Entities used in a specific experiment, this date could
                represent when work on the experiment commenced. Otherwise,
                this timestamp may simply represent when this Project was created
                in MARS.
              </Text>

              <Heading size={"sm"}>Description*</Heading>
              <Text>
                A brief description of the Project contents.
              </Text>

              <Text>
                <i>* Required field</i>
              </Text>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Content>
  );
};

export default Project;
