import React, { useState } from "react";
import {
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react";

// Custom types
import { IGenericItem, ScanModalProps } from "@types";

// GraphQL
import { gql, useLazyQuery } from "@apollo/client";

// Navigation
import { useNavigate } from "react-router-dom";

// Events
import { usePostHog } from "posthog-js/react";

// Utility functions
import _ from "lodash";
import Scanner from "@components/Scanner";
import Icon from "@components/Icon";
import { Warning } from "@components/Label";

const ScanModal = (props: ScanModalProps) => {
  const posthog = usePostHog();
  const toast = useToast();
  const navigate = useNavigate();

  // State to manage identifier input visibility
  const [showInput, setShowInput] = useState(false);
  const [manualInputValue, setManualInputValue] = useState("");

  // GraphQL query to check if Entity exists
  const ENTITY_EXISTS = gql`
    query EntityExists($_id: String) {
      entity(_id: $_id) {
        _id
        name
      }
    }
  `;

  const [entityExists, { loading, error }] = useLazyQuery<{
    entity: IGenericItem;
  }>(ENTITY_EXISTS);

  /**
   * Handle the modal being closed by the user, resetting the state and removing the keypress handler
   */
  const handleOnClose = () => {
    // Reset state
    setShowInput(false);
    setManualInputValue("");

    // Reset the `onkeyup` listener
    document.onkeyup = () => {
      return;
    };

    props.onClose();
  };

  /**
   * Handle the `View` button action when an Entity does exist
   * @param {string} identifier Entity identifier
   */
  const handleNavigate = (identifier: string) => {
    // Capture event
    posthog.capture("scan_success", {
      target: identifier,
    });

    handleOnClose();
    navigate(`/entities/${identifier}`);
  };

  /**
   * Handle the `Enter manually` button being selected, showing the input field and removing the keypress handler
   */
  const handleManualInputSelect = () => {
    // Show the input field
    setShowInput(true);

    // Reset the `onkeyup` listener
    document.onkeyup = () => {
      return;
    };
  };

  /**
   * "Debounced" function to run a search based on the provided scanner input
   */
  const runScannerSearch = _.debounce(async (input: string) => {
    const results = await entityExists({
      variables: {
        _id: input,
      },
    });

    if (results.data && results.data.entity) {
      posthog.capture("scan_scanner_input_success");
      handleNavigate(results.data.entity._id);
    }

    if (error || _.isUndefined(results.data)) {
      // Entity does not exist
      toast({
        title: "Error",
        status: "error",
        description: `Entity with identifier "${input}" not found`,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, 200);

  /**
   * Generic function to run a manual search to see if the Entity with specified identifier exists or not
   */
  const runManualSearch = async () => {
    const results = await entityExists({
      variables: {
        _id: manualInputValue,
      },
    });

    if (results.data && results.data.entity) {
      posthog.capture("scan_manual_input_success");
      handleNavigate(results.data.entity._id);
    }

    if (error || _.isUndefined(results.data)) {
      // Entity does not exist
      if (!toast.isActive("entityNotExist")) {
        toast({
          id: "entityNotExist",
          title: "Error",
          status: "error",
          description: `Entity with identifier "${manualInputValue}" not found`,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    }
  };

  /**
   * Handle the scanner result
   * @param {string} input Scanner input
   */
  const onScannerResult = (input: string) => {
    runScannerSearch(input);
  };

  return (
    <Modal isOpen={props.isOpen} onClose={handleOnClose} isCentered size={"xl"}>
      <ModalOverlay />
      <ModalContent p={"2"} gap={"0"}>
        <ModalHeader p={"2"}>Scan Identifier</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={"2"} gap={"2"} w={"100%"}>
          {/* Warning label */}
          <Flex mb={"4"}>
            <Warning text={"Scanning is an experimental feature"} />
          </Flex>

          {/* Scanner */}
          <Flex
            w={"100%"}
            h={"100%"}
            minH={"400px"}
            justify={"center"}
            align={"center"}
            direction={"column"}
            gap={"8"}
          >
            <Scanner
              fps={10}
              qrbox={250}
              disableFlip={false}
              verbose={false}
              rememberLastUsedCamera={true}
              qrCodeSuccessCallback={onScannerResult}
            />
          </Flex>

          {/* Manual entry field */}
          <Flex mt={"4"} w={"100%"} justify={"center"} gap={"2"}>
            {!showInput && (
              <Flex>
                <Button
                  size={"sm"}
                  colorScheme={"blue"}
                  onClick={handleManualInputSelect}
                >
                  Enter manually
                </Button>
              </Flex>
            )}

            {showInput && (
              <Flex direction={"row"} gap={"2"} align={"center"} w={"100%"}>
                <Flex w={"auto"}>
                  <Input
                    size={"sm"}
                    rounded={"md"}
                    value={manualInputValue}
                    onChange={(event) =>
                      setManualInputValue(event.target.value)
                    }
                    placeholder={"Identifier"}
                  />
                </Flex>

                <Button
                  size={"sm"}
                  isLoading={loading}
                  rightIcon={<Icon name={"search"} />}
                  onClick={runManualSearch}
                >
                  Find
                </Button>

                <Button
                  size={"sm"}
                  isLoading={loading}
                  colorScheme={"red"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={() => setShowInput(false)}
                >
                  Cancel
                </Button>
              </Flex>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ScanModal;
