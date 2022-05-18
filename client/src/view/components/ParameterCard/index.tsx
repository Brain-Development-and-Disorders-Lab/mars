import { Anchor, Box, Card, CardBody, CardFooter, CardHeader, Heading, Layer, Paragraph, Table, TableBody, TableCell, TableHeader, TableRow, Text } from "grommet";
import { Note, Storage } from "grommet-icons";
import React, { useState } from "react";

import { ParameterCardProps } from "types";

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
          <Text><strong>Parameter: {props.data.name}</strong></Text>
        </CardHeader>
        <CardBody pad="small">
          <Box direction="row" flex gap="small">
            <Storage color="brand" />
            <Text><strong>Storage type:</strong></Text>
            <Text>{props.data.type}</Text>
          </Box>
          <Box direction="row" flex gap="small" width={{ max: "medium" }}>
            <Note color="brand" />
            <Text><strong>Description:</strong></Text>
            <Text truncate>{props.data.description}</Text>
          </Box>
        </CardBody>

        <CardFooter pad={{ horizontal: "medium", vertical: "none" }} background="light-2">
          {/* Populate footer depending on the attributes that are configured */}
        </CardFooter>
      </Card>
      {showDetails &&
        <Layer onEsc={() => setShowDetails(false)} onClickOutside={() => setShowDetails(false)}>
          <Box margin="small" >
            <Heading level="2" margin="small">Parameter: {props.data.name}</Heading>

            <Heading level="4">Details</Heading>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell scope="col" border align="center">
                    <Heading level="3" margin="small">
                      Field
                    </Heading>
                  </TableCell>
                  <TableCell scope="col" border align="center">
                    <Heading level="3" margin="small">
                      Value
                    </Heading>
                  </TableCell>
                </TableRow>
              </TableHeader>
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

            <Heading level="4">Attributes</Heading>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell scope="col" border align="center">
                    <Heading level="3" margin="small">
                      Attribute
                    </Heading>
                  </TableCell>
                  <TableCell scope="col" border align="center">
                    <Heading level="3" margin="small">
                      Type
                    </Heading>
                  </TableCell>
                  <TableCell scope="col" border align="center">
                    <Heading level="3" margin="small">
                      Value
                    </Heading>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.data.attributes && props.data.attributes.map((attribute) => {
                  // Adjust the type of element displayed depending on the content
                  let dataElement = <Text>{attribute.data}</Text>;
                  switch (attribute.type) {
                    case "url":
                      dataElement = <Anchor href={attribute.data.toString()} color="dark-2" label={attribute.data}/>;
                      break;
                    default:
                      break;
                  }

                  return (
                    <TableRow>
                      <TableCell scope="row" align="right" border>
                        <Heading level="4" margin="small">
                          {attribute.name}
                        </Heading>
                      </TableCell>
                      <TableCell border>
                        <Text>{attribute.type}</Text>
                      </TableCell>
                      <TableCell border>
                        {dataElement}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Layer>
      }
    </>
  );
};

export default ParameterCard;
