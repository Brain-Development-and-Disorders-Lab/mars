// React
import React, { ChangeEvent, useState } from "react";

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
  const [file, setFile] = useState({} as File);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const toast = useToast();

  const UPLOAD_FILE = gql`
    mutation UploadFile($file: Upload!) {
      uploadFile(file: $file) {
        mimetype
        filename
        encoding
      }
    }
  `;
  const [uploadFile, { loading, error }] = useMutation(UPLOAD_FILE);

  const performUpload = async () => {
    const response = await uploadFile({
      variables: {
        file,
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

    if (response.data?.uploadFile) {
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
        description: `Uploaded file "${response.data.uploadFile.filename}"`,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  return (
    <>
      {isLoaded && isError ? (
        <Error />
      ) : (
        <>
          <Modal isOpen={props.isOpen} onClose={props.onClose} isCentered>
            <ModalOverlay />
            <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
              <ModalHeader p={"2"}>Upload Attachment</ModalHeader>
              <ModalCloseButton />
              <ModalBody p={"2"}>
                <Flex w={"100%"} align={"center"} justify={"center"}>
                  <FormControl>
                    <Flex
                      direction={"column"}
                      minH={"200px"}
                      w={"100%"}
                      align={"center"}
                      justify={"center"}
                      border={"2px"}
                      borderStyle={"dashed"}
                      borderColor={"gray.200"}
                      rounded={"md"}
                    >
                      {_.isEqual(file, {}) ? (
                        <Flex
                          direction={"column"}
                          w={"100%"}
                          justify={"center"}
                          align={"center"}
                        >
                          <Text fontWeight={"semibold"}>Drag file here</Text>
                          <Text>or click to upload</Text>
                        </Flex>
                      ) : (
                        <Flex
                          direction={"column"}
                          w={"100%"}
                          justify={"center"}
                          align={"center"}
                        >
                          <Text fontWeight={"semibold"}>{file.name}</Text>
                        </Flex>
                      )}
                    </Flex>
                    <Input
                      type={"file"}
                      h={"100%"}
                      w={"100%"}
                      position={"absolute"}
                      top={"0"}
                      left={"0"}
                      opacity={"0"}
                      aria-hidden={"true"}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        if (event.target.files) {
                          // Only accept image or PDF files
                          if (
                            _.includes(
                              ["image/jpeg", "image/png", "application/pdf"],
                              event.target.files[0].type,
                            )
                          ) {
                            setFile(event.target.files[0]);
                          } else {
                            toast({
                              title: "Warning",
                              status: "warning",
                              description:
                                "Please upload an image (JPEG, PNG) or PDF file",
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
              </ModalBody>

              <ModalFooter p={"2"}>
                <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                  <Button
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
                    colorScheme={"blue"}
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
