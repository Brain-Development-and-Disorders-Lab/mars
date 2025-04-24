import React, { useEffect } from "react";
import { useState } from "react";
import {
  Flex,
  IconButton,
  Image,
  Spacer,
  Spinner,
  Text,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// Custom types
import { PreviewModalProps, PreviewSupport } from "@types";

// PDF preview imports
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// DNA preview imports
import { SeqViz } from "seqviz";
import seqparse, { Annotation } from "seqparse";

// Zoom and pan import for image previews
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch";

// GraphQL
import { gql, useQuery } from "@apollo/client";
import { STATIC_URL } from "src/variables";

// Utility functions
import _ from "lodash";
import consola from "consola";

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

// Variables
const IMAGE_TYPES = ["png", "jpg", "jpeg"];
const MIN_WIDTH_DOCUMENT = 400; // Minimum width for document preview
const MIN_WIDTH_IMAGE = 300; // Minimum width for image preview
const MIN_WIDTH_SEQUENCE = 500; // Minimum width for sequence preview

/**
 * Get the current window dimensions
 * @returns {Object} The current window dimensions
 */
const getWindowDimensions = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const ImageControls = () => {
  // Controls for image preview
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <Flex
      direction={"row"}
      gap={"2"}
      pb={"0"}
      align={"center"}
      justify={"center"}
    >
      <IconButton
        size={"sm"}
        colorPalette={"blue"}
        aria-label={"Zoom out"}
        onClick={() => zoomOut()}
      >
        <Icon name={"zoom_out"} />
      </IconButton>
      <IconButton
        size={"sm"}
        colorPalette={"blue"}
        aria-label={"Zoom in"}
        onClick={() => zoomIn()}
      >
        <Icon name={"zoom_in"} />
      </IconButton>
      <IconButton
        size={"sm"}
        aria-label={"Reset"}
        onClick={() => resetTransform()}
      >
        <Icon name={"reload"} />
      </IconButton>
    </Flex>
  );
};

const UnsupportedPreview = () => {
  return (
    <Flex
      minH={"200px"}
      w={"100%"}
      align={"center"}
      justify={"center"}
      direction={"column"}
      gap={"2"}
    >
      <Text fontSize={"sm"} fontWeight={"semibold"} textAlign={"center"}>
        Unsupported screen size
      </Text>
      <Text
        fontSize={"sm"}
        color={"gray.500"}
        fontWeight={"semibold"}
        textAlign={"center"}
      >
        Preview can not be shown on this screen size
      </Text>
    </Flex>
  );
};

