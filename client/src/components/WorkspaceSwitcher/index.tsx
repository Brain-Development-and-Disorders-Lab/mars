import React, { useEffect, useState } from "react";
import {
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
import { IGenericItem, WorkspaceModel } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Contexts
import { useWorkspace } from "src/hooks/useWorkspace";
import { useAuthentication } from "src/hooks/useAuthentication";

const WorkspaceSwitcher = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Store all Workspaces
  const [workspaces, setWorkspaces] = useState([] as WorkspaceModel[]);

  // Get contexts
  const { workspace, activateWorkspace } = useWorkspace();
  const { logout } = useAuthentication();

  // Switcher drop-down visibility state
  const [isOpen, setIsOpen] = useState(false);

  // Switcher label text
  const [label, setLabel] = useState("Select Workspace");

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
   * Async function to retrieve the name of the initially selected Workspace
   */
  const setInitialLabelValue = async () => {
    const workspaceResult = await getWorkspace({
      variables: {
        _id: workspace,
      },
    });

    if (_.isUndefined(workspaceResult.data) || !_.isUndefined(workspaceError)) {
      toast({
        title: "Error",
        description: "Unable to get name of current Workspace",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      setLabel(workspaceResult.data.workspace.name);
    }
  };

  // Update the label value on first render
  useEffect(() => {
    setInitialLabelValue();
  }, []);

  /**
   * Utility function to update the list of Workspaces
   */
  const updateWorkspaces = async () => {
    // Refresh the list of Workspaces
    const resultWorkspaces = await getWorkspaces();
    if (resultWorkspaces.data?.workspaces) {
      setWorkspaces(resultWorkspaces.data.workspaces);
    }

    if (workspacesError) {
      toast({
        title: "Error",
        description: "Unable to update list of Workspaces",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
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

  // When the label is updated, refresh the list of Workspaces
  useEffect(() => {
    updateWorkspaces();
  }, [label]);

  /**
   * Handle selecting a Workspace from the drop-down
   * @param selectedWorkspace Identifier and name of selected Workspace
   */
  const handleWorkspaceClick = async (selectedWorkspace: IGenericItem) => {
    if (workspace !== selectedWorkspace._id) {
      await activateWorkspace(selectedWorkspace._id);
      setLabel(selectedWorkspace.name);
      setIsOpen(false);
    }
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

  /**
   * Handle click events within the `Profile` button
   */
  const handleProfileClick = () => {
    navigate("/profile");
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
          borderColor={"gray.300"}
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
            <Icon name={"workspace"} />
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              {_.truncate(label, { length: 14 })}
            </Text>
            <Spacer />
            <Icon name={"c_expand"} />
          </Flex>
        </MenuButton>

        <MenuList bg={"white"}>
          <MenuGroup>
            {/* Create a list of all Workspaces the user has access to */}
            {workspaces.length > 0 ? (
              workspaces.map((accessible) => {
                return (
                  <MenuItem
                    onClick={() => handleWorkspaceClick(accessible)}
                    key={"w_" + accessible._id}
                  >
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      w={"100%"}
                      align={"center"}
                      justify={"space-between"}
                    >
                      <Tooltip label={accessible.name} hasArrow>
                        <Text fontSize={"sm"} fontWeight={"semibold"}>
                          {_.truncate(accessible.name, { length: 24 })}
                        </Text>
                      </Tooltip>
                      {workspace === accessible._id && (
                        <Icon name={"check"} color={"green.600"} />
                      )}
                    </Flex>
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem isDisabled>
                <Flex
                  direction={"row"}
                  gap={"2"}
                  w={"100%"}
                  align={"center"}
                  justify={"space-between"}
                >
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    No Workspaces
                  </Text>
                </Flex>
              </MenuItem>
            )}
          </MenuGroup>

          <MenuGroup>
            {/* Option to create a new Workspace */}
            <MenuItem
              onClick={() => handleUpdateClick()}
              isDisabled={workspaces.length === 0}
            >
              <Flex direction={"row"} gap={"2"} align={"center"}>
                <Icon name={"edit"} />
                <Text fontSize={"sm"}>Edit workspace</Text>
              </Flex>
            </MenuItem>
            <MenuItem onClick={() => handleCreateClick()}>
              <Flex direction={"row"} gap={"2"} align={"center"}>
                <Icon name={"add"} />
                <Text fontSize={"sm"}>Create workspace</Text>
              </Flex>
            </MenuItem>
          </MenuGroup>

          <MenuDivider />

          <MenuGroup>
            <MenuItem onClick={() => handleProfileClick()}>
              <Flex direction={"row"} gap={"2"} align={"center"}>
                <Icon name={"person"} />
                <Text fontSize={"sm"}>Account settings</Text>
              </Flex>
            </MenuItem>
            <MenuItem onClick={() => logout()}>
              <Flex direction={"row"} gap={"2"} align={"center"}>
                <Icon name={"b_right"} />
                <Text fontSize={"sm"}>Log out</Text>
              </Flex>
            </MenuItem>
          </MenuGroup>
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default WorkspaceSwitcher;
