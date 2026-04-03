import React, { useState } from "react";
import { Flex, Heading, Button, Image, Text, Input, Field, Fieldset } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import { auth } from "@lib/auth";
import { APP_URL } from "@variables";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async () => {
    setIsLoading(true);
    const { error } = await auth.requestPasswordReset({
      email,
      redirectTo: `${APP_URL}/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      toaster.create({
        title: "Error",
        description: "Unable to send reset email. Please try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else {
      setSubmitted(true);
    }
  };

  const checkKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && email !== "" && !submitted) {
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
          border={"1px solid"}
          borderColor={"gray.200"}
          rounded={"lg"}
          shadow={"sm"}
          w={"sm"}
        >
          <Flex direction={"column"} gap={"2"} align={"center"}>
            <Image src={"/Favicon.png"} w={"35px"} h={"35px"} />
            <Heading size={"2xl"} fontWeight={"semibold"}>
              Reset password
            </Heading>
            <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.500"} textAlign={"center"}>
              {submitted
                ? "If an account exists for that email, a reset link has been sent."
                : "Enter your email and we'll send you a link to reset your password."}
            </Text>
          </Flex>

          {!submitted && (
            <Fieldset.Root w={"100%"}>
              <Field.Root gap={"0.5"} required>
                <Field.Label fontSize={"xs"}>
                  Email
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  rounded={"md"}
                  size={"xs"}
                  type={"email"}
                  value={email}
                  placeholder={"Email"}
                  disabled={isLoading}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field.Root>

              <Button
                mt={"2"}
                size={"xs"}
                rounded={"md"}
                colorPalette={"green"}
                disabled={email === ""}
                loading={isLoading}
                loadingText={"Sending..."}
                onClick={onSubmit}
                w={"100%"}
              >
                Send reset link
                <Icon size={"xs"} name={"c_right"} />
              </Button>
            </Fieldset.Root>
          )}

          <Button size={"xs"} rounded={"md"} variant={"ghost"} colorPalette={"gray"} onClick={() => navigate("/login")}>
            <Icon size={"xs"} name={"c_left"} />
            Back to login
          </Button>
        </Flex>
      </Flex>
    </Content>
  );
};

export default ForgotPassword;
