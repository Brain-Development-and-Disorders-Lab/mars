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
  const [owner, setOwner] = useState(token.username);
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
              Project Name
            </FormLabel>
            <Input
              id={"name"}
              name={"name"}
              w={["100%", "md"]}
              placeholder={"Name"}
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
              Project Owner
            </FormLabel>
            <Input
              id={"owner"}
              name={"owner"}
              w={["100%", "md"]}
              borderColor={"blackAlpha.300"}
              focusBorderColor={"black"}
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
            />
            {isOwnerError && (
              <FormErrorMessage>
                A Project owner is required.
              </FormErrorMessage>
            )}
            <FormHelperText>
              The user who created the Project is the default owner.
            </FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="date" fontWeight={"normal"}>
              Created
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
              Specify a timestamp most significant to the Project.
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
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Projects</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction={"column"} gap={"4"} p={"2"}>
              <Heading size={"md"}>Overview</Heading>
              <Text>
                Projects can be used to organize and share Entities. Any type of Entity
                can be included in a Project. Entities can be added and
                removed from a Project after it has been created.
              </Text>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Content>
  );
};

export default Project;
