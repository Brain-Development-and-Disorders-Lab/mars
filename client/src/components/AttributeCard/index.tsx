// React and Grommet
import React, { useState } from "react";
import {
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
import Parameter from "src/components/Parameter";

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
          <Heading level={3} margin="none">{props.data.name}</Heading>
        </CardHeader>

        <CardBody pad="small">
          <Box direction="row" flex gap="small">
            <Storage color="brand" />
            <Heading level={4} margin="none">Storage:</Heading>
            <Text>{props.data.type}</Text>
          </Box>
          <Box direction="row" flex gap="small" width={{ max: "medium" }}>
            <Note color="brand" />
            <Text>
              <strong>Description:</strong>
            </Text>
            <Text truncate>
              {props.data.description.length > 0 ?
                props.data.description
              :
                "No description."
              }
            </Text>
          </Box>
        </CardBody>

        <CardFooter
          pad={{ horizontal: "medium"}}
          margin="none"
          background="light-2"
        >
          {/* Populate footer depending on the Parameters that are configured */}
        </CardFooter>
      </Card>

      {showDetails && (
        <Layer
          onEsc={() => setShowDetails(false)}
          onClickOutside={() => setShowDetails(false)}
        >
          {/* Heading and close button */}
          <Box
            direction="row"
            justify="between"
            pad={{ left: "medium", right: "medium" }}
            width="large"
          >
            <Heading level="2">Attribute: {props.data.name}</Heading>

            <Button
              icon={<Close />}
              onClick={() => setShowDetails(false)}
              plain
            />
          </Box>

          {/* Content */}
          <Box
            pad="medium"
            direction="column"
            gap="small"
          >
            <Heading level="3" margin="none">Metadata</Heading>
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
                    <Paragraph>
                      {props.data.description.length > 0 ?
                        props.data.description
                      :
                        "No description."
                      }
                    </Paragraph>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row" border>
                    <Heading level="4" margin="small">
                      Storage Type
                    </Heading>
                  </TableCell>
                  <TableCell border>
                    <Text>{props.data.type}</Text>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Box direction="column" align="center" background="light-2" round>
              <Heading level="3">Parameters{props.data.parameters && " (" + props.data.parameters.length + ")"}</Heading>
              <Box pad="small">
                {props.data.parameters && props.data.parameters.length > 0 ?
                  props.data.parameters.map((parameter) => {
                    return (
                      <Parameter
                        key={`parameter-${parameter}`}
                        identifier={parameter.identifier}
                        name={parameter.name}
                        type={parameter.type}
                        data={parameter.data}
                        disabled
                      />
                    );
                  })
                :
                  <Paragraph>No parameters.</Paragraph>
                }
              </Box>
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default AttributeCard;
