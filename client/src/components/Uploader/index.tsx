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
  Link,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Error from "@components/Error";

// Utility functions and libraries
import { postData } from "@database/functions";
import _ from "lodash";

const Uploader = (props: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  target: string;
  uploads: string[],
  setUploads: React.Dispatch<React.SetStateAction<string[]>>,
}) => {
  const [file, setFile] = useState({} as File);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const toast = useToast();

  const performUpload = () => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("name", file.name);
    formData.append("file", file);
    formData.append("target", props.target);

    postData(`/system/upload`, formData)
      .then((response: { status: boolean; message: string; data?: any }) => {
        if (_.isEqual(response.status, "success")) {
          // Add the upload to the existing list of uploads
          props.setUploads([...props.uploads, file.name]);

          // Reset file upload state
          setFile({} as File);
          props.onClose();

          // Update state
          setIsError(false);
          setIsLoaded(true);

          toast({
            title: "Success",
            status: "success",
            description: "Successfully uploaded file.",
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });

          toast({
            title: "Success",
            status: "success",
            description: (
              <Flex w={"100%"} direction={"row"} gap={"4"}>
                Updated data available.
                <Link onClick={() => window.location.reload()}>
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Text fontWeight={"semibold"}>Reload</Text>
                    <Icon name={"reload"} />
                  </Flex>
                </Link>
              </Flex>
            ),
            duration: null,
            position: "bottom",
            isClosable: true,
          });
        } else {
          toast({
            title: "Error",
            status: "error",
            description: response.message,
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
          setIsError(true);
        }
        setIsUploading(false);
      })
      .catch((error: { message: string }) => {
        toast({
          title: "Error",
          status: "error",
          description: error.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsUploading(false);
      });
  };

  return (
    <>
      {isLoaded && isError ? (
        <Error />
      ) : (
        <>
          <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Upload Attachment</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
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
                      borderColor={"gray.100"}
                      rounded={"md"}
                    >
                      {_.isEqual(file, {}) ? (
                        <Flex
                          direction={"column"}
                          w={"100%"}
                          justify={"center"}
                          align={"center"}
                        >
                          <Text fontWeight={"semibold"}>
                            Drag image here
                          </Text>
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
                      onChange={(
                        event: ChangeEvent<HTMLInputElement>
                      ) => {
                        if (event.target.files) {
                          // Only accept image files
                          if (
                            _.includes(
                              [
                                "image/jpeg",
                                "image/png",
                              ],
                              event.target.files[0].type
                            )
                          ) {
                            setFile(event.target.files[0]);
                          } else {
                            toast({
                              title: "Warning",
                              status: "warning",
                              description:
                                "Please upload a JPEG or PNG image",
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

              <ModalFooter>
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
                    disabled={_.isEqual(file, {}) || isUploading}
                    rightIcon={<Icon name={"upload"} />}
                    onClick={() => performUpload()}
                    isLoading={isUploading}
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
