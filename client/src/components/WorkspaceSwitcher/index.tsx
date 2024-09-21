import React, { useContext, useEffect, useState } from "react";
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
import { IAuth, WorkspaceModel } from "@types";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import _ from "lodash";

// Workspace context
import { WorkspaceContext } from "src/Context";

const WorkspaceSwitcher = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Store all Workspaces
  const [workspaces, setWorkspaces] = useState([] as WorkspaceModel[]);

  // Access token to set the active Workspace
  const [token, setToken] = useToken();

  // Workspace context value
  const { workspace, setWorkspace, setWorkspaceLoading } =
    useContext(WorkspaceContext);

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
      // Clone the existing token and update with selected Workspace ID
      const updatedToken: IAuth = _.cloneDeep(token);
      updatedToken.workspace = resultWorkspace.data.workspace._id;
      setToken(updatedToken);

      // Update the UI state to reflect the change in Workspace
      setLabel(resultWorkspace.data.workspace.name);
      setWorkspace(resultWorkspace.data.workspace._id);
    }

    if (workspaceError) {
      toast({
        title: "Error",
        description: "Unable to retrieve Workspace",
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
    if (workspace !== _id) {
      setWorkspace(_id);
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

  /**
   * Handle click events within the `Log out` button
   */
  const performLogout = () => {
    // Invalidate the token and refresh the page
    setToken({
      name: token.name,
      orcid: token.orcid,
      token: "",
      workspace: "",
    });
    navigate(0);
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
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              {_.truncate(label, { length: 16 })}
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
                    onClick={() => handleWorkspaceClick(accessible._id)}
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
            <MenuItem onClick={() => performLogout()}>
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
