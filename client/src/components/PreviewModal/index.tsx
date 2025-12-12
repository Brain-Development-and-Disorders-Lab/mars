import React, { useEffect } from "react";
import { useState } from "react";
import {
  Flex,
  IconButton,
  Image,
  Spacer,
  Spinner,
  Text,
  Dialog,
  CloseButton,
  Button,
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
import seqparse from "seqparse";

// Zoom and pan import for image previews
import {
  TransformComponent,
  TransformWrapper,
  useControls,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

// GraphQL
import { gql, useQuery } from "@apollo/client";
import { STATIC_URL } from "src/variables";

// Utility functions
import _ from "lodash";

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
      gap={"1"}
      align={"center"}
      justify={"center"}
      flexShrink={0}
      py={"1"}
    >
      <IconButton
        size={"xs"}
        variant={"subtle"}
        aria-label={"Zoom out"}
        onClick={() => zoomOut()}
      >
        <Icon name={"zoom_out"} size={"xs"} />
      </IconButton>
      <Button
        size={"xs"}
        variant={"subtle"}
        aria-label={"Reset"}
        onClick={() => resetTransform()}
      >
        Reset
        <Icon name={"reload"} size={"xs"} />
      </Button>
      <IconButton
        size={"xs"}
        variant={"subtle"}
        aria-label={"Zoom in"}
        onClick={() => zoomIn()}
      >
        <Icon name={"zoom_in"} size={"xs"} />
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

// Document preview component
const DocumentPreview = (props: {
  previewSource: string;
  previewIndex: number;
  previewPages: number;
  onLoadSuccess: (args: { numPages: number }) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) => {
  const transformRef = React.useRef<ReactZoomPanPinchRef | null>(null);

  const handleDocumentLoad = (args: { numPages: number }) => {
    props.onLoadSuccess(args);
    // Reset transform after document loads
    if (transformRef.current) {
      transformRef.current.resetTransform(0);
    }
  };

  return (
    <Flex direction={"column"} h={"100%"} flex={"1"} minH={0}>
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        limitToBounds={false}
        centerOnInit
      >
        <Flex direction={"column"} h={"100%"} flex={"1"} minH={0}>
          <Flex
            flex={"1"}
            overflow={"hidden"}
            position={"relative"}
            minH={0}
            rounded={"md"}
            border={"2px solid"}
            borderColor={"gray.300"}
            boxSizing={"border-box"}
          >
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Document
                file={props.previewSource}
                onLoadSuccess={handleDocumentLoad}
              >
                <Page
                  key={`page_${props.previewIndex}`}
                  pageNumber={props.previewIndex}
                />
              </Document>
            </TransformComponent>
          </Flex>
          <Flex
            direction={"row"}
            gap={"2"}
            align={"center"}
            justify={"center"}
            w={"100%"}
            flexShrink={0}
          >
            <ImageControls />
            <Flex
              direction={"row"}
              gap={"2"}
              align={"center"}
              justify={"center"}
              flexShrink={0}
            >
              <IconButton
                aria-label={"Previous page"}
                size={"xs"}
                colorPalette={"blue"}
                rounded={"md"}
                onClick={props.onPreviousPage}
                disabled={props.previewIndex === 1}
              >
                <Icon name={"c_left"} size={"xs"} />
              </IconButton>
              <Flex
                direction={"row"}
                gap={"1"}
                align={"center"}
                justify={"center"}
                flexShrink={0}
              >
                <Text fontSize={"xs"}>Page</Text>
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {props.previewIndex}
                </Text>
                <Text fontSize={"xs"}>of</Text>
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {props.previewPages}
                </Text>
              </Flex>
              <IconButton
                aria-label={"Next page"}
                size={"xs"}
                colorPalette={"blue"}
                rounded={"md"}
                onClick={props.onNextPage}
                disabled={props.previewIndex === props.previewPages}
              >
                <Icon name={"c_right"} size={"xs"} />
              </IconButton>
            </Flex>
          </Flex>
        </Flex>
      </TransformWrapper>
    </Flex>
  );
};

// Image preview component
const ImagePreview = (props: { previewSource: string }) => {
  const transformRef = React.useRef<ReactZoomPanPinchRef | null>(null);

  const handleImageLoad = () => {
    // Reset transform after image loads
    if (transformRef.current) {
      transformRef.current.resetTransform(0);
    }
  };

  return (
    <Flex direction={"column"} h={"100%"} flex={"1"} minH={0}>
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        limitToBounds={false}
        centerOnInit
      >
        <Flex
          flex={"1"}
          overflow={"hidden"}
          position={"relative"}
          minH={0}
          rounded={"md"}
          border={"2px solid"}
          borderColor={"gray.300"}
          boxSizing={"border-box"}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              src={props.previewSource}
              maxW={"none"}
              maxH={"none"}
              objectFit={"contain"}
              onLoad={handleImageLoad}
            />
          </TransformComponent>
        </Flex>
        <ImageControls />
      </TransformWrapper>
    </Flex>
  );
};

// Sequence preview component
interface SequencePreviewProps {
  name: string;
  fileUrl: string;
}

interface ParsedSequence {
  seq: string;
  annotations: Array<{
    name: string;
    start: number;
    end: number;
    direction?: number;
    color?: string;
  }>;
}

const SequencePreview = ({ name, fileUrl }: SequencePreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sequenceData, setSequenceData] = useState<ParsedSequence | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadSequence = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the file
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        // Check file extension to determine if it's a SnapGene .dna file
        const fileExtension = name.split(".").pop()?.toLowerCase();
        const isSnapGene = fileExtension === "dna";

        let text: string;

        if (isSnapGene) {
          // For SnapGene .dna files, try to read as text first
          // SnapGene files may have binary headers but contain text data
          try {
            text = await response.text();
          } catch {
            // If text() fails, try arrayBuffer approach
            const arrayBuffer = await response.arrayBuffer();
            text = new TextDecoder("utf-8", { fatal: false }).decode(
              arrayBuffer,
            );
          }
        } else {
          // For text-based files, read as text
          text = await response.text();
        }

        // Try to parse with seqparse (works for FASTA, GenBank, and some SnapGene files)
        let parsed: {
          seq?: string;
          annotations?: ParsedSequence["annotations"];
        } | null = null;
        try {
          parsed = await seqparse(text);
        } catch {
          // seqparse failed, will treat as raw sequence below
        }

        if (parsed && typeof parsed === "object" && parsed.seq) {
          // Successfully parsed with seqparse
          const normalizedSeq = parsed.seq
            .toUpperCase()
            .replace(/\s+/g, "")
            .replace(/[^ATGCUN]/gi, "");

          if (normalizedSeq.length === 0) {
            throw new Error("No valid sequence characters found after parsing");
          }

          if (!isCancelled) {
            setSequenceData({
              seq: normalizedSeq,
              annotations: parsed.annotations || [],
            });
          }
        } else {
          // Parsing failed or returned invalid data, treat as raw sequence
          // Remove common file format headers and extract sequence
          const normalizedSeq = text
            .toUpperCase()
            .replace(/\s+/g, "")
            .replace(/[^ATGCUN]/gi, "");

          if (normalizedSeq.length === 0) {
            throw new Error(
              isSnapGene
                ? "Unable to parse SnapGene file. The file may be corrupted or in an unsupported format."
                : "No valid sequence characters found",
            );
          }

          if (!isCancelled) {
            setSequenceData({
              seq: normalizedSeq,
              annotations: [],
            });
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load sequence",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadSequence();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl, name]);

  if (loading) {
    return (
      <Flex
        direction={"column"}
        h={"100%"}
        flex={"1"}
        minH={0}
        justify={"center"}
        align={"center"}
      >
        <Spinner color={"gray.600"} />
        <Text fontSize={"xs"} color={"gray.600"} mt={"2"}>
          Loading sequence...
        </Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        direction={"column"}
        h={"100%"}
        flex={"1"}
        minH={0}
        justify={"center"}
        align={"center"}
        gap={"2"}
      >
        <Text color={"red.500"} fontWeight={"semibold"} fontSize={"sm"}>
          Error loading sequence
        </Text>
        <Text fontSize={"xs"} color={"gray.500"}>
          {error}
        </Text>
      </Flex>
    );
  }

  if (!sequenceData) {
    return (
      <Flex
        direction={"column"}
        h={"100%"}
        flex={"1"}
        minH={0}
        justify={"center"}
        align={"center"}
      >
        <Text fontSize={"xs"} color={"gray.500"}>
          No sequence data available
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      direction={"column"}
      h={"100%"}
      flex={"1"}
      minH={0}
      rounded={"md"}
      border={"2px solid"}
      borderColor={"gray.300"}
      overflow={"hidden"}
      position={"relative"}
      boxSizing={"border-box"}
    >
      {sequenceData && (
        <SeqViz
          name={name}
          seq={sequenceData.seq}
          annotations={sequenceData.annotations}
        />
      )}
    </Flex>
  );
};

const PreviewContent = (props: {
  attachment: PreviewModalProps["attachment"];
}) => {
  // Page view state
  const [previewPages, setPreviewPages] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(1);

  // Preview data state
  const [previewType, setPreviewType] = useState<
    "document" | "image" | "sequence" | null
  >(null);
  const [previewSource, setPreviewSource] = useState("");

  const [previewSupport, setPreviewSupport] = useState<PreviewSupport>({
    document: getWindowDimensions().width > MIN_WIDTH_DOCUMENT,
    image: getWindowDimensions().width > MIN_WIDTH_IMAGE,
    sequence: getWindowDimensions().width > MIN_WIDTH_SEQUENCE,
  });

  const GET_FILE_URL = gql`
    query GetFileURL($_id: String) {
      downloadFile(_id: $_id)
    }
  `;
  const { data, loading, error } = useQuery(GET_FILE_URL, {
    variables: {
      _id: props.attachment._id,
    },
    skip: !props.attachment._id,
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

  // Reset state when attachment changes
  useEffect(() => {
    setPreviewType(null);
    setPreviewSource("");
    setPreviewIndex(1);
    setPreviewPages(0);
  }, [props.attachment._id]);

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
      } else {
        setPreviewType(null);
      }
    }
  }, [data, props.attachment.name]);

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

  // Render preview based on state
  const renderPreview = () => {
    // Validate attachment has required fields
    if (!props.attachment || !props.attachment._id) {
      return (
        <Flex
          direction={"column"}
          align={"center"}
          justify={"center"}
          minH={"400px"}
          gap={"1"}
          w={"100%"}
        >
          <Text fontSize={"sm"} color={"gray.400"} fontWeight={"semibold"}>
            Invalid attachment
          </Text>
        </Flex>
      );
    }

    // Show loading if query is loading or we don't have preview data yet
    if (loading || !previewType || !previewSource) {
      return (
        <Flex
          direction={"column"}
          align={"center"}
          justify={"center"}
          minH={"400px"}
          gap={"1"}
          w={"100%"}
        >
          <Text fontSize={"sm"} color={"gray.600"} fontWeight={"semibold"}>
            Preparing Preview
          </Text>
          <Spinner color={"gray.600"} />
        </Flex>
      );
    }

    return (
      <Flex direction={"column"} w={"100%"} h={"100%"} flex={"1"} gap={"1"}>
        <Flex
          direction={"row"}
          gap={"1"}
          align={"center"}
          flexShrink={0}
          mx={"0.5"}
        >
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            Name:
          </Text>
          <Text fontSize={"xs"}>
            {_.truncate(props.attachment.name, { length: 32 })}
          </Text>
          <Spacer />
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            Type:
          </Text>
          <Text fontSize={"xs"}>{previewType}</Text>
        </Flex>

        {previewType === "document" &&
          (previewSupport.document ? (
            <DocumentPreview
              previewSource={previewSource}
              previewIndex={previewIndex}
              previewPages={previewPages}
              onLoadSuccess={onPreviewDocumentLoadSuccess}
              onPreviousPage={previousPage}
              onNextPage={nextPage}
            />
          ) : (
            <UnsupportedPreview />
          ))}

        {previewType === "image" &&
          (previewSupport.image ? (
            <ImagePreview previewSource={previewSource} />
          ) : (
            <UnsupportedPreview />
          ))}

        {previewType === "sequence" &&
          (previewSupport.sequence ? (
            <SequencePreview
              name={props.attachment.name}
              fileUrl={previewSource}
            />
          ) : (
            <UnsupportedPreview />
          ))}

        {/* Show error if we have an error and no data after loading completes */}
        {error && !loading && !data && (
          <Flex
            minH={"400px"}
            rounded={"md"}
            border={"2px"}
            borderColor={"gray.300"}
            align={"center"}
            justify={"center"}
          >
            <Text color={"gray.400"} fontWeight={"semibold"}>
              Unable to load preview
            </Text>
          </Flex>
        )}
      </Flex>
    );
  };

  return (
    <Flex w={"100%"} h={"100%"} flex={"1"} direction={"column"}>
      {renderPreview()}
    </Flex>
  );
};

const PreviewModal = (props: PreviewModalProps) => {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <IconButton
      aria-label={"Preview attachment"}
      variant={"subtle"}
      size={"2xs"}
      colorPalette={"gray"}
    >
      <Icon name={"expand"} size={"xs"} />
    </IconButton>
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => setOpen(event.open)}
      placement={"center"}
      size={"cover"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Trigger asChild>{props.trigger || defaultTrigger}</Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          gap={"0"}
          display={"flex"}
          flexDirection={"column"}
          maxH={"90vh"}
        >
          <Dialog.Header
            p={"2"}
            fontWeight={"semibold"}
            fontSize={"xs"}
            bg={"blue.300"}
            roundedTop={"md"}
            flexShrink={0}
          >
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"attachment"} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                Attachment Preview
              </Text>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size={"2xs"}
                top={"6px"}
                onClick={() => setOpen(false)}
              />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body
            p={"1"}
            display={"flex"}
            flexDirection={"column"}
            flex={"1"}
            overflow={"hidden"}
            minH={0}
          >
            <PreviewContent attachment={props.attachment} />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default PreviewModal;
