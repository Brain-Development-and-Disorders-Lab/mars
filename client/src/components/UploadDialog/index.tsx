// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Text,
  Input,
  Tag,
  Fieldset,
  Field,
  Button,
  Dialog,
  IconButton,
} from "@chakra-ui/react";
import Error from "@components/Error";
import { toaster } from "@components/Toast";
import Icon from "@components/Icon";

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
  // File to be uploaded
  const [file, setFile] = useState({} as File);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Display name and type of the file
  const [displayName, setDisplayName] = useState("");
  const [displayType, setDisplayType] = useState("");

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
      toaster.create({
        title: "Upload Error",
        type: "error",
        description: "Error occurred while uploading file",
        duration: 4000,
        closable: true,
      });
      setIsError(true);
    }

    if (response.data.uploadAttachment.success) {
      // Add the upload to the existing list of uploads
      props.setUploads([...props.uploads, file.name]);

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
              <Dialog.CloseTrigger asChild>
                <IconButton
                  bg={"white"}
                  _hover={{ bg: "gray.200" }}
                  variant={"subtle"}
                  color={"black"}
                  onClick={() => props.setOpen(false)}
                >
                  <Icon name={"close"} />
                </IconButton>
              </Dialog.CloseTrigger>
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                <Icon name={"upload"} />
                Upload Attachment
              </Dialog.Header>
              <Dialog.Body p={"2"} gap={"2"}>
                <Flex gap={"2"} direction={"column"}>
                  <Flex gap={"1"} direction={"row"} align={"center"}>
                    <Text fontSize={"sm"}>Supported file formats:</Text>
                    <Tag.Root colorPalette={"green"} size={"sm"}>
                      <Tag.Label>PDF</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"green"} size={"sm"}>
                      <Tag.Label>JPEG</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"green"} size={"sm"}>
                      <Tag.Label>PNG</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"green"} size={"sm"}>
                      <Tag.Label>DNA</Tag.Label>
                    </Tag.Root>
                  </Flex>
                  <Flex w={"100%"} align={"center"} justify={"center"}>
                    <Fieldset.Root>
                      <Fieldset.Content>
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
                                color={"gray.600"}
                              >
                                {displayType}
                              </Text>
                            </Flex>
                          )}
                        </Flex>
                        <Field.Root h={"100%"} w={"100%"}>
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
              <Dialog.Footer p={"2"}>
                <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                  <Button
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"red"}
                    variant={"outline"}
                    onClick={() => {
                      setFile({} as File);
                      props.setOpen(false);
                    }}
                  >
                    Cancel
                    <Icon name={"cross"} />
                  </Button>
                  <Button
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"green"}
                    variant={"solid"}
                    disabled={_.isEqual(file, {}) || loading}
                    onClick={() => performUpload()}
                    loading={loading}
                  >
                    Upload
                    <Icon name={"upload"} />
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
