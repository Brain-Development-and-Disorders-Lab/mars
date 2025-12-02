// React
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Dialog,
  CloseButton,
  Field,
  Fieldset,
  Flex,
  Input,
  Tag,
  Text,
} from "@chakra-ui/react";
import Error from "@components/Error";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Utility functions and libraries
import _ from "lodash";
import { gql, useMutation } from "@apollo/client";

const UploadDialog = (props: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  target: string;
  uploads: string[];
  setUploads: React.Dispatch<React.SetStateAction<string[]>>;
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
  const [uploadAttachment, { loading, error }] = useMutation(UPLOAD_ATTACHMENT);

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

      if (error) {
        toaster.create({
          title: "Upload Error",
          type: "error",
          description: "Error occurred while uploading file",
          duration: 4000,
          closable: true,
        });
        setIsError(true);
        return;
      }

      if (response.data.uploadAttachment.success) {
        // Add the upload to the existing list of uploads
        props.setUploads([
          ...props.uploads,
          response.data.uploadAttachment.data,
        ]);

        // Reset file upload state
        setFile({} as File);
        props.setOpen(false);

        // Update state
        setIsError(false);
        setIsLoaded(true);

        toaster.create({
          title: "Uploaded",
          type: "success",
          description: `Uploaded file successfully`,
          duration: 4000,
          closable: true,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
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
        _.includes(
          ["image/jpeg", "image/png", "application/pdf"],
          droppedFile.type,
        ) ||
        _.endsWith(droppedFile.name, ".dna")
      ) {
        setFile(droppedFile);
      } else {
        toaster.create({
          title: "Warning",
          type: "warning",
          description:
            "Please upload an image (JPEG, PNG), PDF file, or sequence file (DNA)",
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
              <Dialog.Header
                p={"2"}
                fontWeight={"semibold"}
                roundedTop={"md"}
                bg={"blue.300"}
              >
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                  wrap={"wrap"}
                >
                  <Flex
                    align={"center"}
                    gap={"1"}
                    border={"2px"}
                    rounded={"md"}
                  >
                    <Icon name={"upload"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Upload Attachment
                    </Text>
                  </Flex>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton
                      size={"2xs"}
                      top={"6px"}
                      onClick={() => props.setOpen(false)}
                    />
                  </Dialog.CloseTrigger>
                </Flex>
              </Dialog.Header>
              <Dialog.Body p={"1"} gap={"1"}>
                <Flex gap={"1"} direction={"column"}>
                  <Flex gap={"1"} direction={"row"} align={"center"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Supported file formats:
                    </Text>
                    <Tag.Root colorPalette={"green"} size={"sm"}>
                      <Tag.Label fontSize={"xs"}>PDF</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"green"} size={"sm"}>
                      <Tag.Label fontSize={"xs"}>JPEG</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"green"} size={"sm"}>
                      <Tag.Label fontSize={"xs"}>PNG</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"green"} size={"sm"}>
                      <Tag.Label fontSize={"xs"}>DNA</Tag.Label>
                    </Tag.Root>
                  </Flex>
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
                          border={"2px"}
                          borderStyle={"dashed"}
                          borderColor={"gray.300"}
                          bg={"gray.50"}
                          rounded={"md"}
                          cursor={"pointer"}
                          onClick={handleDropZoneClick}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
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
                                color={"gray.600"}
                              >
                                {displayType}
                              </Text>
                            </Flex>
                          )}
                        </Flex>
                        <Field.Root h={"100%"} w={"100%"}>
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
                            onChange={(
                              event: ChangeEvent<HTMLInputElement>,
                            ) => {
                              if (
                                event.target.files &&
                                event.target.files.length > 0
                              ) {
                                // Only accept image or PDF files
                                if (
                                  _.includes(
                                    [
                                      "image/jpeg",
                                      "image/png",
                                      "application/pdf",
                                    ],
                                    event.target.files[0].type,
                                  ) ||
                                  _.endsWith(event.target.files[0].name, ".dna")
                                ) {
                                  setFile(event.target.files[0]);
                                } else {
                                  toaster.create({
                                    title: "Warning",
                                    type: "warning",
                                    description:
                                      "Please upload an image (JPEG, PNG), PDF file, or sequence file (DNA)",
                                    duration: 4000,
                                    closable: true,
                                  });
                                }
                              }
                            }}
                          />
                        </Field.Root>
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>
                </Flex>
              </Dialog.Body>
              <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
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
