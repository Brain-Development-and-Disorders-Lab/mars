// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Table,
  TableContainer,
  Tag,
  TagLabel,
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Existing and custom types
import { ProjectModel } from "@types";

// Utility functions and libraries
import { deleteData, getData, postData } from "@database/functions";
import _ from "lodash";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";

const Project = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isError, setIsError] = useState(false);

  const [projectData, setProjectData] = useState({} as ProjectModel);
  const [projectDescription, setProjectDescription] = useState("");

  useEffect(() => {
    // Populate Project data
    getData(`/projects/${id}`)
      .then((response: ProjectModel) => {
        setProjectData(response);
        setProjectDescription(response.description);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Project data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [id, isLoaded]);

  // Delete the Project when confirmed
  const handleDeleteClick = () => {
    // Update data
    deleteData(`/projects/${id}`)
      .then((_response) => {
        toast({
          title: "Deleted!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: `An error occurred when deleting Project "${projectData.name}".`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setEditing(false);
        navigate("/projects");
      });
  };

  /**
   * Handle the edit button being clicked
   */
  const handleEditClick = () => {
    if (editing) {
      const updateData: ProjectModel = {
        _id: projectData._id,
        name: projectData.name,
        description: projectDescription,
        created: projectData.created,
        owner: projectData.owner,
        users: projectData.users,
        entities: projectData.entities,
        collections: projectData.collections,
        attributes: projectData.attributes,
        history: projectData.history,
      };

      // Update data
      postData(`/projects/update`, updateData)
        .then((_response) => {
          toast({
            title: "Saved!",
            status: "success",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "An error occurred when saving updates.",
            status: "error",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        })
        .finally(() => {
          setEditing(false);
        });
    } else {
      setEditing(true);
    }
  };

  return (
    <Content isError={isError} isLoaded={isLoaded}>
      <Flex direction={"column"} gap={"4"}>
        <Flex
          gap={"4"}
          p={"4"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          wrap={"wrap"}
        >
          <Flex
            align={"center"}
            gap={"4"}
            shadow={"lg"}
            p={"2"}
            border={"2px"}
            rounded={"md"}
          >
            <Icon name={"project"} size={"lg"} />
            <Heading fontWeight={"semibold"}>
              Project: {projectData.name}
            </Heading>
          </Flex>

          {/* Buttons */}
          <Flex
            direction={"row"}
            gap={"4"}
            wrap={"wrap"}
            p={"4"}
            rounded={"md"}
          >
            {editing && (
              <Popover>
                <PopoverTrigger>
                  <Button
                    colorScheme={"red"}
                    rightIcon={<Icon name={"delete"} />}
                  >
                    Delete
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader>Confirmation</PopoverHeader>
                  <PopoverBody>
                    Are you sure you want to delete this Project?
                    This will destroy all associated Entities, Collections, and Attributes.
                    <Flex direction={"row"} p={"2"} justify={"center"}>
                      <Button
                        colorScheme={"green"}
                        rightIcon={<Icon name={"check"} />}
                        onClick={handleDeleteClick}
                      >
                        Confirm
                      </Button>
                    </Flex>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            )}
            <Button
              colorScheme={editing ? "green" : "gray"}
              rightIcon={
                editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
              }
              onClick={handleEditClick}
            >
              {editing ? "Done" : "Edit"}
            </Button>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"4"} p={"4"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"4"}
            gap={"2"}
            grow={"1"}
            h={"fit-content"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.100"}
          >
            {/* Details */}
            <Heading fontWeight={"semibold"} size={"lg"}>
              Details
            </Heading>

            <TableContainer>
              <Table variant={"simple"} colorScheme={"blackAlpha"}>
                <Thead>
                  <Tr>
                    <Th>Field</Th>
                    <Th>Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td>Owner</Td>
                    <Td>
                      <Tag
                        size={"md"}
                        key={`owner-${projectData._id}`}
                        colorScheme={"green"}
                      >
                        <TagLabel>{projectData.owner}</TagLabel>
                      </Tag>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td>Description</Td>
                    <Td>
                      <Textarea
                        value={projectDescription}
                        onChange={(event) => {
                          setProjectDescription(event.target.value);
                        }}
                        disabled={!editing}
                      />
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </Flex>
          <Flex
            direction={"column"}
            p={"4"}
            gap={"2"}
            grow={"1"}
            h={"fit-content"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.100"}
          >
            <Heading fontWeight={"semibold"} size={"lg"}>
              Values
            </Heading>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Project;
