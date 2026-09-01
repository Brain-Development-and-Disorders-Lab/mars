// React
import React from "react";

// Components
import { Button, Field, Fieldset, Flex, Tag, Text, FileUpload } from "@chakra-ui/react";
import Icon from "@components/Icon";
import FileUploadList from "@components/UploadList";

// Existing and custom types
import { SampleFile, UploadStepProps } from "@types";

// Utility functions and libraries
import { downloadSampleFile, getFileExtension } from "@lib/util";
import _ from "lodash";

// Variables
import { ACCEPTED_IMPORTS_ENTITIES, ACCEPTED_IMPORTS_TEMPLATES, STYLES } from "@variables";

// Minimal valid example files
const SAMPLE_FILES: Record<"entities" | "template", SampleFile[]> = {
  entities: [
    {
      label: "CSV",
      filename: "sample-entities.csv",
      mimeType: "text/csv",
      content: [
        "Name,Description,Notes",
        "Sample Entity 1,An example row for reference,Optional notes column",
        "Sample Entity 2,Another example row for reference,",
      ].join("\n"),
    },
    {
      label: "JSON",
      filename: "sample-entities.json",
      mimeType: "application/json",
      content: JSON.stringify(
        {
          entities: [
            {
              _id: "sample-entity-001",
              name: "Sample Entity",
              owner: "",
              created: "2024-01-01T00:00:00.000Z",
              archived: false,
              description: "An example Entity created from a JSON import",
              projects: [],
              relationships: [],
              attributes: [],
              attachments: [],
            },
          ],
        },
        null,
        2,
      ),
    },
  ],
  template: [
    {
      label: "JSON",
      filename: "sample-template.json",
      mimeType: "application/json",
      content: JSON.stringify(
        {
          name: "Sample Template",
          description: "An example Template created from a JSON import",
          archived: false,
          values: [{ _id: "value-001", name: "Example Value", type: "text", data: "" }],
        },
        null,
        2,
      ),
    },
  ],
};

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

      {/* Sample file downloads, shown once a file type is chosen and before a file is uploaded */}
      {!_.isUndefined(importType) && fileUpload.acceptedFiles.length === 0 && (
        <Flex direction={"row"} gap={"1"} align={"center"} wrap={"wrap"} justify={"center"}>
          <Text fontSize={"xs"} color={"text.subtle"}>
            Download a sample {_.capitalize(importType)} file:
          </Text>
          <Flex direction={"row"} gap={"2"} align={"center"}>
            {SAMPLE_FILES[importType].map((sample) => (
              <Button
                key={sample.label}
                size={"2xs"}
                p={"0"}
                variant={"plain"}
                color={"text.subtle"}
                _hover={{ textDecoration: "underline" }}
                onClick={() => downloadSampleFile(sample)}
              >
                <Icon name={"download"} size={"xs"} />
                {sample.label}
              </Button>
            ))}
          </Flex>
        </Flex>
      )}
    </Flex>
  </>
);

export default UploadStep;
