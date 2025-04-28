// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import { Flex, Text, Input, Tag, Fieldset, Field } from "@chakra-ui/react";
import Error from "@components/Error";
import GenericButton from "@components/GenericButton";
import GenericDialog from "@components/GenericDialog";
import { toaster } from "@components/Toast";

// Utility functions and libraries
import _ from "lodash";
import { gql, useMutation } from "@apollo/client";

const UploadDialog = (props: {
  open: boolean;
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
      props.onClose();

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
        <GenericDialog open={props.open}>
          <GenericDialog.Header header={"Upload Attachment"} />
          <GenericDialog.Body>
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
                    <Field.Root>
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
          </GenericDialog.Body>
          <GenericDialog.Footer>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
              <GenericButton.Cancel
                label={"Cancel"}
                icon={"cross"}
                onClick={() => {
                  setFile({} as File);
                  props.onClose();
                }}
              />
              <GenericButton.Action
                label={"Upload"}
                icon={"upload"}
                disabled={_.isEqual(file, {}) || loading}
                onClick={() => performUpload()}
                loading={loading}
              />
            </Flex>
          </GenericDialog.Footer>
        </GenericDialog>
      )}
    </>
  );
};

export default UploadDialog;
