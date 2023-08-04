import React from "react";
import { useState } from "react";

import { Flex, IconButton, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

import { pdfjs, Document, Page } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const Viewer = (props: { src: string }) => {
  const [previewPages, setPreviewPages] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(1);

  const onPreviewDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
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
    <Flex direction={"column"} maxH={"70vh"} gap={"4"}>
      <Flex overflowY={"scroll"}>
        <Document file={props.src} onLoadSuccess={onPreviewDocumentLoadSuccess}>
          <Page key={`page_${previewIndex}`} pageNumber={previewIndex} />
        </Document>
      </Flex>

      <Flex direction={"row"} gap={"4"} align={"center"} justify={"center"} pb={"2"}>
        <IconButton aria-label={"Go back"} onClick={previousPage} icon={<Icon name={"c_left"} />} disabled={previewIndex === 1}/>
        <Text>Page {previewIndex} of {previewPages}</Text>
        <IconButton aria-label={"Go forward"} onClick={nextPage} icon={<Icon name={"c_right"} />} disabled={previewIndex === previewPages} />
      </Flex>
    </Flex>
  );
};

export default Viewer;
