import React, { useEffect, useState } from "react";
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
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";

// Custom types
import { IGenericItem, ScanModalProps } from "@types";

// GraphQL
import { gql, useLazyQuery } from "@apollo/client";

// Navigation
import { useNavigate } from "react-router-dom";

// Utility functions
import _ from "lodash";

const ScanModal = (props: ScanModalProps) => {
  const toast = useToast();
  const navigate = useNavigate();

  // State to manage identifier input visibility
  const [showInput, setShowInput] = useState(false);
  const [manualInputValue, setManualInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Input value from the scanner
  let scannerInputValue = "";

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
    setIsListening(false);
    setManualInputValue("");
    scannerInputValue = "";

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
   * Handle rapid input from the scanner
   * @param {KeyboardEvent} event Keyboard input event containing keypress data
   */
  const handleInput = (event: KeyboardEvent) => {
    scannerInputValue = `${scannerInputValue}${event.key}`;

    if (scannerInputValue.length > 5) {
      runScannerSearch();
    }
  };

  /**
   * "Debounced" function to run a search based on the provided scanner input
   */
  const runScannerSearch = _.debounce(async () => {
    const results = await entityExists({
      variables: {
        _id: scannerInputValue,
      },
    });

    if (results.data && results.data.entity) {
      handleNavigate(results.data.entity._id);
    }

    if (error || _.isUndefined(results.data)) {
      // Entity does not exist
      toast({
        title: "Error",
        status: "error",
        description: `Entity with identifier "${scannerInputValue}" not found`,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    // Reset the scanner input value
    scannerInputValue = "";
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

  useEffect(() => {
    if (props.isOpen === true && isListening === false) {
      // If the modal has been opened and the application currently is not listening to input
      setIsListening(true);
      document.onkeyup = handleInput;
    }
  }, [props.isOpen]);

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleOnClose}
      isCentered
      size={"4xl"}
    >
      <ModalOverlay />
      <ModalContent p={"2"} gap={"0"}>
        <ModalHeader p={"2"}>Scan Identifier</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={"2"} gap={"2"}>
          <Flex py={"2"}>
            <Text fontSize={"sm"}>
              You can use an external scanner device to read a QR code, or enter
              an existing Entity identifier below.
            </Text>
          </Flex>

          <Flex
            w={"100%"}
            h={"100%"}
            minH={"400px"}
            justify={"center"}
            align={"center"}
            direction={"column"}
            border={"2px dashed"}
            borderColor={"gray.400"}
            rounded={"md"}
            gap={"8"}
          >
            {/* Show "Waiting" for scanner status */}
            {!showInput && (
              <Flex
                direction={"column"}
                gap={"4"}
                align={"center"}
                justify={"center"}
              >
                <Text
                  fontWeight={"semibold"}
                  fontSize={"sm"}
                  color={"gray.600"}
                >
                  Waiting for scanner input...
                </Text>
                <Spinner color={"blue.500"} />
                <Flex>
                  <Button
                    size={"sm"}
                    colorScheme={"blue"}
                    onClick={handleManualInputSelect}
                  >
                    Enter manually
                  </Button>
                </Flex>
              </Flex>
            )}

            {/* Show manual entry field */}
            {showInput && (
              <Flex direction={"row"} gap={"2"} align={"center"}>
                <Input
                  size={"sm"}
                  rounded={"md"}
                  value={manualInputValue}
                  onChange={(event) => setManualInputValue(event.target.value)}
                  placeholder={"Identifier"}
                />
                <Button
                  size={"sm"}
                  isLoading={loading}
                  onClick={runManualSearch}
                >
                  Find
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
