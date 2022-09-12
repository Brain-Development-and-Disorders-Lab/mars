// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Heading,
  Layer,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
  TextInput,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { Add, Close } from "grommet-icons";

// Navigation
import { useParams } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { SampleModel } from "types";

// Custom components
import Flow from "src/view/components/Flow";
import ErrorLayer from "src/view/components/ErrorLayer";
import Linky from "src/view/components/Linky";
import AttributeCard from "src/view/components/AttributeCard";

export const Sample = () => {
  const { id } = useParams();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [sampleData, setSampleData] = useState({} as SampleModel);

  const [showFlow, setShowFlow] = useState(false);

  const [editing, setEditing] = useState(false);
  // const [changed, setChanged] = useState(false);
  const [description, setDescription] = useState("");

  const handleEditClick = () => {
    if (editing) {
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  useEffect(() => {
    const response = getData(`/samples/${id}`);

    // Handle the response from the database
    response.then((value) => {
      setSampleData(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });
    return;
  }, [id]);

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setDescription(sampleData.description);
    }
  }, [isLoaded]);

  return (
    <Page kind="wide">
      <PageContent>
        {isLoaded && isError === false ? (
          <Box gap="small" margin="small">
            <Box direction="column" justify="between">
              <PageHeader
                title={"Sample \"" + sampleData.name + "\""}
                parent={<Anchor label="Return to Samples" href="/samples" />}
              />
              <Box direction="row" gap="small">
                <Button
                  label={"View Flow"}
                  primary
                  onClick={() => setShowFlow(true)}
                />
                <Button
                  label={editing ? "Save" : "Edit"}
                  primary
                  onClick={() => handleEditClick()}
                />
              </Box>
            </Box>

            <Box direction="row" gap="small">
              {/* Metadata table */}
              <Box direction="column" align="center" background="light-2" basis="1/2" round>
                <Heading level="3" margin="small">
                  Metadata
                </Heading>

                <Box fill pad={{ left: "small", right: "small", bottom: "small" }}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Created
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Text>{new Date(sampleData.created).toDateString()}</Text>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Owner
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Text>
                            <Anchor label={sampleData.owner} color="dark-2" />
                          </Text>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Description
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <TextInput
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            disabled={!editing}
                            size="medium"
                            plain
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Origin
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Box direction="row" gap="small" align="center">
                            {sampleData.associations.origin.id !== "" ? (
                              <Linky
                                key={sampleData.associations.origin.id}
                                type="samples"
                                id={sampleData.associations.origin.id}
                              />
                            ) : (
                              <Text>No origin specified.</Text>
                            )}
                            {editing ? (
                              <Button icon={<Add size="small" />} primary disabled={!editing} />
                            ) : null}
                          </Box>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell scope="row"border>
                          <Heading level="4" margin="xsmall">
                            Primary collection
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Linky
                            key={sampleData.collection.id}
                            type="collections"
                            id={sampleData.collection.id}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              {/* Associated collections */}
              <Box direction="column" align="center" background="light-2" basis="1/4" round>
                <Heading level="3" margin="small">
                  Associated collections
                </Heading>
                <Box
                  wrap
                  round
                  direction="row"
                  justify="center"
                  align="center"
                  margin="small"
                  pad="small"
                  gap="small"
                  fill
                >
                  {sampleData.collections.length > 0 ? (
                    sampleData.collections.map((collection) => {
                      return (
                        <Linky
                          key={collection.id}
                          type="collections"
                          id={collection.id}
                        />
                      );
                    })
                  ) : (
                    <Text>No associated collections specified.</Text>
                  )}
                </Box>
              </Box>

              {/* Products */}
              <Box direction="column" align="center" background="light-2" basis="1/4" round>
                <Heading level="3" margin="small">
                  Products
                </Heading>
                <Box
                  wrap
                  direction="row"
                  justify="center"
                  align="center"
                  margin="small"
                  pad="small"
                  gap="small"
                  fill
                >
                  {sampleData.collections.length > 0 ? (
                    sampleData.associations.products.map((product) => {
                      return (
                        <Linky key={product.id} type="samples" id={product.id} />
                      );
                    })
                  ) : (
                    <Text>No products specified.</Text>
                  )}
                </Box>
              </Box>
            </Box>

            <Box direction="column" align="center" background="light-2" round>
              <Heading level="3" margin="small">
                Attributes
              </Heading>
              <Box
                wrap
                round
                direction="row"
                align="center"
                justify="start"
                margin="small"
                pad="small"
                gap="small"
                background="light-2"
                fill
              >
                {sampleData.attributes.length > 0 ? (
                  sampleData.attributes.map((attribute) => {
                    return <AttributeCard data={attribute} />;
                  })
                ) : (
                  <Text>No attributes specified.</Text>
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box fill align="center" justify="center">
            <Spinner size="large" />
          </Box>
        )}
        {isError && <ErrorLayer message={errorMessage} />}
        {showFlow && (
          <Layer
            full
            onEsc={() => setShowFlow(false)}
            onClickOutside={() => setShowFlow(false)}
          >
            <Box direction="row" justify="between" margin={{ right: "small" }}>
              <Heading level="2" margin="small">
                Flow: {sampleData.name}
              </Heading>
              <Button icon={<Close />} onClick={() => setShowFlow(false)} plain />
            </Box>
            <Flow id={sampleData._id} />
          </Layer>
        )}
      </PageContent>
    </Page>
  );
};

export default Sample;
