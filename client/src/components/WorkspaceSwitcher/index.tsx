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
  useToast,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// GraphQL resources
import { gql, useLazyQuery, useQuery } from "@apollo/client";

// Navigation
import { useNavigate } from "react-router-dom";

// Custom types
import { IAuth, WorkspaceModel } from "@types";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import _ from "lodash";
import { WorkspaceContext } from "src/Context";

const WorkspaceSwitcher = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Store all Workspaces
  const [workspaces, setWorkspaces] = useState([] as WorkspaceModel[]);

  // Access token to set the active Workspace
  const [token, setToken] = useToken();

  // Workspace context value
  const { workspace, setWorkspace, setWorkspaceLoading, label, setLabel } =
    useContext(WorkspaceContext);

  // Switcher drop-down visibility state
  const [isOpen, setIsOpen] = useState(false);

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
  const [getWorkspaces, { error: workspacesError }] = useLazyQuery<{
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

  /**
   * Utility function to update the current Workspace data
   */
  const updateWorkspace = async () => {
    setWorkspaceLoading(true);

    // When the `workspace` value changes, retrieve updated model
    const resultWorkspace = await getWorkspace({
      variables: {
        _id: workspace,
      },
    });

    if (resultWorkspace.data?.workspace) {
      setWorkspace(resultWorkspace.data.workspace._id);
      setLabel(resultWorkspace.data.workspace.name);

      // Clone the existing token and update with selected Workspace ID
      const updatedToken: IAuth = _.cloneDeep(token);
      updatedToken.workspace = workspace;
      setToken(updatedToken);
    }

    if (workspaceError || workspacesError) {
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

  /**
   * Utility function to update the list of Workspaces
   */
  const updateWorkspaces = async () => {
    // Refresh the list of Workspaces
    const resultWorkspaces = await getWorkspaces();
    if (resultWorkspaces.data?.workspaces) {
      setWorkspaces(resultWorkspaces.data.workspaces);
    }
  };

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
    if (workspace !== "") {
      updateWorkspace();
    } else {
      navigate("/create/workspace");
    }
  }, [workspace]);

  // When the label is updated, refresh the list of Workspaces
  useEffect(() => {
    updateWorkspaces();
  }, [label]);

  /**
   * Handle selecting a Workspace from the drop-down
   * @param _id Identifier of selected Workspace
   */
  const handleWorkspaceClick = (_id: string) => {
    setWorkspace(_id);
    setIsOpen(false);
  };

  /**
   * Handle click events within the `Update Workspace` button
   */
  const handleUpdateClick = () => {
    // Open the update Workspace modal
    navigate(`/workspaces/${workspace}`);

    // Ensure `WorkspaceSwitcher` is closed
    setIsOpen(false);
  };

  /**
   * Handle click events within the `Create Workspace` button
   */
  const handleCreateClick = () => {
    // Open the create Workspace modal
    navigate("/create/workspace");

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
          bg={workspaces.length === 0 ? "gray.100" : "white"}
          _hover={{ bg: workspaces.length === 0 ? "" : "gray.300" }}
          onClick={() => setIsOpen(!isOpen)}
          disabled={workspaces.length === 0}
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
              {_.truncate(label, { length: 15 })}
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
            {workspaces.map((accessible) => {
              return (
                <Tooltip
                  key={accessible._id}
                  isDisabled={accessible._id !== workspace}
                  label={"Current Workspace"}
                >
                  <MenuItem
                    isDisabled={accessible._id === workspace}
                    onClick={() => handleWorkspaceClick(accessible._id)}
                  >
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      {accessible.name}
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
    </Flex>
  );
};

export default WorkspaceSwitcher;
