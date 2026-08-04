// React
import React, { useState } from "react";

// Existing and custom components
import { Button, Dialog, CloseButton, Fieldset, Flex, Text, FileUpload, Tag, useFileUpload } from "@chakra-ui/react";
import Error from "@components/Error";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import FileUploadList from "@components/UploadList";

// Utility functions and libraries
import { getFileExtension } from "@lib/util";
import _ from "lodash";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// Custom types
import { ResponseData } from "@types";

// Variables
import { ACCEPTED_ATTACHMENTS, STYLES } from "@variables";

const UploadDialog = (props: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  target: string;
  uploads: string[];
  setUploads: React.Dispatch<React.SetStateAction<string[]>>;
  onUploadSuccess?: () => void;
}) => {
  const fileUpload = useFileUpload({
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
    accept: ACCEPTED_ATTACHMENTS,
  });

  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

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

  const performUpload = async () => {
    if (_.isUndefined(fileUpload.acceptedFiles)) return;

    try {
      const response = await uploadAttachment({
        variables: {
          target: props.target,
          file: fileUpload.acceptedFiles[0],
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

  return (
    <>
      {isLoaded && isError ? (
        <Error />
      ) : (
        <Dialog.Root
          open={props.open}
          onOpenChange={(details) => {
            props.setOpen(details.open);
          }}
          placement={"center"}
          size={"lg"}
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
                bg={"surface.emphasized"}
                color={"text.default"}
              >
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
                        <FileUpload.RootProvider w={"100%"} alignItems={"stretch"} gap={"2"} value={fileUpload}>
                          <FileUpload.HiddenInput />
                          <FileUpload.Dropzone>
                            <Icon size={"lg"} name={"attachment"} color={"text.faint"} />
                            <FileUpload.DropzoneContent gap={"0"}>
                              <Flex direction={"column"} gap={"1"} justify={"center"} align={"center"}>
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  Click to upload attachment
                                </Text>
                                <Text fontSize={"xs"} color={"text.subtle"}>
                                  or drag and drop
                                </Text>
                                <Flex direction={"row"} gap={"1"} mt={"1"}>
                                  {ACCEPTED_ATTACHMENTS.map((format) => {
                                    return (
                                      <Tag.Root
                                        key={getFileExtension(format)}
                                        size={"sm"}
                                        colorPalette={"gray"}
                                        variant={"outline"}
                                      >
                                        <Tag.Label fontSize={"xs"}>{getFileExtension(format)}</Tag.Label>
                                      </Tag.Root>
                                    );
                                  })}
                                </Flex>
                              </Flex>
                            </FileUpload.DropzoneContent>
                          </FileUpload.Dropzone>
                          <FileUploadList />
                        </FileUpload.RootProvider>
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
                <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"red"}
                    variant={"solid"}
                    onClick={() => {
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
                    disabled={fileUpload.acceptedFiles.length === 0 || loading}
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
