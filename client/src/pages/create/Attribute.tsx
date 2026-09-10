// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Heading,
  Input,
  Spacer,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import TagActor from "@components/TagActor";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { DialogUnsavedChanges } from "@components/DialogUnsavedChanges";
import Values from "@components/Values";

// Existing and custom types
import { IAttribute, IValue, ResponseData } from "@types";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";

// Apollo and GraphQL
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// Utility functions and libraries
import { isValidValues } from "@lib/util";
import dayjs from "dayjs";

// Authentication context
import { auth } from "@lib/auth";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

// Posthog
import { usePostHog } from "posthog-js/react";

// Variables
import { STYLES } from "@variables";

const Attribute = () => {
  const posthog = usePostHog();

  // Permissions
  const { workspacePermissions, loading: permissionsLoading } = usePermissions();

  const [informationOpen, setInformationOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [created, setCreated] = useState(dayjs(Date.now()).format("YYYY-MM-DDTHH:mm"));
  const [values, setValues] = useState<IValue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication and user
  const { data: session, error: sessionErrorState } = auth.useSession();
  const owner = session?.user.id ?? "";

  useEffect(() => {
    // If the User does not have Workspace permissions, direct to `/unauthorized`
    if (
      !permissionsLoading &&
      !workspacePermissions.attributes.create &&
      window.location.pathname !== "/unauthorized"
    ) {
      window.location.href = "/unauthorized";
    }
  }, []);

  useEffect(() => {
    if (sessionErrorState) {
      toaster.create({
        title: "Error",
        description: "Session expired, please login again",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  }, [sessionErrorState]);

  const isNameError = name === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isDescriptionError;
  const [isValueError, setIsValueError] = useState(false);
  useEffect(() => {
    setIsValueError(!isValidValues(values, true));
  }, [values]);

  useEffect(() => {
    posthog?.capture("client.create.attribute_start");
  }, [posthog]);

  const attributeData: IAttribute = { name, owner, archived: false, description, values };

  const CREATE_ATTRIBUTE = gql`
    mutation CreateAttribute($attribute: AttributeCreateInput) {
      createAttribute(attribute: $attribute) {
        success
        message
      }
    }
  `;
  const [createAttribute, { loading, error }] = useMutation<{
    createAttribute: ResponseData<string>;
  }>(CREATE_ATTRIBUTE);

  const navigate = useNavigate();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (isSubmitting) return false;
    return (
      (name !== "" || description !== "" || values.length > 0) && currentLocation.pathname !== nextLocation.pathname
    );
  });
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  const onSubmit = async () => {
    posthog?.capture("client.create.attribute_finish");
    setIsSubmitting(true);
    const response = await createAttribute({ variables: { attribute: attributeData } });

    if (!response.data?.createAttribute?.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred when creating Attribute",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else {
      toaster.create({ title: "Attribute created successfully", type: "success", duration: 2000, closable: true });
      setIsSubmitting(false);
      navigate("/attributes");
    }
  };

  useEffect(() => {
    if (error) {
      toaster.create({ title: "Error", description: error.message, type: "error", duration: 2000, closable: true });
    }
  }, [error]);

  return (
    <Content isLoaded={!loading}>
      <Flex direction={"column"}>
        {/* Page header */}
        <Flex direction={"row"} p={"1"} align={"center"} gap={"1"} ml={"0.5"}>
          <Icon name={"attribute"} size={"sm"} color={STYLES.attribute.color.icon} />
          <Heading size={"md"}>Create Attribute</Heading>
          <Spacer />
          <Button size={"xs"} rounded={"md"} variant={"outline"} onClick={() => setInformationOpen(true)}>
            Info
            <Icon name={"info"} size={"xs"} />
          </Button>
        </Flex>

        <Flex direction={"row"} gap={"2"} p={"1"} wrap={"wrap"}>
          {/* Name */}
          <Flex
            direction={"column"}
            flex={{ base: "0 0 100%", md: "1" }}
            p={"2"}
            gap={"2"}
            bg={STYLES.card.bg}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            rounded={"md"}
          >
            <Field.Root required gap={"1"}>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Name
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                size={"xs"}
                placeholder={"Name"}
                rounded={"md"}
                bg={"white"}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {isNameError && (
                <Field.ErrorText fontSize={"xs"}>A name must be specified for the Attribute.</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root gap={"1"}>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Owner
              </Field.Label>
              <Flex>
                <TagActor identifier={owner} fallback={"Unknown User"} size={"sm"} />
              </Flex>
            </Field.Root>

            <Field.Root gap={"1"}>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Created
              </Field.Label>
              <Input
                size={"xs"}
                rounded={"md"}
                type={"datetime-local"}
                bg={"white"}
                value={created}
                onChange={(event) => setCreated(dayjs(event.target.value).format("YYYY-MM-DDTHH:mm"))}
              />
            </Field.Root>
          </Flex>

          {/* Description */}
          <Flex
            direction={"column"}
            flex={{ base: "0 0 100%", md: "1" }}
            p={"2"}
            gap={"2"}
            rounded={"md"}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            bg={STYLES.surface.card}
          >
            <Field.Root required gap={"1"} h={"100%"}>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Description
                <Field.RequiredIndicator />
              </Field.Label>
              <Textarea
                data-testid={"create-attribute-description"}
                value={description}
                size={"xs"}
                h={"100%"}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field.Root>
          </Flex>
        </Flex>

        {/* Values */}
        <Flex direction={"column"} p={"1"} gap={"1"}>
          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            bg={STYLES.surface.card}
            rounded={"md"}
          >
            <Field.Root required>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                Values
                <Field.RequiredIndicator />
              </Field.Label>
              <Values viewOnly={false} values={values} setValues={setValues} />
            </Field.Root>
          </Flex>
        </Flex>
      </Flex>

      {/* Information dialog */}
      <Dialog.Root
        open={informationOpen}
        onOpenChange={(event) => setInformationOpen(event.open)}
        size={"lg"}
        placement={"center"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Trigger />
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size={"2xs"}
                top={"6px"}
                onClick={() => setInformationOpen(false)}
                colorPalette={"attribute"}
              />
            </Dialog.CloseTrigger>
            <Dialog.Header
              p={"2"}
              fontWeight={"semibold"}
              fontSize={"xs"}
              bg={"attribute.light"}
              color={"attribute.dark"}
              roundedTop={"md"}
            >
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Icon name={"attribute"} size={"xs"} color={STYLES.attribute.color.icon} />
                Attributes
              </Flex>
            </Dialog.Header>
            <Dialog.Body p={"2"}>
              <Flex gap={"2"} direction={"column"}>
                <Flex
                  direction={"column"}
                  gap={"1"}
                  bg={STYLES.card.bg}
                  p={"2"}
                  rounded={"md"}
                  border={STYLES.border.style}
                  borderColor={STYLES.border.color}
                >
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Icon name={"info"} size={"xs"} color={"text.subtle"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                      What is an Attribute?
                    </Text>
                  </Flex>
                  <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} lineHeight={"tall"}>
                    Attributes define a set of metadata fields that can be applied to Entities during creation. Use them
                    with pre-populated Values to keep metadata consistent across similar Entities.
                  </Text>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                    Supported Value Types
                  </Text>
                  <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      align={"center"}
                      p={"2"}
                      rounded={"md"}
                      bg={"status.warning.subtle"}
                      border={"1px solid"}
                      borderColor={"orange.100"}
                      flex={"1"}
                      minW={"200px"}
                    >
                      <Icon name={"v_date"} color={"orange.400"} size={"sm"} />
                      <Flex direction={"column"} gap={"0"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Date
                        </Text>
                        <Text fontSize={"xs"} color={"text.subtle"}>
                          A point in time.
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      align={"center"}
                      p={"2"}
                      rounded={"md"}
                      bg={"blue.50"}
                      border={"1px solid"}
                      borderColor={"blue.100"}
                      flex={"1"}
                      minW={"200px"}
                    >
                      <Icon name={"v_text"} color={"blue.400"} size={"sm"} />
                      <Flex direction={"column"} gap={"0"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Text
                        </Text>
                        <Text fontSize={"xs"} color={"text.subtle"}>
                          Free-form text content.
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      align={"center"}
                      p={"2"}
                      rounded={"md"}
                      bg={"green.50"}
                      border={"1px solid"}
                      borderColor={"green.100"}
                      flex={"1"}
                      minW={"200px"}
                    >
                      <Icon name={"v_number"} color={"green.400"} size={"sm"} />
                      <Flex direction={"column"} gap={"0"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Number
                        </Text>
                        <Text fontSize={"xs"} color={"text.subtle"}>
                          A numerical measurement.
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      align={"center"}
                      p={"2"}
                      rounded={"md"}
                      bg={"yellow.50"}
                      border={"1px solid"}
                      borderColor={"yellow.100"}
                      flex={"1"}
                      minW={"200px"}
                    >
                      <Icon name={"v_url"} color={"yellow.500"} size={"sm"} />
                      <Flex direction={"column"} gap={"0"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          URL
                        </Text>
                        <Text fontSize={"xs"} color={"text.subtle"}>
                          A link to a web resource.
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      align={"center"}
                      p={"2"}
                      rounded={"md"}
                      bg={"purple.50"}
                      border={"1px solid"}
                      borderColor={"purple.100"}
                      flex={"1"}
                      minW={"200px"}
                    >
                      <Icon name={"entity"} color={"entity.default"} size={"sm"} />
                      <Flex direction={"column"} gap={"0"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Entity
                        </Text>
                        <Text fontSize={"xs"} color={"text.subtle"}>
                          A reference to another Entity.
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      align={"center"}
                      p={"2"}
                      rounded={"md"}
                      bg={"teal.50"}
                      border={"1px solid"}
                      borderColor={"teal.100"}
                      flex={"1"}
                      minW={"200px"}
                    >
                      <Icon name={"v_select"} color={"attribute.default"} size={"sm"} />
                      <Flex direction={"column"} gap={"0"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Select
                        </Text>
                        <Text fontSize={"xs"} color={"text.subtle"}>
                          A choice from a defined set of options.
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Spacer />

      {/* Action buttons */}
      <Flex direction={"row"} wrap={"wrap"} p={"1"}>
        <Button
          size={"xs"}
          rounded={"md"}
          colorPalette={"red"}
          variant={"solid"}
          onClick={() => navigate("/attributes")}
        >
          Cancel
          <Icon name={"cross"} size={"xs"} />
        </Button>
        <Spacer />
        <Tooltip
          content={"Insufficient permissions in this Workspace"}
          disabled={workspacePermissions.attributes.create}
          showArrow
        >
          <Button
            size={"xs"}
            rounded={"md"}
            colorPalette={"green"}
            onClick={onSubmit}
            disabled={isDetailsError || isValueError || isSubmitting || !workspacePermissions.attributes.create}
          >
            Finish
            <Icon name={"check"} size={"xs"} />
          </Button>
        </Tooltip>
      </Flex>

      <DialogUnsavedChanges
        blocker={blocker}
        cancelBlockerRef={cancelBlockerRef}
        onClose={onBlockerClose}
        callback={onBlockerClose}
      />
    </Content>
  );
};

export default Attribute;
