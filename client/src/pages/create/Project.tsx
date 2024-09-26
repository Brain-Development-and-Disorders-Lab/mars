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

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import dayjs from "dayjs";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";

// Custom types
import { ResponseData } from "@types";

const Project = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [token] = useToken();

  const [name, setName] = useState("");
  const [created, setCreated] = useState(
    dayjs(Date.now()).format("YYYY-MM-DDTHH:mm"),
  );
  const [owner] = useState(token.orcid);
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // GraphQL operations
  const CREATE_PROJECT = gql`
    mutation CreateProject($project: ProjectCreateInput) {
      createProject(project: $project) {
        success
        message
      }
    }
  `;
  const [createProject, { loading, error }] = useMutation<{
    createProject: ResponseData<string>;
  }>(CREATE_PROJECT);

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

  // Form validation
  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isOwnerError || isDescriptionError;

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
            <Icon name={"project"} size={"md"} />
            <Heading size={"md"}>Create Project</Heading>
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
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormControl isRequired isInvalid={isNameError}>
                <FormLabel htmlFor={"name"} fontSize={"sm"}>
                  Name
                </FormLabel>
                <Input
                  id={"name"}
                  name={"name"}
                  size={"sm"}
                  rounded={"md"}
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

              <FormControl isRequired>
                <FormLabel
                  htmlFor={"owner"}
                  fontWeight={"normal"}
                  fontSize={"sm"}
                >
                  Owner
                </FormLabel>
                <Input
                  id={"owner"}
                  name={"owner"}
                  size={"sm"}
                  rounded={"md"}
                  placeholder={"Owner"}
                  borderColor={"gray.300"}
                  focusBorderColor={"black"}
                  value={owner}
                  isDisabled
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="date" fontWeight={"normal"} fontSize={"sm"}>
                  Created
                </FormLabel>
                <Input
                  size={"sm"}
                  rounded={"md"}
                  type={"datetime-local"}
                  value={created}
                  onChange={(event) =>
                    setCreated(
                      dayjs(event.target.value).format("YYYY-MM-DDTHH:mm"),
                    )
                  }
                />
                <FormHelperText fontSize={"xs"}>
                  Specify a timestamp for the Project.
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
              borderColor={"gray.300"}
            >
              {/* Project description */}
              <FormControl isRequired isInvalid={isDescriptionError}>
                <FormLabel htmlFor="description" fontSize={"sm"}>
                  Description
                </FormLabel>
                <Textarea
                  id={"description"}
                  name={"description"}
                  size={"sm"}
                  rounded={"md"}
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
          </Flex>
        </Flex>

        <Flex direction={"row"} px={"2"} gap={"2"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            w={"100%"}
            minH={"300px"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.300"}
            align={"center"}
            justify={"center"}
          >
            <Text fontWeight={"semibold"} color={"gray.400"}>
              Select Entities
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {/* Place the action buttons at the bottom of the screen on desktop */}
      <Spacer />

      {/* Action buttons */}
      <Flex
        direction={"row"}
        wrap={"wrap"}
        gap={"6"}
        justify={"space-between"}
        w={"100%"}
        p={"2"}
      >
        <Button
          size={"sm"}
          colorScheme={"red"}
          rightIcon={<Icon name={"cross"} />}
          variant={"outline"}
          onClick={() => navigate("/projects")}
        >
          Cancel
        </Button>

        <Button
          id={"finishCreateProjectButton"}
          size={"sm"}
          colorScheme={"green"}
          rightIcon={<Icon name={"check"} />}
          onClick={async () => {
            // Push the data
            setIsSubmitting(true);
            // Execute the GraphQL mutation
            const response = await createProject({
              variables: {
                project: {
                  name: name,
                  owner: token.orcid,
                  archived: false,
                  description: description,
                  created: created,
                  entities: [],
                  collaborators: [],
                },
              },
            });

            if (response.data?.createProject.success) {
              setIsSubmitting(false);
              navigate("/projects");
            }
            setIsSubmitting(false);
          }}
          isDisabled={isDetailsError && !isSubmitting}
        >
          Finish
        </Button>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
          <ModalHeader p={"2"}>Projects</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={"2"}>
            <Flex direction={"column"} gap={"4"} p={"2"}>
              <Text>Projects can be used to organize and share Entities.</Text>
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
                represent when work on the experiment commenced. Otherwise, this
                timestamp may simply represent when this Project was created in
                Metadatify.
              </Text>

              <Heading size={"sm"}>Description*</Heading>
              <Text>A brief description of the Project contents.</Text>

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
