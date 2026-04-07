// React imports
import React, { useState, useEffect } from "react";

// Components
import { Flex, Heading, Button, Image, Text, Input, Field, Fieldset } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Navigation
import { useNavigate, useSearchParams } from "react-router-dom";

// Authentication
import { auth } from "@lib/auth";

// Variables
import { GLOBAL_STYLES } from "@variables";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  // Handle checking for the token or if user is already authenticated
  useEffect(() => {
    if (!token) {
      navigate("/forgot-password", { replace: true });
      return;
    }

    auth.getSession().then(({ data: session }) => {
      if (session?.user) {
        navigate("/", { replace: true });
      }
    });
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordsMatch = password !== "" && password === confirmPassword;

  const onSubmit = async () => {
    setIsLoading(true);
    const { error } = await auth.resetPassword({ newPassword: password, token });
    setIsLoading(false);

    if (error) {
      toaster.create({
        title: "Error",
        description: error.message || "Unable to reset password, link may have expired",
        type: "error",
        duration: 5000,
        closable: true,
      });
    } else {
      toaster.create({
        title: "Password Reset",
        description: "Your password has been reset successfully, please log in",
        type: "success",
        duration: 4000,
        closable: true,
      });
      navigate("/login");
    }
  };

  const checkKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && passwordsMatch) {
      onSubmit();
    }
  };

  return (
    <Content>
      <Flex h={"10vh"} p={"4"}>
        <Flex gap={"2"} align={"center"} p={"4"}>
          <Image src={"/Favicon.png"} w={"25px"} h={"25px"} />
          <Heading size={"md"} color={"primary"}>
            Metadatify
          </Heading>
        </Flex>
      </Flex>

      <Flex
        direction={"column"}
        justify={"center"}
        align={"center"}
        alignSelf={"center"}
        gap={"8"}
        h={"80vh"}
        onKeyUp={checkKeyboard}
      >
        <Flex
          direction={"column"}
          p={"8"}
          gap={"6"}
          bg={"white"}
          align={"center"}
          justify={"center"}
          border={GLOBAL_STYLES.border.style}
          borderColor={GLOBAL_STYLES.border.color}
          rounded={"lg"}
          shadow={"sm"}
          w={"sm"}
        >
          <Flex direction={"column"} gap={"2"} align={"center"}>
            <Image src={"/Favicon.png"} w={"35px"} h={"35px"} />
            <Heading size={"2xl"} fontWeight={"semibold"}>
              New Password
            </Heading>
            <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.500"} textAlign={"center"}>
              Enter a new password for your account.
            </Text>
          </Flex>

          <Fieldset.Root w={"100%"}>
            <Field.Root gap={"0.5"} required>
              <Field.Label fontSize={"xs"}>
                New Password
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type={"password"}
                rounded={"md"}
                size={"xs"}
                value={password}
                placeholder={"New password"}
                disabled={isLoading}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field.Root>

            <Field.Root gap={"0.5"} invalid={confirmPassword !== "" && !passwordsMatch} required>
              <Field.Label fontSize={"xs"}>
                Confirm Password
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type={"password"}
                rounded={"md"}
                size={"xs"}
                value={confirmPassword}
                placeholder={"Confirm password"}
                disabled={isLoading}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <Field.ErrorText fontSize={"xs"}>Passwords do not match</Field.ErrorText>
            </Field.Root>

            <Button
              mt={"2"}
              size={"xs"}
              rounded={"md"}
              colorPalette={"green"}
              disabled={!passwordsMatch}
              loading={isLoading}
              loadingText={"Updating..."}
              onClick={onSubmit}
              w={"100%"}
            >
              Update
              <Icon size={"xs"} name={"c_right"} />
            </Button>
          </Fieldset.Root>
        </Flex>
      </Flex>
    </Content>
  );
};

export default ResetPassword;
