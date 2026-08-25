// React
import React from "react";

// Components
import { Button, Field, Fieldset, Flex, Tag, Text, FileUpload } from "@chakra-ui/react";
import Icon from "@components/Icon";
import FileUploadList from "@components/UploadList";

// Existing and custom types
import { UploadStepProps } from "@types";

// Utility functions and libraries
import { getFileExtension } from "@lib/util";
import _ from "lodash";

// Variables
import { ACCEPTED_IMPORTS_ENTITIES, ACCEPTED_IMPORTS_TEMPLATES, STYLES } from "@variables";

const UploadStep = ({ importType, isTypeSelectDisabled, onSelectImportType, fileUpload }: UploadStepProps) => (
  <>
    {/* Select file type of import */}
    <Flex direction={"column"} gap={"2"} py={"2"}>
      <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
        File Contents
      </Text>
      <Flex gap={"2"}>
        {(["entities", "template"] as const).map((type) => (
          <Button
            key={type}
            size={"xs"}
            rounded={"md"}
            flex={"1"}
            variant={importType === type ? "solid" : "outline"}
            colorPalette={importType === type ? "blue" : "gray"}
            onClick={() => onSelectImportType(type)}
            disabled={isTypeSelectDisabled}
            data-testid={`import-type-select-trigger-${type}`}
          >
            <Icon name={type === "entities" ? "entity" : "template"} size={"xs"} />
            {_.capitalize(type)}
          </Button>
        ))}
      </Flex>
    </Flex>

    {/* Upload dropzone */}
    <Flex w={"100%"} direction={"column"} align={"center"} justify={"center"}>
      <Fieldset.Root>
        <Fieldset.Content>
          <Field.Root>
            <FileUpload.RootProvider w={"100%"} alignItems={"stretch"} gap={"2"} value={fileUpload}>
              <FileUpload.HiddenInput />
              <FileUpload.Dropzone>
                <FileUpload.DropzoneContent gap={"0"}>
                  {/* Condition 1: File type not specified */}
                  {_.isUndefined(importType) && (
                    <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                      <Flex direction={"row"} align={"center"} justify={"center"} gap={"2"}>
                        <Icon name={"entity"} size={"lg"} color={STYLES.entity.color.light} />
                        <Icon name={"template"} size={"lg"} color={STYLES.template.color.light} />
                      </Flex>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Select File Contents
                      </Text>
                    </Flex>
                  )}

                  {/* Condition 2: File type specified, no file uploaded */}
                  {fileUpload.acceptedFiles.length === 0 && !_.isUndefined(importType) && (
                    <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                      <Icon
                        name={importType === "entities" ? "entity" : "template"}
                        size={"lg"}
                        color={importType === "entities" ? STYLES.entity.color.light : STYLES.template.color.light}
                      />
                      <Flex direction={"column"} gap={"1"} justify={"center"} align={"center"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Click to upload {_.capitalize(importType)} file
                        </Text>
                        <Text fontSize={"xs"} color={"text.subtle"}>
                          or drag and drop
                        </Text>
                        <Flex direction={"row"} gap={"1"} mt={"1"}>
                          <Flex direction={"row"} gap={"1"} mt={"1"}>
                            {(importType === "entities" ? ACCEPTED_IMPORTS_ENTITIES : ACCEPTED_IMPORTS_TEMPLATES).map(
                              (format) => {
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
                              },
                            )}
                          </Flex>
                        </Flex>
                      </Flex>
                    </Flex>
                  )}

                  {/* Condition 3: File type specified, file uploaded */}
                  {fileUpload.acceptedFiles.length > 0 && !_.isUndefined(importType) && (
                    <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                      <Icon
                        name={importType === "entities" ? "entity" : "template"}
                        size={"xl"}
                        color={importType === "entities" ? STYLES.entity.color.light : STYLES.template.color.light}
                      />
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        {fileUpload.acceptedFiles.length > 0 && fileUpload.acceptedFiles[0].name}
                      </Text>
                    </Flex>
                  )}
                </FileUpload.DropzoneContent>
              </FileUpload.Dropzone>
              <FileUploadList />
            </FileUpload.RootProvider>
          </Field.Root>
        </Fieldset.Content>
      </Fieldset.Root>
    </Flex>
  </>
);

export default UploadStep;
