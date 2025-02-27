// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Button,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Input,
  ModalFooter,
  FormControl,
  Tag,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Error from "@components/Error";

// Utility functions and libraries
import _ from "lodash";
import { gql, useMutation } from "@apollo/client";

const Uploader = (props: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  target: string;
  uploads: string[];
  setUploads: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  // File to be uploaded
  const [file, setFile] = useState({} as File);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Display name and type of the file
  const [displayName, setDisplayName] = useState("");
  const [displayType, setDisplayType] = useState("");

  const toast = useToast();

  const UPLOAD_ATTACHMENT = gql`
    mutation UploadAttachment($target: String!, $file: Upload!) {
      uploadAttachment(target: $target, file: $file) {
        success
        message
      }
    }
  `;
  const [uploadAttachment, { loading, error }] = useMutation(UPLOAD_ATTACHMENT);

  const performUpload = async () => {
    const response = await uploadAttachment({
      variables: {
        target: props.target,
        file: file,
      },
    });

    if (error) {
      toast({
        title: "Upload Error",
        status: "error",
        description: "Error occurred while uploading file",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }

    if (response.data.uploadAttachment.success) {
      // Add the upload to the existing list of uploads
      props.setUploads([...props.uploads, file.name]);

      // Reset file upload state
      setFile({} as File);
      props.onClose();

      // Update state
      setIsError(false);
      setIsLoaded(true);

      toast({
        title: "Uploaded",
        status: "success",
        description: `Uploaded file successfully`,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  // Set the display name and type of the file when uploaded
  useEffect(() => {
    if (file.type === "application/pdf") {
      setDisplayName(file.name);
      setDisplayType("PDF file");
    } else if (file.type === "image/jpeg" || file.type === "image/png") {
      setDisplayName(file.name);
      setDisplayType("Image file");
    } else if (_.endsWith(file.name, ".dna")) {
      setDisplayName(file.name);
      setDisplayType("Sequence file");
    }
  }, [file]);

  return (
    <>
      {isLoaded && isError ? (
        <Error />
      ) : (
        <>
          <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            isCentered
            size={"4xl"}
          >
            <ModalOverlay />
            <ModalContent p={"2"} gap={"0"}>
              <ModalHeader px={"2"}>Upload Attachment</ModalHeader>
              <ModalCloseButton />
              <ModalBody px={"2"}>
                <Flex gap={"2"} direction={"column"}>
                  <Flex gap={"1"} direction={"row"} align={"center"}>
                    <Text fontSize={"sm"}>Supported file formats:</Text>
                    <Tag colorScheme={"green"} size={"sm"}>
                      PDF
                    </Tag>
                    <Tag colorScheme={"green"} size={"sm"}>
                      JPEG
                    </Tag>
                    <Tag colorScheme={"green"} size={"sm"}>
                      PNG
                    </Tag>
                    <Tag colorScheme={"green"} size={"sm"}>
                      DNA
                    </Tag>
                  </Flex>
                  <Flex w={"100%"} align={"center"} justify={"center"}>
                    <FormControl>
                      <Flex
                        direction={"column"}
                        minH={"50vh"}
                        w={"100%"}
                        align={"center"}
                        justify={"center"}
                        border={"2px"}
                        borderStyle={"dashed"}
                        borderColor={"gray.300"}
                        bg={"gray.50"}
                        rounded={"md"}
                      >
                        {_.isEqual(file, {}) ? (
                          <Flex
                            direction={"column"}
                            w={"100%"}
                            justify={"center"}
                            align={"center"}
                          >
                            <Text fontWeight={"semibold"} fontSize={"sm"}>
                              Drag file here
                            </Text>
                            <Text fontSize={"sm"}>or click to upload</Text>
                          </Flex>
                        ) : (
                          <Flex
                            direction={"column"}
                            w={"100%"}
                            justify={"center"}
                            align={"center"}
                          >
                            <Text fontWeight={"semibold"} fontSize={"sm"}>
                              {displayName}
                            </Text>
                            <Text
                              fontWeight={"semibold"}
                              fontSize={"xs"}
                              textColor={"gray.600"}
                            >
                              {displayType}
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                      <Input
                        type={"file"}
                        h={"100%"}
                        w={"100%"}
                        rounded={"md"}
                        position={"absolute"}
                        top={"0"}
                        left={"0"}
                        opacity={"0"}
                        aria-hidden={"true"}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          if (
                            event.target.files &&
                            event.target.files.length > 0
                          ) {
                            // Only accept image or PDF files
                            if (
                              _.includes(
                                ["image/jpeg", "image/png", "application/pdf"],
                                event.target.files[0].type,
                              ) ||
                              _.endsWith(event.target.files[0].name, ".dna")
                            ) {
                              setFile(event.target.files[0]);
                            } else {
                              toast({
                                title: "Warning",
                                status: "warning",
                                description:
                                  "Please upload an image (JPEG, PNG), PDF file, or sequence file (DNA)",
                                duration: 4000,
                                position: "bottom-right",
                                isClosable: true,
                              });
                            }
                          }
                        }}
                      />
                    </FormControl>
                  </Flex>
                </Flex>
              </ModalBody>
              <ModalFooter p={"2"}>
                <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                  <Button
                    size={"sm"}
                    colorScheme={"red"}
                    rightIcon={<Icon name="cross" />}
                    variant={"outline"}
                    onClick={() => {
                      setFile({} as File);
                      props.onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size={"sm"}
                    colorScheme={"green"}
                    isDisabled={_.isEqual(file, {}) || loading}
                    rightIcon={<Icon name={"upload"} />}
                    onClick={() => performUpload()}
                    isLoading={loading}
                  >
                    Upload
                  </Button>
                </Flex>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )}
    </>
  );
};

export default Uploader;
