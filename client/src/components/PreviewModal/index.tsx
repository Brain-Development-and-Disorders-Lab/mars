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
import { PreviewModalProps } from "@types";

// PDF preview imports
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

// Variables
const IMAGE_TYPES = ["png", "jpg", "jpeg"];

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
        icon={<Icon name={"zoom_out"} />}
        colorScheme={"blue"}
        aria-label={"Zoom out"}
        onClick={() => zoomOut()}
      />
      <IconButton
        size={"sm"}
        icon={<Icon name={"zoom_in"} />}
        colorScheme={"blue"}
        aria-label={"Zoom in"}
        onClick={() => zoomIn()}
      />
      <IconButton
        size={"sm"}
        icon={<Icon name={"reload"} />}
        aria-label={"Reset"}
        onClick={() => resetTransform()}
      />
    </Flex>
  );
};

const PreviewModal = (props: PreviewModalProps) => {
  // Page view state
  const [previewPages, setPreviewPages] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(1);

  // Preview data state
  const [previewType, setPreviewType] = useState(
    "image" as "document" | "image",
  );
  const [previewSource, setPreviewSource] = useState("");

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
      }
    }
  }, [data]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

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

  return (
    <Flex>
      {!loading ? (
        <Flex direction={"column"} gap={"2"}>
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

          {_.isEqual(previewType, "document") ? (
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
                  colorScheme={"blue"}
                  onClick={previousPage}
                  icon={<Icon name={"c_left"} />}
                  isDisabled={previewIndex === 1}
                />
                <Text fontSize={"sm"} fontWeight={"semibold"}>
                  Page {previewIndex} of {previewPages}
                </Text>
                <IconButton
                  aria-label={"Next page"}
                  size={"sm"}
                  colorScheme={"blue"}
                  onClick={nextPage}
                  icon={<Icon name={"c_right"} />}
                  isDisabled={previewIndex === previewPages}
                />
              </Flex>
            </Flex>
          ) : (
            <TransformWrapper>
              <Flex
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
                minH={"400px"}
                mb={"2"}
              >
                <TransformComponent>
                  <Image src={previewSource} w={"100%"} objectFit={"contain"} />
                </TransformComponent>
              </Flex>
              <ImageControls />
            </TransformWrapper>
          )}
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
