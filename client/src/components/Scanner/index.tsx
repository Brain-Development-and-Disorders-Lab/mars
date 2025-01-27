import React, { useEffect } from "react";
import { Flex } from "@chakra-ui/react";
import { Html5QrcodeCameraScanConfig, Html5QrcodeScanner } from "html5-qrcode";

// Custom types
import { ScannerProps } from "@types";

// Utilities
import consola from "consola";
import _ from "lodash";

// Constants
const REGION_ID = "scanner-region";

/**
 * Creates the configuration object for Html5QrcodeScanner.
 * @param {ScannerProps} props Scanner props
 * @returns {any} Configuration object
 */
const createConfig = (props: ScannerProps) => {
  const config: Html5QrcodeCameraScanConfig = {
    fps: _.isUndefined(props.fps) ? 10 : props.fps,
    qrbox: _.isUndefined(props.qrbox) ? 250 : props.qrbox,
    aspectRatio: _.isUndefined(props.aspectRatio) ? 1 : props.aspectRatio,
    disableFlip: _.isUndefined(props.disableFlip) ? false : props.disableFlip,
  };

  return config;
};

/**
 * Scanner component
 * @param {ScannerProps} props Scanner props
 * @returns {JSX.Element} Scanner component
 */
const Scanner = (props: ScannerProps) => {
  useEffect(() => {
    // Setup the configuration object
    const config = createConfig(props);
    const verbose = props.verbose === true;

    // Suceess callback is required.
    if (!props.qrCodeSuccessCallback) {
      throw `"qrCodeSuccessCallback" is required callback`;
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      REGION_ID,
      config,
      verbose,
    );
    html5QrcodeScanner.render(
      props.qrCodeSuccessCallback,
      props.qrCodeErrorCallback,
    );

    // Cleanup function when component will unmount
    return () => {
      html5QrcodeScanner.clear().catch((error) => {
        consola.error(`Failed to clear "html5QrcodeScanner":`, error);
      });
    };
  }, []);

  return (
    <Flex
      id={REGION_ID}
      direction={"column"}
      w={"100%"}
      h={"100%"}
      justify={"center"}
      align={"center"}
      border={"2px"}
      borderColor={"gray.400"}
      rounded={"md"}
    ></Flex>
  );
};

export default Scanner;
