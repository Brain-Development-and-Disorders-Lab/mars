import React from "react";
import { useState } from "react";

import { Flex, IconButton, Image, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

import { pdfjs, Document, Page } from "react-pdf";
import _ from "lodash";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

const PreviewModal = (props: { src: string; type: "image" | "document" }) => {
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

  // Image manipulation state
  const minZoom = 10;
  const maxZoom = 200;
  const zoomDelta = 10;
  const [zoomLevel, setZoomLevel] = useState(100);

  const rotateDelta = 90;
  const [rotateLevel, setRotateLevel] = useState(0);

  const increaseZoom = () => {
    if (zoomLevel + zoomDelta <= maxZoom) {
      setZoomLevel(zoomLevel + zoomDelta);
    }
  };

  const decreaseZoom = () => {
    if (zoomLevel - zoomDelta >= minZoom) {
      setZoomLevel(zoomLevel - zoomDelta);
    }
  };

  const rotate = () => {
    if (rotateLevel + rotateDelta >= 360) {
      setRotateLevel(0);
    } else {
      setRotateLevel(rotateLevel + rotateDelta);
    }
  };

  return (
    <Flex>
      {_.isEqual(props.type, "image") && (
        <Flex direction={"column"} gap={"4"} maxH={"70vh"}>
          <Flex overflow={"auto"} h={"100%"}>
            <Image
              src={props.src}
              w={"100%"}
              objectFit={"contain"}
              style={{
                transform: `scale(${zoomLevel / 100})`,
                rotate: `${rotateLevel}deg`,
              }}
            />
          </Flex>

          <Flex
            direction={"row"}
            gap={"4"}
            align={"center"}
            justify={"center"}
            pb={"2"}
          >
            <IconButton
              aria-label={"Zoom out"}
              onClick={decreaseZoom}
              icon={<Icon name={"zoom_out"} />}
              isDisabled={zoomLevel === minZoom}
            />
            <Text>{zoomLevel}%</Text>
            <IconButton
              aria-label={"Zoom in"}
              onClick={increaseZoom}
              icon={<Icon name={"zoom_in"} />}
              isDisabled={zoomLevel === maxZoom}
            />
            <IconButton
              aria-label={"Rotate"}
              onClick={rotate}
              icon={<Icon name={"reload"} />}
            />
          </Flex>
        </Flex>
      )}

      {_.isEqual(props.type, "document") && (
        <Flex direction={"column"} gap={"4"} maxH={"70vh"}>
          <Flex overflowY={"scroll"}>
            <Document
              file={props.src}
              onLoadSuccess={onPreviewDocumentLoadSuccess}
            >
              <Page key={`page_${previewIndex}`} pageNumber={previewIndex} />
            </Document>
          </Flex>

          <Flex
            direction={"row"}
            gap={"4"}
            align={"center"}
            justify={"center"}
            pb={"2"}
          >
            <IconButton
              aria-label={"Go back"}
              onClick={previousPage}
              icon={<Icon name={"c_left"} />}
              isDisabled={previewIndex === 1}
            />
            <Text>
              Page {previewIndex} of {previewPages}
            </Text>
            <IconButton
              aria-label={"Go forward"}
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