const PreviewModal = (props: PreviewModalProps) => {
  // Page view state
  const [previewPages, setPreviewPages] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(1);

  // Preview data state
  const [previewType, setPreviewType] = useState(
    "image" as "document" | "image" | "sequence",
  );
  const [previewSource, setPreviewSource] = useState("");

  const [previewSupport, setPreviewSupport] = useState<PreviewSupport>({
    document: getWindowDimensions().width > MIN_WIDTH_DOCUMENT,
    image: getWindowDimensions().width > MIN_WIDTH_IMAGE,
    sequence: getWindowDimensions().width > MIN_WIDTH_SEQUENCE,
  });

  // Sequence state
  const [preparingSequence, setPreparingSequence] = useState(false);
  const [sequence, setSequence] = useState("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const GET_FILE_URL = gql`
    query GetFileURL($_id: String) {
      downloadFile(_id: $_id)
    }
  `;
  const { data, loading, error, refetch } = useQuery(GET_FILE_URL, {
    variables: {
      _id: props.attachment._id,
    },
  });

  // Handlers for page view manipulation
  const onPreviewDocumentLoadSuccess = ({
    numPages,
  }: {
    numPages: number;
  }): void => {
    setPreviewPages(numPages);
  };

  // Show the next page of the PDF if available
  const nextPage = () => {
    if (previewIndex < previewPages) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  // Show the previous page of the PDF if available
  const previousPage = () => {
    if (previewIndex > 1) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  const prepareSequence = async () => {
    setPreparingSequence(true);
    const response = await fetch(previewSource);

    if (!response.ok) {
      consola.error("Failed to prepare sequence:", response.statusText);
      setPreparingSequence(false);
      return;
    }

    const text = await response.text(); // Read the response as text
    const { seq, annotations } = await seqparse(text); // Pass the text to seqparse
    setSequence(seq);
    setAnnotations(annotations);
    setPreviewSource(seq);
    setPreparingSequence(false);
  };

  useEffect(() => {
    if (data?.downloadFile) {
      // Generate the static URL to retrieve the file preview
      setPreviewSource(`${STATIC_URL}${data.downloadFile}`);

      // Set the preview type depending on the file type
      const fileType = _.toLower(props.attachment.name.split(".").pop());
      if (fileType === "pdf") {
        setPreviewType("document");
      } else if (_.includes(IMAGE_TYPES, fileType)) {
        setPreviewType("image");
      } else if (fileType === "dna") {
        setPreviewType("sequence");
      }
    }
  }, [data]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // Prepare the sequence for preview
  useEffect(() => {
    if (previewType === "sequence") {
      prepareSequence();
    }
  }, [previewType]);

  useEffect(() => {
    // Update the preview support based on the current window dimensions
    const handleResize = () => {
      setPreviewSupport({
        document: getWindowDimensions().width > MIN_WIDTH_DOCUMENT,
        image: getWindowDimensions().width > MIN_WIDTH_IMAGE,
        sequence: getWindowDimensions().width > MIN_WIDTH_SEQUENCE,
      });
    };

    // Add the event listener to the window
    window.addEventListener("resize", handleResize);

    // Remove the event listener when the component unmounts
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Flex w={"100%"}>
      {!loading && !preparingSequence ? (
        <Flex direction={"column"} w={"100%"} gap={"2"}>
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              Name:
            </Text>
            <Text fontSize={"sm"}>
              {_.truncate(props.attachment.name, { length: 24 })}
            </Text>
            <Spacer />
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              Type:
            </Text>
            <Text fontSize={"sm"}>{previewType}</Text>
          </Flex>

          {previewType === "document" &&
            (previewSupport.document ? (
              <Flex direction={"column"}>
                <Flex
                  overflowY={"scroll"}
                  minH={"400px"}
                  maxH={"70vh"}
                  maxW={"85vw"}
                  justify={"center"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  mb={"2"}
                >
                  <Document
                    file={previewSource}
                    onLoadSuccess={onPreviewDocumentLoadSuccess}
                  >
                    <Page
                      key={`page_${previewIndex}`}
                      pageNumber={previewIndex}
                    />
                  </Document>
                </Flex>

                <Flex
                  direction={"row"}
                  gap={"2"}
                  pb={"0"}
                  align={"center"}
                  justify={"center"}
                >
                  <IconButton
                    aria-label={"Previous page"}
                    size={"sm"}
                    colorPalette={"blue"}
                    onClick={previousPage}
                    disabled={previewIndex === 1}
                  >
                    <Icon name={"c_left"} />
                  </IconButton>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Page {previewIndex} of {previewPages}
                  </Text>
                  <IconButton
                    aria-label={"Next page"}
                    size={"sm"}
                    colorPalette={"blue"}
                    onClick={nextPage}
                    disabled={previewIndex === previewPages}
                  >
                    <Icon name={"c_right"} />
                  </IconButton>
                </Flex>
              </Flex>
            ) : (
              <UnsupportedPreview />
            ))}

          {previewType === "image" &&
            (previewSupport.image ? (
              <TransformWrapper>
                <Flex
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  minH={"400px"}
                  mb={"2"}
                >
                  <TransformComponent>
                    <Image
                      src={previewSource}
                      w={"100%"}
                      objectFit={"contain"}
                    />
                  </TransformComponent>
                </Flex>
                <ImageControls />
              </TransformWrapper>
            ) : (
              <UnsupportedPreview />
            ))}

          {previewType === "sequence" &&
            (previewSupport.sequence ? (
              <Flex minH={"500px"} minW={"500px"}>
                <SeqViz
                  name={props.attachment.name}
                  seq={sequence}
                  annotations={annotations}
                />
              </Flex>
            ) : (
              <UnsupportedPreview />
            ))}
        </Flex>
      ) : (
        <Flex
          direction={"column"}
          align={"center"}
          justify={"center"}
          minH={"400px"}
          gap={"2"}
        >
          <Text fontSize={"sm"} color={"gray.400"} fontWeight={"semibold"}>
            Preparing Preview
          </Text>
          <Spinner />
        </Flex>
      )}

      {!_.isUndefined(error) && (
        <Flex direction={"column"} gap={"2"}>
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              Name:
            </Text>
            <Text fontSize={"sm"}>Unable to load preview</Text>
            <Spacer />
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              Type:
            </Text>
            <Text fontSize={"sm"}>Unknown</Text>
          </Flex>
          <Flex
            minH={"400px"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.300"}
            align={"center"}
            justify={"center"}
            mb={"2"}
          >
            <Text color={"gray.400"} fontWeight={"semibold"}>
              Unable to load preview
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default PreviewModal;
