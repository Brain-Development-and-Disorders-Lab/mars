import React, { useEffect, useRef, useState } from "react";
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
import Icon from "@components/Icon";

// QR code scanner components
import {
  Html5Qrcode,
  Html5QrcodeCameraScanConfig,
  Html5QrcodeScannerState,
} from "html5-qrcode";

// Custom types
import { IGenericItem, ScanModalProps, ScannerProps } from "@types";

// GraphQL
import { gql, useLazyQuery } from "@apollo/client";

// Navigation
import { useNavigate } from "react-router-dom";

// Events
import { usePostHog } from "posthog-js/react";

// Utility functions
import _ from "lodash";

// Constants
const REGION_ID = "scanner-region";

const ScanModal = (props: ScanModalProps) => {
  const posthog = usePostHog();
  const toast = useToast();
  const navigate = useNavigate();

  // State to manage identifier input visibility
  const [showInput, setShowInput] = useState(false);
  const [manualInputValue, setManualInputValue] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  // Camera state
  const [codeScanner, setCodeScanner] = useState<Html5Qrcode | null>(null);
  const cameraRef = useRef<HTMLDivElement>(null);

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
   * Creates the configuration object for Html5QrcodeScanner.
   * @param {ScannerProps} props Scanner props
   * @returns {any} Configuration object
   */
  const createConfig = (props: ScannerProps) => {
    const config: Html5QrcodeCameraScanConfig = {
      fps: _.isUndefined(props.fps) ? 10 : props.fps,
      qrbox: _.isUndefined(props.qrbox) ? 180 : props.qrbox,
      aspectRatio: _.isUndefined(props.aspectRatio) ? 1 : props.aspectRatio,
      disableFlip: _.isUndefined(props.disableFlip) ? false : props.disableFlip,
    };

    return config;
  };

  /**
   * Handle the modal being closed by the user, resetting the state and removing the keypress handler
   */
  const handleOnClose = async () => {
    await onScannerCleanup();

    // Reset state
    setShowInput(false);
    setManualInputValue("");
    setShowCamera(false);
    setCodeScanner(null);

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

  const onScannerCleanup = async () => {
    if (codeScanner?.getState() === Html5QrcodeScannerState.SCANNING) {
      await codeScanner
        .stop()
        .then(() => {
          codeScanner?.clear();
        })
        .catch((error) => {
          toast({
            id: "scanner-error",
            title: "Scanning Error",
            description: error,
            status: "error",
            duration: 3000,
            isClosable: true,
            position: "bottom-right",
          });
        });
    }
  };

  /**
   * Get an element by its ID asynchronously, waiting until the element is found
   * Credit: https://stackoverflow.com/a/63519671
   * @param {string} id Element ID
   * @returns {Promise<HTMLElement>} Element
   */
  const getElementByIdAsync = (id: string) =>
    new Promise((resolve) => {
      const getElement = () => {
        const element = document.getElementById(id);
        if (element) {
          resolve(element);
        } else {
          requestAnimationFrame(getElement);
        }
      };
      getElement();
    });

  /**
   * Setup the scanner
   */
  const setupScanner = async () => {
    await getElementByIdAsync(REGION_ID);
    if (!document.getElementById(REGION_ID)) return;

    setCodeScanner(
      new Html5Qrcode(REGION_ID, {
        verbose: false,
      }),
    );
  };

  /**
   * Start the scanner
   */
  const startScanner = async () => {
    await codeScanner?.start(
      { facingMode: "environment" },
      createConfig(props),
      (decodedText) => {
        onScannerResult(decodedText);
      },
      () => {
        return;
      },
    );
    setShowCamera(true);

    // Cleanup function when component will unmount
    return () => {
      onScannerCleanup();
    };
  };

  // Setup the scanner when the modal is opened
  useEffect(() => {
    if (props.isOpen) {
      setupScanner();
    }
  }, [props.isOpen]);

  // Start the scanner when the scanner is ready
  useEffect(() => {
    if (
      codeScanner &&
      codeScanner.getState() === Html5QrcodeScannerState.NOT_STARTED
    ) {
      startScanner();
    }
  }, [codeScanner]);

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleOnClose}
      isCentered
      scrollBehavior={"inside"}
    >
      <ModalOverlay />
      <ModalContent p={"2"} gap={"0"}>
        <ModalHeader p={"2"}>Scan Identifier</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={"2"} gap={"2"} w={"100%"} alignContent={"center"}>
          {/* Camera view */}
          <Flex justify={"center"} align={"center"}>
            <Flex
              id={REGION_ID}
              ref={cameraRef}
              direction={"column"}
              w={"100%"}
              h={"100%"}
              justify={"center"}
              align={"center"}
              border={showCamera ? "2px" : "none"}
              borderColor={showCamera ? "gray.400" : "transparent"}
              rounded={"md"}
            ></Flex>
          </Flex>

          {!showCamera && (
            <Flex
              w={"100%"}
              h={"100%"}
              justify={"center"}
              align={"center"}
              p={"2"}
              gap={"2"}
            >
              <Spinner />
              <Text fontWeight={"semibold"} fontSize={"sm"}>
                Initializing camera...
              </Text>
            </Flex>
          )}

          {/* Manual entry field */}
          <Flex
            align={"center"}
            mt={"4"}
            w={"100%"}
            justify={"center"}
            gap={"2"}
          >
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
                <Flex grow={1}>
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
