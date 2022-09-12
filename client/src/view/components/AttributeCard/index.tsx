// React and Grommet
import React, { useState } from "react";
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
  TableRow,
  Text,
} from "grommet/components";
import { Close, Note, Storage } from "grommet-icons";

// Types
import { AttributeCardProps } from "types";

// Custom components
import Block from "src/view/components/Block";

const AttributeCard = (props: AttributeCardProps) => {
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
            <strong>Attribute: {props.data.name}</strong>
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
          {/* Populate footer depending on the blocks that are configured */}
        </CardFooter>
      </Card>

      {showDetails && (
        <Layer
          onEsc={() => setShowDetails(false)}
          onClickOutside={() => setShowDetails(false)}
        >
          {/* Heading and close button */}
          <Box direction="row" justify="between" pad={{ left: "medium", right: "medium" }}>
            <Heading level="2">
              Attribute: {props.data.name}
            </Heading>

            <Button
              icon={<Close />}
              onClick={() => setShowDetails(false)}
              plain
            />
          </Box>

          {/* Content */}
          <Box pad={{ left: "medium", right: "medium", bottom: "medium" }}direction="column" gap="small" width="large">
            <Box direction="column" align="center" background="light-2" round>
              <Heading level="3">Details</Heading>
              <Box pad="small" fill>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell scope="row" border>
                        <Heading level="4" margin="small">
                          Name
                        </Heading>
                      </TableCell>
                      <TableCell border>
                        <Text>{props.data.name}</Text>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell scope="row" border>
                        <Heading level="4" margin="small">
                          Description
                        </Heading>
                      </TableCell>
                      <TableCell border>
                        <Paragraph>{props.data.description}</Paragraph>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell scope="row" border>
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
            </Box>

            <Box direction="column" align="center" background="light-2" round>
              <Heading level="3">Blocks</Heading>
              <Box pad="small">
                {props.data.blocks &&
                  props.data.blocks.map((block) => {
                    // Adjust the type of element displayed depending on the content
                    let dataElement = <Text>{block.data}</Text>;
                    switch (block.type) {
                      case "url":
                        dataElement = (
                          <Anchor
                            href={block.data.toString()}
                            color="dark-2"
                            label={<Text truncate>{block.data}</Text>}
                          />
                        );
                        break;
                      default:
                        break;
                    }

                    return (
                      <Block
                        identifier={block.identifier}
                        name={block.name}
                        type={block.type}
                        data={dataElement}
                        disabled
                      />
                    );
                  })}
                </Box>
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default AttributeCard;
