// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Flex, Dialog, Text, CloseButton, Spinner } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Existing and custom types
import { AttributeModel, CompareAttributeDialogProps, IValue } from "@types";

// GraphQL imports
import { useLazyQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { GLOBAL_STYLES } from "@variables";

const CompareAttributeDialog = (props: CompareAttributeDialogProps) => {
  // State storing Attribute information
  const [templateAttribute, setTemplateAttribute] = useState<AttributeModel>();
  const [loadingComparison, setLoadingComparison] = useState(false);

  // GraphQL operations
  const GET_TEMPLATE = gql`
    query GetTemplate($_id: String) {
      template(_id: $_id) {
        _id
        name
        timestamp
        owner
        archived
        description
        values {
          _id
          name
          type
          data
        }
        history {
          author
          message
          timestamp
          version
          _id
          name
          owner
          archived
          description
          values {
            _id
            name
            type
            data
          }
        }
      }
    }
  `;
  const [getTemplate] = useLazyQuery<{
    template: AttributeModel;
  }>(GET_TEMPLATE);

  const prepareComparison = async () => {
    setLoadingComparison(true);
    const templateAttributeResult = await getTemplate({
      variables: {
        _id: props.templateAttributeId,
      },
    });

    if (templateAttributeResult.data) {
      setTemplateAttribute(templateAttributeResult.data.template);
    }
    setLoadingComparison(false);
  };

  useEffect(() => {
    prepareComparison();
  }, [props.open]);

  /**
   * Generate a side-by-side "diff"-like comparison between an Attribute and the Template
   * Attribute it was created from
   * @param attributeLeft Existing Attribute that is based on the Template Attribute
   * @param attributeRight Template Attribute
   * @return
   */
  const createSideBySide = (attributeLeft: AttributeModel, attributeRight: AttributeModel | undefined) => {
    const leftValues = new Set(attributeLeft.values.map((value) => value._id));
    const rightValues = new Set(attributeRight?.values.map((value) => value._id));

    // Get collection of Values that are conserved
    const conservedValueIds = leftValues.intersection(rightValues);
    const conservedValues = attributeLeft.values.filter((value) => [...conservedValueIds].includes(value._id));

    // Get collection of Values that are removed
    const removedValueIds = rightValues.difference(leftValues);
    const removedValues = attributeRight?.values.filter((value) => [...removedValueIds].includes(value._id)) || [];

    // Get collection of Values that are added
    const addedValueIds = leftValues.difference(rightValues);
    const addedValues = attributeLeft.values.filter((value) => [...addedValueIds].includes(value._id));

    return (
      <Flex direction={"row"} gap={"2"} align={"center"}>
        {/* Left Column */}
        <Flex
          direction={"column"}
          w={"50%"}
          rounded={"md"}
          p={"1"}
          gap={"1"}
          border={GLOBAL_STYLES.border.style}
          borderColor={GLOBAL_STYLES.border.color}
        >
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.600"}>
              Attribute:
            </Text>
            <Text fontWeight={"semibold"} fontSize={"xs"}>
              {attributeLeft.name}
            </Text>
          </Flex>

          <Flex direction={"column"} gap={"1"} align={"start"}>
            <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.600"}>
              Values:
            </Text>
            <Flex direction={"column"} gap={"1"} ml={"0.5"}>
              {[...conservedValues].map((value) => {
                return (
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Icon size={"xs"} name={"check"} color={"blue.500"} />
                    <Text fontSize={"xs"} color={"blue.600"} fontWeight={"semibold"}>
                      {value.name}
                    </Text>
                  </Flex>
                );
              })}

              {[...removedValues].map((value) => {
                return (
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Icon size={"xs"} name={"remove"} color={"red.500"} />
                    <Text fontSize={"xs"} color={"red.600"} fontWeight={"semibold"}>
                      {value.name}
                    </Text>
                  </Flex>
                );
              })}

              {[...addedValues].map((value) => {
                return (
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Icon size={"xs"} name={"add"} color={"green.600"} />
                    <Text fontSize={"xs"} color={"green.600"} fontWeight={"semibold"}>
                      {value.name}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
        </Flex>

        {/* Right Column - Fallback */}
        {_.isUndefined(attributeRight) && (
          <Flex
            w={"50%"}
            rounded={"md"}
            p={"1"}
            bg={"red.100"}
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
          >
            <Text fontWeight={"semibold"} fontSize={"xs"} color={"red.600"}>
              Unable to load Template
            </Text>
          </Flex>
        )}

        {/* Right Column - Default */}
        {attributeRight && (
          <Flex
            direction={"column"}
            w={"50%"}
            h={"100%"}
            rounded={"md"}
            p={"1"}
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
          >
            <Text fontWeight={"semibold"} fontSize={"xs"}>
              Template: {attributeRight.name}
            </Text>
            <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.600"}>
              Values:
            </Text>
            <Flex direction={"column"} gap={"1"} ml={"0.5"} h={"100%"}>
              {[...attributeRight.values].map((value) => {
                return (
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Icon size={"xs"} name={"check"} color={"blue.500"} />
                    <Text fontSize={"xs"} color={"blue.600"} fontWeight={"semibold"}>
                      {value.name}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
        )}
      </Flex>
    );
  };

  return (
    <Dialog.Root
      open={props.open}
      scrollBehavior={"inside"}
      placement={"center"}
      onOpenChange={(event) => props.setOpen(event.open)}
      size={"xl"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxH={"90vh"} display={"flex"} flexDirection={"column"} p={"0"}>
          <Dialog.Header
            p={"1"}
            flexShrink={0}
            bg={GLOBAL_STYLES.dialog.header.bg}
            borderBottom={"2px"}
            roundedTop={"md"}
          >
            <Flex direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
              <Flex align={"center"} gap={"1"} p={"1"} border={"2px"} rounded={"md"}>
                <Icon name={"template"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Compare Attributes: {props.modifiedAttribute.name} | {templateAttribute?.name}
                </Text>
              </Flex>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={() => props.setOpen(false)} />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body p={"2"} flex={"1"} overflow={"auto"}>
            {loadingComparison ? (
              <Flex w={"100%"} align={"center"} justify={"center"} minH={"240px"}>
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Spinner color={"gray.600"} />
                  <Text fontWeight={"semibold"} color={"gray.600"} fontSize={"xs"}>
                    Preparing Comparison
                  </Text>
                </Flex>
              </Flex>
            ) : (
              createSideBySide(props.modifiedAttribute, templateAttribute)
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default CompareAttributeDialog;
