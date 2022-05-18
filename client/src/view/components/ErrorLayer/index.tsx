import { Box, Button, Heading, Layer, Text } from "grommet";
import { LinkNext } from "grommet-icons";
import React from "react";
import { useNavigate } from "react-router-dom";

const ErrorLayer = (props: { message: string }) => {
  const navigate = useNavigate();
  return (
    <Layer>
      <Box margin="small" pad="small" justify="center" align="center" direction="column" gap="small">
        <Heading margin="small" color="red">Error!</Heading>
        <Text><b>Message:</b> {props.message}</Text>
        <Button label="Return" icon={<LinkNext />} onClick={() => navigate("/")} primary reverse />
      </Box>
    </Layer>
  );
}

export default ErrorLayer;