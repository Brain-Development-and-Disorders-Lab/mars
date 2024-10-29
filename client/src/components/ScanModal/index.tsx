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
  Spinner,
  Text,
} from "@chakra-ui/react";

// Custom types
import { ScanModalProps } from "@types";

const ScanModal = (props: ScanModalProps) => {
  // State to manage identifier input visibility
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleOnClose = () => {
    // Reset state
    setShowInput(false);
    setInputValue("");

    props.onClose();
  };

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
            <Flex
              direction={"column"}
              gap={"4"}
              align={"center"}
              justify={"center"}
            >
              <Text fontWeight={"semibold"} fontSize={"sm"} color={"gray.600"}>
                Waiting for scanner input...
              </Text>
              <Spinner color={"blue.500"} />
            </Flex>

            <Flex direction={"row"} gap={"2"} align={"center"}>
              {showInput ? (
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Input
                    size={"sm"}
                    rounded={"md"}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder={"Identifier"}
                  />
                  <Button size={"sm"}>Find</Button>
                </Flex>
              ) : (
                <Button
                  size={"sm"}
                  colorScheme={"blue"}
                  onClick={() => setShowInput(true)}
                >
                  Enter manually
                </Button>
              )}
            </Flex>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ScanModal;
