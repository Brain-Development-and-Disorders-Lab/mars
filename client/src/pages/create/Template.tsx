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
  useDisclosure,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";
import { Information } from "@components/Label";
import { UnsavedChangesModal } from "@components/WarningModal";
import { toaster } from "@components/Toast";
import RichTextEditor from "@components/RichTextEditor";

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

// Posthog
import { usePostHog } from "posthog-js/react";

// Variables
import { GLOBAL_STYLES } from "@variables";

const Template = () => {
  const posthog = usePostHog();

  const [informationOpen, setInformationOpen] = useState(false);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");
  const [created, setCreated] = useState("");
  const [values, setValues] = useState<IValue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUser = async () => {
    const sessionResponse = await auth.getSession();
    if (sessionResponse.error || !sessionResponse.data) {
      toaster.create({
        title: "Error",
        description: "Session expired, please login again",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else {
      setOwner(sessionResponse.data.user.id);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  const isNameError = name === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isDescriptionError;
  const [isValueError, setIsValueError] = useState(false);
  useEffect(() => {
    setIsValueError(!isValidValues(values, true));
  }, [values]);

  useEffect(() => {
    posthog?.capture("create_template_start");
  }, [posthog]);

  const templateData: IAttribute = { name, owner, archived: false, description, values };

  const CREATE_TEMPLATE = gql`
    mutation CreateTemplate($template: AttributeCreateInput) {
      createTemplate(template: $template) {
        success
        message
      }
    }
  `;
  const [createTemplate, { loading, error }] = useMutation<{
    createTemplate: ResponseData<string>;
  }>(CREATE_TEMPLATE);

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
    posthog?.capture("create_template_finish");
    setIsSubmitting(true);
    const response = await createTemplate({ variables: { template: templateData } });

    if (!response.data?.createTemplate?.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred when creating Template",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else {
      toaster.create({ title: "Template created successfully", type: "success", duration: 2000, closable: true });
      setIsSubmitting(false);
      navigate("/templates");
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
        <Flex direction={"row"} p={"1"} align={"center"} gap={"1"}>
          <Icon name={"template"} size={"xs"} color={GLOBAL_STYLES.template.iconColor} />
          <Heading size={"sm"}>Create Template</Heading>
          <Spacer />
          <Button size={"xs"} rounded={"md"} variant={"outline"} onClick={() => setInformationOpen(true)}>
            Info
            <Icon name={"info"} size={"xs"} />
          </Button>
        </Flex>

        <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
          {/* Name */}
          <Flex
            direction={"column"}
            w={{ base: "100%", md: "50%" }}
            p={"1"}
            pt={{ base: "0", lg: "1" }}
            gap={"1"}
            grow={"1"}
          >
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              bg={"gray.50"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              rounded={"md"}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                Details
              </Text>
              <Field.Root required gap={"1"}>
                <Field.Label fontSize={"xs"} fontWeight={"semibold"}>
                  Template Name
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
                  <Field.ErrorText fontSize={"xs"}>A name must be specified for the Template.</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root gap={"1"}>
                <Field.Label fontSize={"xs"} fontWeight={"semibold"}>
                  Template Owner
                </Field.Label>
                <Flex>
                  <ActorTag identifier={owner} fallback={"Unknown User"} size={"sm"} />
                </Flex>
              </Field.Root>

              <Field.Root gap={"1"}>
                <Field.Label fontSize={"xs"} fontWeight={"semibold"}>
                  Template Created
                </Field.Label>
                <Input
                  size={"xs"}
                  rounded={"md"}
                  type={"datetime-local"}
                  bg={"white"}
                  value={created}
                  onChange={(event) => setCreated(dayjs(event.target.value).format("YYYY-MM-DDTHH:mm"))}
                />
                <Information text={"Specify a timestamp for the Template."} />
              </Field.Root>
            </Flex>
          </Flex>

          {/* Description */}
          <Flex
            direction={"column"}
            w={{ base: "100%", md: "50%" }}
            p={"1"}
            pl={{ base: "1", lg: "0" }}
            pt={{ base: "0", lg: "1" }}
            gap={"1"}
            grow={"1"}
          >
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              bg={"gray.50"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                Description
              </Text>
              <Field.Root required gap={"1"}>
                <Field.Label fontSize={"xs"} fontWeight={"semibold"}>
                  Template Description
                  <Field.RequiredIndicator />
                </Field.Label>
                <RichTextEditor value={description} onChange={(value) => setDescription(value)} />
                {isDescriptionError && (
                  <Field.ErrorText fontSize={"xs"}>A description should be provided for the Template.</Field.ErrorText>
                )}
              </Field.Root>
            </Flex>
          </Flex>
        </Flex>

        {/* Values */}
        <Flex direction={"column"} p={"1"} gap={"1"}>
          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            bg={"gray.50"}
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
            rounded={"md"}
          >
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
              Values
            </Text>
            <Information text={"At least one Value with a name and type is required."} />
            <Values viewOnly={false} values={values} setValues={setValues} />
          </Flex>
        </Flex>
      </Flex>

      {/* Information modal */}
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
              <CloseButton size={"2xs"} top={"6px"} onClick={() => setInformationOpen(false)} />
            </Dialog.CloseTrigger>
            <Dialog.Header
              p={"2"}
              fontWeight={"semibold"}
              fontSize={"xs"}
              bg={GLOBAL_STYLES.dialog.headerColor}
              roundedTop={"md"}
            >
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Icon name={"template"} size={"xs"} color={GLOBAL_STYLES.template.iconColor} />
                Template Attributes
              </Flex>
            </Dialog.Header>
            <Dialog.Body p={"2"}>
              <Flex gap={"2"} direction={"column"}>
                <Flex
                  direction={"column"}
                  gap={"1"}
                  bg={"gray.50"}
                  p={"2"}
                  rounded={"md"}
                  border={GLOBAL_STYLES.border.style}
                  borderColor={GLOBAL_STYLES.border.color}
                >
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Icon name={"info"} size={"xs"} color={"gray.500"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                      What is a Template?
                    </Text>
                  </Flex>
                  <Text fontSize={"xs"} color={"gray.600"} lineHeight={"tall"}>
                    Templates define a set of metadata fields that can be applied to Entities during creation. Use them
                    to pre-populate Attributes and keep metadata consistent across similar Entities.
                  </Text>
                </Flex>

                <Flex direction={"column"} gap={"1.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                    Supported Value Types
                  </Text>
                  <Flex direction={"row"} wrap={"wrap"} gap={"1.5"}>
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      align={"center"}
                      p={"2"}
                      rounded={"md"}
                      bg={"orange.50"}
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
                        <Text fontSize={"xs"} color={"gray.500"}>
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
                        <Text fontSize={"xs"} color={"gray.500"}>
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
                        <Text fontSize={"xs"} color={"gray.500"}>
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
                        <Text fontSize={"xs"} color={"gray.500"}>
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
                      <Icon name={"entity"} color={"purple.400"} size={"sm"} />
                      <Flex direction={"column"} gap={"0"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Entity
                        </Text>
                        <Text fontSize={"xs"} color={"gray.500"}>
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
                      <Icon name={"v_select"} color={"teal.400"} size={"sm"} />
                      <Flex direction={"column"} gap={"0"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Select
                        </Text>
                        <Text fontSize={"xs"} color={"gray.500"}>
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
          onClick={() => navigate("/templates")}
        >
          Cancel
          <Icon name={"cross"} size={"xs"} />
        </Button>
        <Spacer />
        <Button
          size={"xs"}
          rounded={"md"}
          colorPalette={"green"}
          onClick={onSubmit}
          disabled={isDetailsError || isValueError || isSubmitting}
        >
          Finish
          <Icon name={"check"} size={"xs"} />
        </Button>
      </Flex>

      <UnsavedChangesModal
        blocker={blocker}
        cancelBlockerRef={cancelBlockerRef}
        onClose={onBlockerClose}
        callback={onBlockerClose}
      />
    </Content>
  );
};

export default Template;
