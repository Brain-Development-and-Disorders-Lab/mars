// React
import React, { useState } from "react";

// Existing and custom components
import { Button, Dialog, Flex, Text, CloseButton, Textarea } from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// GraphQL
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// Authentication
import { auth } from "@lib/auth";

// Error capture
import { getRecentErrors } from "@lib/errors";

// Custom types
import { ReportModalProps } from "@types";

// Variables
import { GLOBAL_STYLES } from "@variables";

const REPORT_ISSUE = gql`
  mutation ReportIssue(
    $description: String
    $path: String
    $userName: String
    $userId: String
    $userEmail: String
    $consoleErrors: [String]
  ) {
    reportIssue(
      description: $description
      path: $path
      userName: $userName
      userId: $userId
      userEmail: $userEmail
      consoleErrors: $consoleErrors
    ) {
      success
      message
    }
  }
`;

const ReportModal = (props: ReportModalProps) => {
  const { open, setOpen } = props;

  const [description, setDescription] = useState("");

  const { data: session } = auth.useSession();
  const [reportIssue, { loading: submitting }] = useMutation(REPORT_ISSUE);

  const handleCancel = () => {
    setDescription("");
    setOpen(false);
  };

  const handleSubmit = async () => {
    const user = session?.user;
    await reportIssue({
      variables: {
        description,
        path: window.location.pathname,
        userName: user ? `${user.firstName} ${user.lastName}`.trim() || user.name : "",
        userId: user?.id ?? "",
        userEmail: user?.email ?? "",
        consoleErrors: getRecentErrors(),
      },
    });
    setDescription("");
    setOpen(false);
    toaster.create({
      title: "Report submitted successfully",
      type: "success",
      duration: 4000,
      closable: true,
    });
  };

  return (
    <Dialog.Root open={open} placement={"center"} closeOnEscape closeOnInteractOutside>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content gap={"0"} w={"sm"}>
          <Dialog.Header p={"2"} fontWeight={"semibold"} fontSize={"xs"} bg={"red.500"} roundedTop={"md"}>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"bug"} size={"xs"} color={"white"} />
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"white"}>
                Report Issue
              </Text>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} color={"white"} onClick={handleCancel} />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body p={"2"}>
            <Flex direction={"column"} gap={"2"}>
              <Text fontSize={"xs"} ml={"0.5"}>
                Describe what you were doing when the issue occurred, and include any relevant error details or steps to
                reproduce the issue.
              </Text>
              <Text fontSize={"xs"} ml={"0.5"}>
                Your report, alongside internal error data, will be submitted to the Metadatify team and we will
                investigate.
              </Text>
              <Textarea
                size={"xs"}
                rounded={"md"}
                placeholder={"What happened?"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                resize={"none"}
              />
            </Flex>
          </Dialog.Body>
          <Dialog.Footer p={"1"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} gap={"1"} justify={"space-between"}>
              <Button variant={"solid"} size={"xs"} rounded={"md"} colorPalette={"red"} onClick={handleCancel}>
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>
              <Button
                variant={"solid"}
                size={"xs"}
                rounded={"md"}
                colorPalette={"green"}
                onClick={handleSubmit}
                disabled={description.trim() === "" || submitting}
                loading={submitting}
                loadingText={"Submitting..."}
              >
                Submit
                <Icon name={"check"} size={"xs"} />
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default ReportModal;
