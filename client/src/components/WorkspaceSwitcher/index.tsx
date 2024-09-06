import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import WorkspaceCreateModal from "@components/WorkspaceCreateModal";
import WorkspaceUpdateModal from "@components/WorkspaceUpdateModal";

// GraphQL resources
import { gql, useLazyQuery, useQuery } from "@apollo/client";

// Custom types
import { IAuth, WorkspaceModel } from "@types";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import _ from "lodash";
import { WorkspaceContext } from "src/Context";

const WorkspaceSwitcher = () => {
  const toast = useToast();

  // Store all Workspaces
  const [workspaces, setWorkspaces] = useState([] as WorkspaceModel[]);

  // Value displayed on the `Select` component
  const [labelValue, setLabelValue] = useState("");

  // Access token to set the active Workspace
  const [token, setToken] = useToken();
  const [workspaceIdentifier, setWorkspaceIdentifier] = useState(
    token.workspace,
  );

  // Workspace context value
  const { setWorkspace, setWorkspaceLoading } = useContext(WorkspaceContext);

  const [isOpen, setIsOpen] = useState(false);
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isUpdateOpen,
    onOpen: onUpdateOpen,
    onClose: onUpdateClose,
  } = useDisclosure();

  // Queries (active and lazy) to retrieve all Workspaces
  const GET_WORKSPACES = gql`
    query GetWorkspaces {
      workspaces {
        _id
        owner
        name
        description
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery<{
    workspaces: WorkspaceModel[];
  }>(GET_WORKSPACES, { fetchPolicy: "network-only" });

  // Query to get a Workspace
  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
      }
    }
  `;
  const [getWorkspace, { error: workspaceError }] = useLazyQuery<{
    workspace: WorkspaceModel;
  }>(GET_WORKSPACE, { fetchPolicy: "network-only" });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.workspaces) {
      // Unpack all the Entity data
      setWorkspaces(data.workspaces);
    }

    if (error) {
      toast({
        title: "Error",
        description: "Unable to retrieve Workspaces",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [loading]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  useEffect(() => {
    const updateWorkspace = async () => {
      setWorkspaceLoading(true);

      // When the `workspaceIdentifier` value changes, retrieve updated model
      const result = await getWorkspace({
        variables: {
          _id: workspaceIdentifier,
        },
      });

      if (result.data?.workspace) {
        setWorkspace(result.data.workspace._id);
        setLabelValue(result.data.workspace.name);

        // Clone the existing token and update with selected Workspace ID
        const updatedToken: IAuth = _.cloneDeep(token);
        updatedToken.workspace = workspaceIdentifier;
        setToken(updatedToken);
      }

      if (workspaceError) {
        toast({
          title: "Error",
          description: "Unable to retrieve Workspaces",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      // Update the Workspace loading state
      setWorkspaceLoading(false);
    };

    if (workspaceIdentifier !== "") {
      updateWorkspace();
    } else {
      onCreateOpen();
    }
  }, [workspaceIdentifier]);

  /**
   * Handle selecting a Workspace from the drop-down
   * @param _id Identifier of selected Workspace
   */
  const handleWorkspaceClick = (_id: string) => {
    setWorkspaceIdentifier(_id);
    setIsOpen(false);
  };

  /**
   * Handle click events within the `Update Workspace` button
   */
  const handleUpdateClick = () => {
    // Open the update Workspace modal
    onUpdateOpen();

    // Ensure `WorkspaceSwitcher` is closed
    setIsOpen(false);
  };

  /**
   * Handle click events within the `Create Workspace` button
   */
  const handleCreateClick = () => {
    // Open the create Workspace modal
    onCreateOpen();

    // Ensure `WorkspaceSwitcher` is closed
    setIsOpen(false);
  };

  return (
    <Flex>
      <Menu isOpen={isOpen} autoSelect={false}>
        <MenuButton
          h={"100%"}
          w={"100%"}
          rounded={"md"}
          border={"1px"}
          borderColor={"gray.200"}
          bg={"white"}
          _hover={{ bg: "gray.300" }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Flex
            direction={"row"}
            gap={"2"}
            align={"center"}
            p={"2"}
            ml={"2"}
            mr={"2"}
          >
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              {_.truncate(labelValue, { length: 15 })}
            </Text>
            <Spacer />
            <Icon name={isOpen ? "c_up" : "c_down"} />
          </Flex>
        </MenuButton>

        <MenuList bg={"white"}>
          <MenuGroup>
            <Flex px={"2"}>
              <Text fontWeight={"semibold"} size={"sm"}>
                Select Workspace
              </Text>
            </Flex>
          </MenuGroup>

          <MenuDivider />

          <MenuGroup>
            {/* Create a list of all Workspaces the user has access to */}
            {workspaces.map((workspace) => {
              return (
                <Tooltip
                  key={workspace._id}
                  isDisabled={workspace._id !== workspaceIdentifier}
                  label={"Current Workspace"}
                >
                  <MenuItem
                    isDisabled={workspace._id === workspaceIdentifier}
                    onClick={() => handleWorkspaceClick(workspace._id)}
                  >
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      {workspace.name}
                    </Text>
                  </MenuItem>
                </Tooltip>
              );
            })}
          </MenuGroup>

          <MenuDivider />

          <MenuGroup>
            {/* Option to create a new Workspace */}
            <Flex
              direction={"row"}
              align={"center"}
              justify={"center"}
              gap={"2"}
              w={"100%"}
            >
              <Button
                size={"sm"}
                leftIcon={<Icon size={"sm"} name={"settings"} />}
                onClick={() => handleUpdateClick()}
              >
                Update
              </Button>
              <Button
                size={"sm"}
                colorScheme={"green"}
                onClick={() => handleCreateClick()}
                leftIcon={<Icon size={"sm"} name={"add"} />}
              >
                Create
              </Button>
            </Flex>
          </MenuGroup>
        </MenuList>
      </Menu>

      {/* Modal to create a Workspace */}
      <WorkspaceCreateModal
        isOpen={isCreateOpen}
        onOpen={onCreateOpen}
        onClose={onCreateClose}
        workspaceIdentifier={workspaceIdentifier}
        setWorkspaceIdentifier={setWorkspaceIdentifier}
        setWorkspaces={setWorkspaces}
      />

      {/* Modal to update the current Workspace */}
      <WorkspaceUpdateModal
        isOpen={isUpdateOpen}
        onOpen={onUpdateOpen}
        onClose={onUpdateClose}
        workspaceIdentifier={workspaceIdentifier}
      />
    </Flex>
  );
};

export default WorkspaceSwitcher;
