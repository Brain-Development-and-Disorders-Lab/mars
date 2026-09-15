// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Flex, Button, Dialog, Text, Tag, Steps, CloseButton, useFileUpload } from "@chakra-ui/react";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import UploadStep from "@components/DialogImport/steps/UploadStep";
import EntityDetailsStep from "@components/DialogImport/steps/EntityDetailsStep";
import EntityMappingStep from "@components/DialogImport/steps/EntityMappingStep";
import EntityReviewStep from "@components/DialogImport/steps/EntityReviewStep";
import AttributeReviewStep from "@components/DialogImport/steps/AttributeReviewStep";

// Custom and existing types
import { ColumnInfo, DialogImportProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { isValidValues, getValueTypeIconProps, isSpreadsheetFile } from "@lib/util";
import _ from "lodash";

// Events
import { usePostHog } from "posthog-js/react";

// Variables
import {
  JSON_MIME_TYPE,
  MAX_DISPLAYED_COLUMNS,
  ACCEPTED_IMPORTS_ENTITIES,
  ACCEPTED_IMPORTS_ATTRIBUTES,
  STYLES,
} from "@variables";

// Import flow hooks
import { useEntityImport } from "@components/DialogImport/useEntityImport";
import { useAttributeImport } from "@components/DialogImport/useAttributeImport";

const DialogImport = (props: DialogImportProps) => {
  // Posthog
  const posthog = usePostHog();

  // Operation and button states
  const [importLoading, setImportLoading] = useState(false);
  const [continueDisabled, setContinueDisabled] = useState(true);

  const navigate = useNavigate();

  // State to differentiate which type of file is being imported
  const [importType, setImportType] = useState<"entities" | "attribute">();
  const [importTypeSelected, setImportTypeSelected] = useState(false);
  const [isTypeSelectDisabled, setIsTypeSelectDisabled] = useState(false);

  // File states, kept in sync with `fileUpload` below so the rest of the dialog can react to it
  const [fileType, setFileType] = useState("");
  const [fileName, setFileName] = useState("");

  const fileUpload = useFileUpload({
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
    accept: importType === "entities" ? ACCEPTED_IMPORTS_ENTITIES : ACCEPTED_IMPORTS_ATTRIBUTES,
    // No file contents type selected yet, so the dropzone shouldn't accept anything
    disabled: _.isUndefined(importType),
    onFileChange: (details) => {
      const file = details.acceptedFiles[0] as File | undefined;
      setFileName(file?.name ?? "");
      setFileType(file?.type ?? "");
    },
  });

  /** Swaps between the Entity and Attribute upload contexts, discarding any file picked under the old type. */
  const selectImportType = (type: "entities" | "attribute") => {
    if (isTypeSelectDisabled) return;

    fileUpload.clearFiles();
    setImportType(type);
    setImportTypeSelected(true);
  };

  // Used to generated numerical steps and a progress bar
  // Entity steps
  const entitySteps = [
    { title: "Upload File" },
    { title: "Setup Entities" },
    { title: "Apply Attributes" },
    { title: "Review" },
  ];

  // Attribute steps
  const attributeSteps = [{ title: "Upload File" }, { title: "Review" }];

  const entityImport = useEntityImport({ open: props.open, fileUpload, fileType, setContinueDisabled });
  const attributeImport = useAttributeImport({ fileUpload, setContinueDisabled });

  // Effect to manipulate 'Continue' button state for 'upload' page
  useEffect(() => {
    const onUploadPage =
      importType === undefined ||
      (importType === "entities" && entityImport.entityImportPage === "upload") ||
      (importType === "attribute" && attributeImport.attributeImportPage === "upload");

    if (!onUploadPage) return;
    setContinueDisabled(!(fileName !== "" && importTypeSelected));
    setIsTypeSelectDisabled(fileName !== "");
  }, [fileName, importTypeSelected, importType, entityImport.entityImportPage, attributeImport.attributeImportPage]);

  /**
   * Steps back one page in the entity import flow, re-enabling the type selector when returning to upload
   */
  const onBackClick = () => {
    if (_.isEqual(entityImport.entityImportPage, "details")) {
      // Entity: Details -> Upload
      entityImport.setEntityStep(0);
      entityImport.setEntityImportPage("upload");
      setIsTypeSelectDisabled(false);
      setContinueDisabled(false);
    } else if (_.isEqual(entityImport.entityImportPage, "mapping")) {
      // Entity: Mapping -> Details
      entityImport.setEntityStep(1);
      entityImport.setEntityImportPage("details");
    } else if (_.isEqual(entityImport.entityImportPage, "review")) {
      // Entity: Review -> Mapping
      entityImport.setEntityStep(2);
      entityImport.setEntityImportPage("mapping");
    } else if (_.isEqual(attributeImport.attributeImportPage, "review")) {
      // Attribute: Review -> Upload
      attributeImport.setAttributeStep(0);
      attributeImport.setAttributeImportPage("upload");
      setIsTypeSelectDisabled(false);
      setContinueDisabled(false);
    }
  };

  /**
   * Advances the import flow one step, running any required setup or validation before proceeding
   * @return {Promise<void>}
   */
  const onContinueClick = async (): Promise<void> => {
    // Disable changing the type of import unless import canceled
    setIsTypeSelectDisabled(true);

    if (_.isEqual(importType, "entities")) {
      if (_.isEqual(entityImport.entityImportPage, "upload")) {
        // Capture event
        posthog.capture("client.import.continue", {
          importType: "entities",
          fromPage: "upload",
          toPage: "details",
        });

        // Run setup for import and mapping
        setImportLoading(true);
        const setupResult = await entityImport.setupEntityUploadStep();
        setImportLoading(false);

        if (setupResult) {
          // Proceed to the next page if both setup steps completed successfully
          entityImport.setEntityStep(1);
          entityImport.setEntityImportPage("details");
        }
      } else if (_.isEqual(entityImport.entityImportPage, "details")) {
        // Capture event
        posthog.capture("client.import.continue", {
          importType: "entities",
          fromPage: "details",
          toPage: "mapping",
        });

        // Proceed to the next page
        entityImport.setEntityStep(2);
        entityImport.setEntityImportPage("mapping");
      } else if (_.isEqual(entityImport.entityImportPage, "mapping")) {
        // Validate all attributes are complete before proceeding
        const incompleteAttribute = entityImport.attributesField.find(
          (attr) => attr.name === "" || attr.description === "" || !isValidValues(attr.values),
        );
        if (incompleteAttribute) {
          toaster.create({
            title: "Incomplete Attributes",
            type: "warning",
            description: "Please complete all Attributes before continuing",
            duration: 4000,
            closable: true,
          });
          return;
        }

        // Capture event
        posthog.capture("client.import.continue", {
          importType: "entities",
          fromPage: "mapping",
          toPage: "review",
        });

        // Run the review setup function depending on file type
        setImportLoading(true);
        let setupEntityReviewResult = false;
        if (fileType === JSON_MIME_TYPE) {
          setupEntityReviewResult = await entityImport.setupEntityReviewJSON();
        } else if (isSpreadsheetFile(fileType)) {
          setupEntityReviewResult = await entityImport.setupEntityReviewSpreadsheet();
        }
        setImportLoading(false);

        if (setupEntityReviewResult) {
          // Proceed to the next page
          entityImport.setEntityStep(3);
          entityImport.setEntityImportPage("review");
        }
      } else if (_.isEqual(entityImport.entityImportPage, "review")) {
        // Data validation warnings must be corrected in the file before the import can proceed
        const hasWarnings =
          isSpreadsheetFile(fileType) && entityImport.reviewEntities.some((e) => e.warnings && e.warnings.length > 0);
        if (hasWarnings) {
          toaster.create({
            title: "Cannot Import",
            type: "error",
            description: "Some rows contain data validation warnings. Go back and correct the file, then try again.",
            duration: 4000,
            closable: true,
          });
          return;
        }

        // Capture event
        posthog.capture("client.import.finish", {
          importType: "entities",
        });

        // Run the final import function depending on file type
        setImportLoading(true);
        let finishResult = false;
        if (fileType === JSON_MIME_TYPE) {
          finishResult = await entityImport.finishEntityImportJSON();
        } else if (isSpreadsheetFile(fileType)) {
          finishResult = await entityImport.finishEntityImportSpreadsheet();
        }
        setImportLoading(false);

        if (finishResult) {
          props.setOpen(false);
          resetState();
          navigate(0);
        }
      }
    } else if (_.isEqual(importType, "attribute")) {
      if (_.isEqual(attributeImport.attributeImportPage, "upload")) {
        // Capture event
        posthog.capture("client.import.continue", {
          importType: "attribute",
          fromPage: "upload",
          toPage: "review",
        });

        // Run the review setup function for Attribute JSON files
        setImportLoading(true);
        const importResult = await attributeImport.setupAttributeReviewJSON();
        setImportLoading(false);

        if (importResult) {
          // Proceed to the next page if the setup step completed successfully
          attributeImport.setAttributeStep(1);
          attributeImport.setAttributeImportPage("review");
        }
      } else if (_.isEqual(attributeImport.attributeImportPage, "review")) {
        // Capture event
        posthog.capture("client.import.finish", {
          importType: "attribute",
        });

        // Run the final import function for Attribute JSON files
        setImportLoading(true);
        const finishResult = await attributeImport.finishAttributeImportJSON();
        setImportLoading(false);

        if (finishResult) {
          props.setOpen(false);
          resetState();
          navigate(0);
        }
      }
    }
  };

  /**
   * Reset the UI state
   */
  const resetState = () => {
    // Reset UI state
    setImportType(undefined);
    setImportTypeSelected(false);

    setContinueDisabled(true);
    setImportLoading(false);
    setIsTypeSelectDisabled(false);

    fileUpload.clearFiles();
    setFileType("");
    setFileName("");

    // Reset per-flow state
    entityImport.reset();
    attributeImport.reset();
  };

  /**
   * Perform state cleanup when the UI is closed
   */
  const handleOnClose = () => {
    props.setOpen(false);
    resetState();
  };

  return (
    <Dialog.Root
      open={props.open}
      placement={"center"}
      size={"lg"}
      scrollBehavior={"inside"}
      onEscapeKeyDown={handleOnClose}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header p={"2"} flexShrink={0} bg={"surface.emphasized"} color={"text.default"} roundedTop={"md"}>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"upload"} size={"xs"} />
              <Text fontWeight={"semibold"} fontSize={"xs"}>
                Import File
              </Text>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={handleOnClose} />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body p={"2"} gap={"2"}>
            {/* Stepper progress indicators */}
            {_.isEqual(importType, "entities") && (
              <Steps.Root
                step={entityImport.entityStep}
                colorPalette={"entity"}
                onStepChange={(event) => entityImport.setEntityStep(event.step)}
                count={entitySteps.length}
                p={"1"}
                size={"sm"}
              >
                <Steps.List>
                  {entitySteps.map((step, index) => (
                    <Steps.Item key={index} index={index} title={step.title} gap={"1.5"}>
                      <Steps.Indicator />
                      <Steps.Title fontSize={"xs"} fontWeight={"semibold"}>
                        {step.title}
                      </Steps.Title>
                      <Steps.Separator />
                    </Steps.Item>
                  ))}
                </Steps.List>
              </Steps.Root>
            )}

            {(_.isEqual(importType, "attribute") || _.isUndefined(importType)) && (
              <Steps.Root
                step={attributeImport.attributeStep}
                colorPalette={_.isUndefined(importType) ? "gray" : "attribute"}
                onStepChange={(event) => attributeImport.setAttributeStep(event.step)}
                count={attributeSteps.length}
                p={"1"}
                size={"sm"}
              >
                <Steps.List>
                  {attributeSteps.map((step, index) => (
                    <Steps.Item key={index} index={index} title={step.title}>
                      <Steps.Indicator />
                      <Steps.Title fontSize={"xs"} fontWeight={"semibold"}>
                        {step.title}
                      </Steps.Title>
                      <Steps.Separator />
                    </Steps.Item>
                  ))}
                </Steps.List>
              </Steps.Root>
            )}

            {/* Select import type, and upload a file */}
            {entityImport.entityStep === 0 && attributeImport.attributeStep === 0 && (
              <UploadStep
                importType={importType}
                isTypeSelectDisabled={isTypeSelectDisabled}
                onSelectImportType={selectImportType}
                fileUpload={fileUpload}
              />
            )}

            {/* Display filename and list of columns if a spreadsheet file uploaded */}
            {_.isEqual(importType, "entities") && !_.isEqual(entityImport.entityImportPage, "upload") && (
              <Flex
                w={"100%"}
                justify={"left"}
                gap={"2"}
                align={"baseline"}
                direction={"column"}
                rounded={"md"}
                bg={"blue.50"}
                border={"1px solid"}
                borderColor={"blue.200"}
                p={"2"}
                my={"2"}
              >
                <Flex direction={"row"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    File:
                  </Text>
                  <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
                    {fileName}
                  </Text>
                </Flex>

                {isSpreadsheetFile(fileType) && (
                  <Flex w={"100%"} gap={"1"} align={"center"} justify={"left"} wrap={"wrap"}>
                    <Text fontWeight={"semibold"} fontSize={"xs"}>
                      Columns:
                    </Text>
                    <FieldTagList
                      items={entityImport.columns}
                      max={MAX_DISPLAYED_COLUMNS}
                      getKey={(column) => column.name}
                      renderTag={(column: ColumnInfo) => {
                        const iconProps = getValueTypeIconProps(column.inferredType);
                        const assigned = entityImport.columnIsAssigned(column.name);
                        return (
                          <Tag.Root bg={assigned ? "green.100" : "white"} colorPalette={assigned ? "green" : "gray"}>
                            <Tag.StartElement>
                              <Icon
                                name={iconProps.name}
                                size={"xs"}
                                color={assigned ? "green.600" : iconProps.color}
                              />
                            </Tag.StartElement>
                            <Tag.Label fontSize={"xs"}>{column.name}</Tag.Label>
                          </Tag.Root>
                        );
                      }}
                    />
                  </Flex>
                )}
              </Flex>
            )}

            {/* Entity Steps */}
            {/* Entity Step 1: Simple mapping, details */}
            {_.isEqual(importType, "entities") && _.isEqual(entityImport.entityImportPage, "details") && (
              <EntityDetailsStep
                fileType={fileType}
                columns={entityImport.columns}
                namePrefixField={entityImport.namePrefixField}
                onNamePrefixFieldChange={entityImport.setNamePrefixField}
                nameField={entityImport.nameField}
                onNameFieldChange={entityImport.setNameField}
                nameUseCounter={entityImport.nameUseCounter}
                onNameUseCounterChange={entityImport.setNameUseCounter}
                counter={entityImport.counter}
                onCounterChange={entityImport.setCounter}
                onContinueDisabledChange={setContinueDisabled}
                suggestions={entityImport.suggestions}
                isSuggesting={entityImport.isSuggesting}
                descriptionField={entityImport.descriptionField}
                onDescriptionFieldChange={entityImport.setDescriptionField}
                identifierField={entityImport.identifierField}
                onIdentifierFieldChange={entityImport.setIdentifierField}
                identifierFormat={entityImport.identifierFormat}
                onIdentifierFormatChange={entityImport.setIdentifierFormat}
                projectField={entityImport.projectField}
                onProjectFieldChange={entityImport.setProjectField}
                projectsCollection={entityImport.projectsCollection}
                ownerField={entityImport.ownerField}
                getSelectComponent={entityImport.getSelectComponent}
              />
            )}

            {/* Entity Step 2: Advanced mapping */}
            {_.isEqual(importType, "entities") && _.isEqual(entityImport.entityImportPage, "mapping") && (
              <EntityMappingStep
                attributesField={entityImport.attributesField}
                onAttributesFieldChange={entityImport.setAttributesField}
                addAttributeOpen={entityImport.addAttributeOpen}
                onAddAttributeOpenChange={entityImport.setAddAttributeOpen}
                ownerField={entityImport.ownerField}
                attributes={entityImport.attributes}
                fileType={fileType}
                columns={entityImport.columns}
              />
            )}

            {/* Entity Step 3: Review */}
            {_.isEqual(importType, "entities") && _.isEqual(entityImport.entityImportPage, "review") && (
              <EntityReviewStep reviewEntities={entityImport.reviewEntities} />
            )}

            {/* Attribute Steps */}
            {/* Attribute Step 1: Review */}
            {_.isEqual(importType, "attribute") && _.isEqual(attributeImport.attributeImportPage, "review") && (
              <AttributeReviewStep reviewAttributes={attributeImport.reviewAttributes} />
            )}
          </Dialog.Body>

          <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
              <Flex align={"center"} justify={"center"} gap={"2"}>
                <Button
                  id={"importCancelButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"red"}
                  variant={"solid"}
                  onClick={() => {
                    // Capture event
                    posthog.capture("client.import.cancelled", {
                      importType: importType,
                    });

                    // Close the `DialogImport`
                    handleOnClose();
                  }}
                >
                  Cancel
                  <Icon name="cross" size={"xs"} />
                </Button>
                {/* "Back" button, shown for either import type once past the upload page */}
                {((_.isEqual(importType, "entities") && !_.isEqual(entityImport.entityImportPage, "upload")) ||
                  (_.isEqual(importType, "attribute") &&
                    !_.isEqual(attributeImport.attributeImportPage, "upload"))) && (
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"orange"}
                    variant={"solid"}
                    onClick={onBackClick}
                    disabled={importLoading}
                  >
                    <Icon name={"c_left"} size={"xs"} />
                    Back
                  </Button>
                )}
              </Flex>

              <Flex align={"center"} justify={"center"} gap={"1"}>
                <Button
                  id={"importContinueButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={
                    _.isEqual(attributeImport.attributeImportPage, "review") ||
                    _.isEqual(entityImport.entityImportPage, "review")
                      ? "green"
                      : "blue"
                  }
                  variant={"solid"}
                  onClick={onContinueClick}
                  disabled={continueDisabled || importLoading}
                  loading={importLoading}
                  loadingText={"Processing"}
                >
                  {/* Default button text */}
                  {entityImport.entityStep === 0 && attributeImport.attributeStep === 0 && "Continue"}

                  {/* Entities import type */}
                  {_.isEqual(importType, "entities") &&
                    _.isEqual(entityImport.entityImportPage, "details") &&
                    "Continue"}
                  {_.isEqual(importType, "entities") &&
                    _.isEqual(entityImport.entityImportPage, "mapping") &&
                    "Continue"}
                  {_.isEqual(importType, "entities") && _.isEqual(entityImport.entityImportPage, "review") && "Finish"}

                  {/* Attribute import type */}
                  {_.isEqual(importType, "attribute") &&
                    _.isEqual(attributeImport.attributeImportPage, "review") &&
                    "Finish"}

                  {/* Icon */}
                  {_.isEqual(entityImport.entityImportPage, "review") ||
                  _.isEqual(attributeImport.attributeImportPage, "review") ? (
                    <Icon name={"check"} size={"xs"} />
                  ) : (
                    <Icon name={"c_right"} size={"xs"} />
                  )}
                </Button>
              </Flex>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default DialogImport;
