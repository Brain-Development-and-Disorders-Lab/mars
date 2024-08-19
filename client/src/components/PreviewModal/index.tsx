import React from "react";
import { useState } from "react";
import { Flex, IconButton, Image, Spacer, Text } from "@chakra-ui/react";
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

// Utility functions
import _ from "lodash";

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

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

  // Handlers for page view manipulation
  const onPreviewDocumentLoadSuccess = ({
    numPages,
  }: {
    numPages: number;
  }): void => {
    setPreviewPages(numPages);
  };

  const nextPage = () => {
    if (previewIndex < previewPages) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  const previousPage = () => {
    if (previewIndex > 1) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  return (
    <Flex>
      {_.isEqual(props.type, "image") && (
        <Flex direction={"column"} gap={"2"}>
          <TransformWrapper>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                Attachment Name:
              </Text>
              <Text fontSize={"sm"}>
                {_.truncate(props.name, { length: 32 })}
              </Text>
              <Spacer />
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                Attachment Type:
              </Text>
              <Text fontSize={"sm"}>{props.type}</Text>
            </Flex>
            <Flex
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.200"}
              mb={"2"}
            >
              <TransformComponent>
                <Image src={props.src} w={"100%"} objectFit={"contain"} />
              </TransformComponent>
            </Flex>
            <ImageControls />
          </TransformWrapper>
        </Flex>
      )}

      {_.isEqual(props.type, "document") && (
        <Flex direction={"column"} gap={"2"}>
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              Attachment Name:
            </Text>
            <Text fontSize={"sm"}>
              {_.truncate(props.name, { length: 32 })}
            </Text>
            <Spacer />
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              Attachment Type:
            </Text>
            <Text fontSize={"sm"}>{props.type}</Text>
          </Flex>
          <Flex
            overflowY={"scroll"}
            maxH={"70vh"}
            justify={"center"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.200"}
            mb={"2"}
          >
            <Document
              file={props.src}
              onLoadSuccess={onPreviewDocumentLoadSuccess}
            >
              <Page key={`page_${previewIndex}`} pageNumber={previewIndex} />
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
      )}
    </Flex>
  );
};

export default PreviewModal;
