import React, { useEffect, useRef, useState } from "react";
import { Flex, IconButton, Image, Spacer, Spinner, Text, Dialog, CloseButton, Button } from "@chakra-ui/react";
import Icon from "@components/Icon";

import { DialogPreviewProps } from "@types";

// PDF preview
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// DNA sequence preview
import { SeqViz } from "seqviz";
import seqparse from "seqparse";

// Zoom and pan controls
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

// GraphQL
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Variables
import { STYLES, STATIC_URL } from "@variables";

// Utility functions and libraries
import _ from "lodash";
import { getPublicWorkspaceUrl } from "@lib/util";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const IMAGE_TYPES = ["png", "jpg", "jpeg"];

/** Zoom controls that operate via the TransformWrapper ref, so they can live outside the TransformWrapper context. */
const ZoomControls = ({ transformRef }: { transformRef: React.RefObject<ReactZoomPanPinchRef | null> }) => (
  <Flex direction={"row"} gap={"2"} align={"center"} justify={"center"} flexShrink={0} pt={"2"}>
    <IconButton size={"xs"} variant={"subtle"} aria-label={"Zoom out"} onClick={() => transformRef.current?.zoomOut()}>
      <Icon name={"zoom_out"} size={"xs"} />
    </IconButton>
    <Button size={"xs"} variant={"subtle"} aria-label={"Reset"} onClick={() => transformRef.current?.resetTransform()}>
      Reset
      <Icon name={"reload"} size={"xs"} />
    </Button>
    <IconButton size={"xs"} variant={"subtle"} aria-label={"Zoom in"} onClick={() => transformRef.current?.zoomIn()}>
      <Icon name={"zoom_in"} size={"xs"} />
    </IconButton>
  </Flex>
);

/**
 * Renders a PDF page using react-pdf with page navigation below.
 * The page scales to the container width; vertical overflow scrolls within the content area
 * so the navigation controls are always visible at the base.
 */
