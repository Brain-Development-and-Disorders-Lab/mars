import {
  Anchor,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  Layer,
  Paragraph,
  Table,
  TableBody,
  TableCell,
  // TableHeader,
  TableRow,
  Text,
} from "grommet";
import { Close, Note, Storage } from "grommet-icons";
import React, { useState } from "react";

import { ParameterCardProps } from "types";
import Attribute from "../Attribute";

const ParameterCard = (props: ParameterCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card
        height="small"
        width="medium"
        background="light-1"
        onClick={() => {
          setShowDetails(true);
        }}
      >
        <CardHeader pad="small" align="center" margin="none">
          <Text>
            <strong>Parameter: {props.data.name}</strong>
          </Text>
        </CardHeader>
        <CardBody pad="small">
          <Box direction="row" flex gap="small">
            <Storage color="brand" />
            <Text>
              <strong>Storage type:</strong>
            </Text>
            <Text>{props.data.type}</Text>
          </Box>
          <Box direction="row" flex gap="small" width={{ max: "medium" }}>
            <Note color="brand" />
            <Text>
              <strong>Description:</strong>
            </Text>
            <Text truncate>{props.data.description}</Text>
          </Box>
        </CardBody>

        <CardFooter
          pad={{ horizontal: "medium", vertical: "none" }}
          background="light-2"
        >
          {/* Populate footer depending on the attributes that are configured */}
        </CardFooter>
      </Card>
      {showDetails && (
        <Layer
          full
          onEsc={() => setShowDetails(false)}
          onClickOutside={() => setShowDetails(false)}
        >
          <Box margin="small">
            <Box direction="row" justify="between" margin={{ right: "small" }}>
              <Heading level="2" margin="small">
                Parameter details: {props.data.name}
              </Heading>
              <Button
                icon={<Close />}
                onClick={() => setShowDetails(false)}
                plain
              />
            </Box>

            <Box width={{ min: "small", max: "medium" }}>
              <Heading level="4">Details</Heading>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row" align="right" border>
                      <Heading level="4" margin="small">
                        Name
                      </Heading>
                    </TableCell>
                    <TableCell border>
                      <Text>{props.data.name}</Text>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row" align="right" border>
                      <Heading level="4" margin="small">
                        Description
                      </Heading>
                    </TableCell>
                    <TableCell border>
                      <Paragraph>{props.data.description}</Paragraph>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row" align="right" border>
                      <Heading level="4" margin="small">
                        Type
                      </Heading>
                    </TableCell>
                    <TableCell border>
                      <Text>{props.data.type}</Text>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            <Heading level="4">Attributes</Heading>
            <Box gap="small">
              {props.data.attributes &&
                props.data.attributes.map((attribute) => {
                  // Adjust the type of element displayed depending on the content
                  let dataElement = <Text>{attribute.data}</Text>;
                  switch (attribute.type) {
                    case "url":
                      dataElement = (
                        <Anchor
                          href={attribute.data.toString()}
                          color="dark-2"
                          label={<Text truncate>{attribute.data}</Text>}
                        />
                      );
                      break;
                    default:
                      break;
                  }

                  return (
                    <Attribute
                      identifier={attribute.identifier}
                      name={attribute.name}
                      type={attribute.type}
                      data={dataElement}
                      disabled
                    />
                  );
                })}
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default ParameterCard;
