// React
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

// Existing and custom components
import { Button, Dialog, CloseButton, Fieldset, Flex, Input, Tag, Text } from "@chakra-ui/react";
import Error from "@components/Error";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Utility functions and libraries
import _ from "lodash";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// Custom types
import { ResponseData } from "@types";

// Variables
import { GLOBAL_STYLES } from "@variables";

const UploadDialog = (props: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  target: string;
  uploads: string[];
  setUploads: React.Dispatch<React.SetStateAction<string[]>>;
  onUploadSuccess?: () => void;
}) => {
  const [file, setFile] = useState<File>({} as File);
  const [displayName, setDisplayName] = useState<string>("");
  const [displayType, setDisplayType] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const UPLOAD_ATTACHMENT = gql`
    mutation UploadAttachment($target: String!, $file: Upload!) {
      uploadAttachment(target: $target, file: $file) {
        success
        message
        data
      }
    }
  `;
  const [uploadAttachment, { loading, error }] = useMutation<{
    uploadAttachment: ResponseData<string>;
  }>(UPLOAD_ATTACHMENT);

  // Update display name and type when file changes
  useEffect(() => {
    if (!_.isEqual(file, {})) {
      setDisplayName(file.name);
      setDisplayType(file.type);
    } else {
      setDisplayName("");
      setDisplayType("");
    }
  }, [file]);

  const performUpload = async () => {
    if (_.isEqual(file, {})) return;

    try {
      const response = await uploadAttachment({
        variables: {
          target: props.target,
          file: file,
        },
      });

      if (error || !response.data?.uploadAttachment) {
        toaster.create({
          title: "Upload Error",
          type: "error",
          description: "Unable to upload file",
          duration: 4000,
          closable: true,
        });
        setIsError(true);
        return;
      }

      if (response.data?.uploadAttachment?.success) {
        // Add the upload to the existing list of uploads
        props.setUploads([...props.uploads, response.data?.uploadAttachment.data]);

        // Reset file upload state
        setFile({} as File);
        props.setOpen(false);

        // Update state
        setIsError(false);
        setIsLoaded(true);

        // Call success callback to refetch data
        if (props.onUploadSuccess) {
          props.onUploadSuccess();
        }

        toaster.create({
          title: "Uploaded",
          type: "success",
          description: `Uploaded file successfully`,
          duration: 4000,
          closable: true,
        });
      }
    } catch {
      toaster.create({
        title: "Error",
        description: "Failed to upload file",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const droppedFile = event.dataTransfer.files[0];

      // Only accept image or PDF files
      if (
        _.includes(["image/jpeg", "image/png", "application/pdf"], droppedFile.type) ||
        _.endsWith(droppedFile.name, ".dna")
      ) {
        setFile(droppedFile);
      } else {
        toaster.create({
          title: "Warning",
          type: "warning",
          description: "Please upload an image (JPEG, PNG), PDF file, or sequence file (DNA)",
          duration: 4000,
          closable: true,
        });
      }
    }
  };

  return (
    <>
      {isLoaded && isError ? (
        <Error />
      ) : (
        <Dialog.Root
          open={props.open}
          onOpenChange={(details) => {
            props.setOpen(details.open);
            if (!details.open) {
              setFile({} as File);
              setDisplayName("");
              setDisplayType("");
            }
          }}
          placement={"center"}
          size={"xl"}
          scrollBehavior={"inside"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header p={"2"} fontWeight={"semibold"} roundedTop={"md"} bg={GLOBAL_STYLES.dialog.headerColor}>
                <Flex direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
                  <Flex align={"center"} gap={"1"} border={"2px"} rounded={"md"}>
                    <Icon name={"upload"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Upload Attachment
                    </Text>
                  </Flex>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size={"2xs"} top={"6px"} onClick={() => props.setOpen(false)} />
                  </Dialog.CloseTrigger>
                </Flex>
              </Dialog.Header>
              <Dialog.Body p={"2"} gap={"2"}>
                <Flex gap={"1"} direction={"column"}>
                  <Flex w={"100%"} align={"center"} justify={"center"}>
                    <Fieldset.Root>
                      <Fieldset.Content h={"100%"} w={"100%"}>
                        <Flex
                          direction={"column"}
                          minH={"50vh"}
                          h={"100%"}
                          w={"100%"}
                          align={"center"}
                          justify={"center"}
                          border={GLOBAL_STYLES.border.style}
                          borderStyle={_.isEqual(file, {}) ? "dashed" : "solid"}
                          borderColor={!_.isEqual(file, {}) ? "blue.300" : GLOBAL_STYLES.border.color}
                          bg={!_.isEqual(file, {}) ? "blue.50" : "gray.50"}
                          rounded={"md"}
                          cursor={"pointer"}
                          onClick={handleDropZoneClick}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          {_.isEqual(file, {}) ? (
                            <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                              <Icon name={"upload"} size={"xl"} color={"gray.300"} />
                              <Flex direction={"column"} gap={"1"} justify={"center"} align={"center"}>
                                <Text fontWeight={"semibold"} fontSize={"xs"}>
                                  Click to upload file
                                </Text>
                                <Text fontSize={"xs"} color={"gray.500"}>
                                  or drag and drop
                                </Text>
                                <Flex direction={"row"} gap={"1"} mt={"1"}>
                                  {["PDF", "JPEG", "PNG", "DNA"].map((fmt) => (
                                    <Tag.Root key={fmt} size={"sm"} colorPalette={"gray"} variant={"outline"}>
                                      <Tag.Label fontSize={"xs"}>{fmt}</Tag.Label>
                                    </Tag.Root>
                                  ))}
                                </Flex>
                              </Flex>
                            </Flex>
                          ) : (
                            <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                              <Icon name={"upload"} size={"xl"} color={"blue.300"} />
                              <Flex direction={"column"} justify={"center"} align={"center"}>
                                <Text fontWeight={"semibold"} fontSize={"xs"}>
                                  {displayName}
                                </Text>
                                <Text fontSize={"xs"} color={"gray.500"}>
                                  {displayType}
                                </Text>
                              </Flex>
                            </Flex>
                          )}
                        </Flex>
                        <Input
                          ref={fileInputRef}
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
                            if (event.target.files && event.target.files.length > 0) {
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
                                toaster.create({
                                  title: "Warning",
                                  type: "warning",
                                  description: "Please upload an image (JPEG, PNG), PDF file, or sequence file (DNA)",
                                  duration: 4000,
                                  closable: true,
                                });
                              }
                            }
                          }}
                        />
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
                <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"red"}
                    variant={"solid"}
                    onClick={() => {
                      setFile({} as File);
                      props.setOpen(false);
                    }}
                  >
                    Cancel
                    <Icon name={"cross"} size={"xs"} />
                  </Button>
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    variant={"solid"}
                    disabled={_.isEqual(file, {}) || loading}
                    onClick={() => performUpload()}
                    loading={loading}
                  >
                    Upload
                    <Icon name={"upload"} size={"xs"} />
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      )}
    </>
  );
};

export default UploadDialog;