const DocumentPreview = (props: {
  previewSource: string;
  previewIndex: number;
  previewPages: number;
  onLoadSuccess: (args: { numPages: number }) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll back to the top of the page when navigating
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [props.previewIndex]);

  return (
    <Flex direction={"column"} flex={"1"} minH={0}>
      <Flex
        ref={containerRef}
        flex={"1"}
        overflowY={"auto"}
        minH={"100px"}
        rounded={"md"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        justify={"center"}
        align={"center"}
        fontSize={"sm"}
        fontWeight={"semibold"}
        color={STYLES.font.secondaryHeader.color}
      >
        <Document file={props.previewSource} onLoadSuccess={props.onLoadSuccess} loading={"Loading Page..."}>
          <Page pageNumber={props.previewIndex} width={containerWidth} />
        </Document>
      </Flex>
      <Flex direction={"row"} gap={"2"} align={"center"} justify={"center"} flexShrink={0} pt={"2"}>
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
        <Flex direction={"row"} gap={"1"} align={"center"} justify={"center"}>
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
  );
};

/**
 * Renders an image with zoom/pan controls. The image is contained within the
 * dialog bounds initially; zoom/pan allows inspecting at higher magnification.
 */
const ImagePreview = (props: { previewSource: string }) => {
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

  const handleImageLoad = () => {
    if (transformRef.current) {
      transformRef.current.resetTransform(0);
    }
  };

  return (
    <Flex direction={"column"} flex={"1"} minH={0}>
      {/* TransformWrapper is scoped to the content cell so it does not disrupt the flex height chain */}
      <Flex
        flex={"1"}
        overflow={"hidden"}
        position={"relative"}
        minH={0}
        rounded={"md"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        boxSizing={"border-box"}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          limitToBounds={false}
          centerOnInit
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            contentStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              src={props.previewSource}
              maxW={"100%"}
              maxH={"100%"}
              objectFit={"contain"}
              onLoad={handleImageLoad}
            />
          </TransformComponent>
        </TransformWrapper>
      </Flex>
      <ZoomControls transformRef={transformRef} />
    </Flex>
  );
};

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

/** Fetches and parses a sequence file (FASTA, GenBank, SnapGene) then renders it with SeqViz. */
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

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const fileExtension = name.split(".").pop()?.toLowerCase();
        const isSnapGene = fileExtension === "dna";

        let text: string;

        if (isSnapGene) {
          // SnapGene files may have binary headers, fall back to arrayBuffer if text() fails
          try {
            text = await response.text();
          } catch {
            const arrayBuffer = await response.arrayBuffer();
            text = new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer);
          }
        } else {
          text = await response.text();
        }

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
          setError(err instanceof Error ? err.message : "Failed to load sequence");
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
      <Flex direction={"column"} h={"100%"} flex={"1"} minH={0} justify={"center"} align={"center"}>
        <Spinner color={STYLES.font.secondaryHeader.color} />
        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} mt={"2"}>
          Loading Sequence...
        </Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex direction={"column"} h={"100%"} flex={"1"} minH={0} justify={"center"} align={"center"} gap={"2"}>
        <Text color={"status.danger.default"} fontWeight={"semibold"} fontSize={"sm"}>
          Error displaying Sequence
        </Text>
        <Text fontSize={"xs"} color={"text.subtle"}>
          {error}
        </Text>
      </Flex>
    );
  }

  if (!sequenceData) {
    return (
      <Flex direction={"column"} h={"100%"} flex={"1"} minH={0} justify={"center"} align={"center"}>
        <Text fontSize={"xs"} color={"text.subtle"}>
          No Sequence data available
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      id={"seqviz_container"}
      direction={"column"}
      h={"100%"}
      flex={"1"}
      minH={0}
      rounded={"md"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
      overflow={"hidden"}
    >
      <SeqViz name={name} seq={sequenceData.seq} annotations={sequenceData.annotations} />
    </Flex>
  );
};

/** Manages file URL resolution and preview type detection for a given attachment. */
const PreviewContent = (props: {
  attachment: DialogPreviewProps["attachment"];
  workspace?: DialogPreviewProps["workspace"];
  isPublic?: DialogPreviewProps["isPublic"];
}) => {
  const [previewPages, setPreviewPages] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(1);
  const [previewType, setPreviewType] = useState<"document" | "image" | "sequence" | null>(null);
  const [previewSource, setPreviewSource] = useState("");

  const GET_FILE_URL = gql`
    query GetFileURL($_id: String) {
      downloadFile(_id: $_id)
    }
  `;
  const { data, loading, error } = useQuery<{ downloadFile: string }>(GET_FILE_URL, {
    variables: {
      _id: props.attachment._id,
    },
    skip: !props.attachment._id,
    ...(props.isPublic && {
      context: {
        uri: getPublicWorkspaceUrl(props.workspace ?? ""),
      },
    }),
  });

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

  // Reset state when attachment changes
  useEffect(() => {
    setPreviewType(null);
    setPreviewSource("");
    setPreviewIndex(1);
    setPreviewPages(0);
  }, [props.attachment._id]);

  useEffect(() => {
    if (data?.downloadFile) {
      setPreviewSource(`${STATIC_URL}${data.downloadFile}`);

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

  const renderPreview = () => {
    if (!props.attachment || !props.attachment._id) {
      return (
        <Flex direction={"column"} align={"center"} justify={"center"} minH={"400px"} gap={"1"} w={"100%"}>
          <Text fontSize={"sm"} color={"text.faint"} fontWeight={"semibold"}>
            Invalid attachment
          </Text>
        </Flex>
      );
    }

    if (loading || (!error && (!previewType || !previewSource))) {
      return (
        <Flex
          direction={"column"}
          align={"center"}
          justify={"center"}
          h={"100%"}
          flex={"1"}
          minH={"400px"}
          gap={"1"}
          w={"100%"}
        >
          <Text fontSize={"sm"} color={STYLES.font.secondaryHeader.color} fontWeight={"semibold"}>
            Preparing Preview
          </Text>
          <Spinner color={STYLES.font.secondaryHeader.color} />
        </Flex>
      );
    }

    return (
      <Flex direction={"column"} w={"100%"} h={"100%"} flex={"1"} minH={0} gap={"1"}>
        <Flex direction={"row"} gap={"1"} align={"center"} flexShrink={0} mx={"0.5"}>
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            Name:
          </Text>
          <Text fontSize={"xs"}>{_.truncate(props.attachment.name, { length: 32 })}</Text>
          <Spacer />
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            Type:
          </Text>
          <Text fontSize={"xs"}>{previewType}</Text>
        </Flex>

        {!error && previewType === "document" && (
          <DocumentPreview
            previewSource={previewSource}
            previewIndex={previewIndex}
            previewPages={previewPages}
            onLoadSuccess={onPreviewDocumentLoadSuccess}
            onPreviousPage={previousPage}
            onNextPage={nextPage}
          />
        )}

        {!error && previewType === "image" && <ImagePreview previewSource={previewSource} />}

        {!error && previewType === "sequence" && (
          <SequencePreview name={props.attachment.name} fileUrl={previewSource} />
        )}

        {error && (
          <Flex
            flex={"1"}
            h={"100%"}
            minH={"400px"}
            rounded={"md"}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            align={"center"}
            justify={"center"}
          >
            <Text color={"text.faint"} fontWeight={"semibold"}>
              Unable to load preview
            </Text>
          </Flex>
        )}
      </Flex>
    );
  };

  return (
    <Flex w={"100%"} h={"100%"} flex={"1"} minH={0} direction={"column"}>
      {renderPreview()}
    </Flex>
  );
};

/**
 * Dialog for previewing attachments. Supports PDF documents, images (PNG, JPG),
 * and DNA sequence files. All content scales to fit the dialog rather than relying
 * on fixed screen-size breakpoints.
 */
const DialogPreview = (props: DialogPreviewProps) => {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <IconButton aria-label={"Preview attachment"} variant={"subtle"} size={"2xs"} colorPalette={"gray"}>
      <Icon name={"expand"} size={"xs"} />
    </IconButton>
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => setOpen(event.open)}
      placement={"center"}
      size={"lg"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Trigger asChild>{props.trigger || defaultTrigger}</Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content gap={"0"} display={"flex"} flexDirection={"column"} h={"90vh"}>
          <Dialog.Header
            p={"2"}
            fontWeight={"semibold"}
            fontSize={"xs"}
            bg={"surface.emphasized"}
            color={"text.default"}
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
              <CloseButton size={"2xs"} top={"6px"} onClick={() => setOpen(false)} />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body p={"2"} display={"flex"} flexDirection={"column"} flex={"1"} overflow={"hidden"} minH={0}>
            <PreviewContent attachment={props.attachment} workspace={props.workspace} isPublic={props.isPublic} />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default DialogPreview;
