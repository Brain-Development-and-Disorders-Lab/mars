// React
import React, { createContext, forwardRef, useContext, useEffect, useMemo } from "react";

// Existing and custom components
import Tooltip from "@components/Tooltip";
import { Box, HStack, IconButton, StackSeparator, defineStyle, type BoxProps, type StackProps } from "@chakra-ui/react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// Icons
import {
  BsTypeBold,
  BsCode,
  BsTypeItalic,
  BsTypeStrikethrough,
  BsTypeH2,
  BsTypeH3,
  BsListUl,
  BsListOl,
  BsQuote,
  BsArrowCounterclockwise,
  BsArrowClockwise,
} from "react-icons/bs";

// Custom types
import { RichTextEditorProps } from "@types";

// Shared editor instance passed via context to avoid prop-drilling through sub-components
const EditorContext = createContext<{ editor: Editor | null } | null>(null);

const useEditorContext = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditorContext must be used within RichTextEditor");
  return ctx;
};

// Chakra-compatible style object applied to the Root Box, targeting ProseMirror's DOM structure
const proseMirrorCss = defineStyle({
  display: "flex",
  flexDirection: "column",
  borderWidth: "1px",
  rounded: "var(--chakra-radii-md)",
  lineHeight: "1.5",
  background: "white",
  "--content-padding-x": "spacing.3",
  "--content-padding-y": "spacing.3",
  "& .ProseMirror": {
    outline: "none",
    flex: "1",
    minHeight: "var(--content-min-height)",
    px: "var(--content-padding-x)",
    py: "var(--content-padding-y)",
    "& p": { fontSize: "var(--chakra-font-sizes-xs)" },
    "& > * + *": { marginTop: "0.75em" },
    "& h2": { fontSize: "var(--chakra-font-sizes-md)", letterSpacing: "-0.01em", lineHeight: "1.1em" },
    "& h3": { fontSize: "var(--chakra-font-sizes-sm)", letterSpacing: "0em", lineHeight: "1.2em" },
    "& h2, h3": { color: "fg", fontWeight: "500" },
    "& code": {
      bg: "bg.muted",
      paddingInline: "0.25em",
      rounded: "sm",
      fontFamily: "mono",
      fontSize: "var(--chakra-font-sizes-xs)",
      borderWidth: "1px",
    },
    "& pre": {
      bg: "gray.900",
      color: "gray.100",
      padding: "4",
      rounded: "lg",
      overflowX: "auto",
      fontSize: "sm",
      lineHeight: "1.6",
      borderWidth: "1px",
      borderColor: "gray.700",
    },
    "& pre code": { bg: "transparent", padding: "0", fontFamily: "mono", color: "inherit", borderWidth: "0" },
    "& blockquote": { borderStartWidth: "4px", borderStartColor: "border", paddingStart: "4" },
    "& ul:not([data-type='taskList'])": {
      fontSize: "var(--chakra-font-sizes-xs)",
      paddingInlineStart: "1.25rem",
      listStyleType: "disc",
    },
    "& ol:not([data-type='taskList'])": {
      fontSize: "var(--chakra-font-sizes-xs)",
      paddingInlineStart: "1.25rem",
      listStyleType: "decimal",
    },
    "& ul ul": { listStyleType: "circle" },
    "& em": { fontStyle: "italic" },
    "& strong": { fontWeight: "bold" },
  },
  // data-disabled is set by Chakra when the disabled prop is passed to Root
  "&[data-disabled] .ProseMirror": { pointerEvents: "none", opacity: 0.5, cursor: "not-allowed" },
});

interface RootProps extends BoxProps {
  editor: Editor | null;
}

/** Provides the editor instance to all sub-components via context */
const Root = forwardRef<HTMLDivElement, RootProps>(function Root({ editor, children, css, ...rest }, ref) {
  const value = useMemo(() => ({ editor }), [editor]);
  return (
    <EditorContext.Provider value={value}>
      <Box ref={ref} css={[proseMirrorCss, css]} {...rest}>
        {children}
      </Box>
    </EditorContext.Provider>
  );
});

/** Horizontal toolbar strip rendered above the editor content area */
const Toolbar = forwardRef<HTMLDivElement, StackProps>(function Toolbar(props, ref) {
  return (
    <HStack
      ref={ref}
      flexWrap={"wrap"}
      separator={<StackSeparator h={"5"} alignSelf={"center"} />}
      bg={"bg"}
      roundedTop={"l2"}
      borderBottomWidth={"1px"}
      py={"1.5"}
      px={"3"}
      {...props}
    />
  );
});

/** Renders the tiptap EditorContent, wired to the editor from context */
const Content = forwardRef<HTMLDivElement, Omit<React.ComponentProps<typeof EditorContent>, "editor">>(
  function Content(props, ref) {
    const { editor } = useEditorContext();
    if (!editor) return null;
    return (
      <EditorContent
        editor={editor}
        {...props}
        innerRef={ref}
        style={{ flex: 1, display: "flex", flexDirection: "column", ...props.style }}
      />
    );
  },
);

/** Groups related toolbar buttons with consistent spacing */
const ControlGroup = forwardRef<HTMLDivElement, StackProps>(function ControlGroup(props, ref) {
  return <HStack ref={ref} gap={"1"} {...props} />;
});

/**
 * A single toolbar button that runs a tiptap command on click.
 * The button highlights when the cursor is inside the relevant mark or node.
 */
const ControlButton = (props: {
  label: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}) => {
  const { editor } = useEditorContext();
  if (!editor) return null;
  return (
    <Tooltip content={props.label}>
      <IconButton
        size={"2xs"}
        aria-label={props.label}
        variant={props.isActive?.(editor) ? "subtle" : "ghost"}
        onClick={() => props.command(editor)}
      >
        {props.icon}
      </IconButton>
    </Tooltip>
  );
};

const Bold = () => (
  <ControlButton
    label={"Bold"}
    icon={<BsTypeBold />}
    command={(e) => e.chain().focus().toggleBold().run()}
    isActive={(e) => e.isActive("bold")}
  />
);
const Italic = () => (
  <ControlButton
    label={"Italic"}
    icon={<BsTypeItalic />}
    command={(e) => e.chain().focus().toggleItalic().run()}
    isActive={(e) => e.isActive("italic")}
  />
);
const Strike = () => (
  <ControlButton
    label={"Strikethrough"}
    icon={<BsTypeStrikethrough />}
    command={(e) => e.chain().focus().toggleStrike().run()}
    isActive={(e) => e.isActive("strike")}
  />
);
const Code = () => (
  <ControlButton
    label={"Code"}
    icon={<BsCode />}
    command={(e) => e.chain().focus().toggleCode().run()}
    isActive={(e) => e.isActive("code")}
  />
);
const H2 = () => (
  <ControlButton
    label={"Heading 2"}
    icon={<BsTypeH2 />}
    command={(e) => e.chain().focus().toggleHeading({ level: 2 }).run()}
    isActive={(e) => e.isActive("heading", { level: 2 })}
  />
);
const H3 = () => (
  <ControlButton
    label={"Heading 3"}
    icon={<BsTypeH3 />}
    command={(e) => e.chain().focus().toggleHeading({ level: 3 }).run()}
    isActive={(e) => e.isActive("heading", { level: 3 })}
  />
);
const BulletList = () => (
  <ControlButton
    label={"Bullet List"}
    icon={<BsListUl />}
    command={(e) => e.chain().focus().toggleBulletList().run()}
    isActive={(e) => e.isActive("bulletList")}
  />
);
const OrderedList = () => (
  <ControlButton
    label={"Ordered List"}
    icon={<BsListOl />}
    command={(e) => e.chain().focus().toggleOrderedList().run()}
    isActive={(e) => e.isActive("orderedList")}
  />
);
const Blockquote = () => (
  <ControlButton
    label={"Blockquote"}
    icon={<BsQuote />}
    command={(e) => e.chain().focus().toggleBlockquote().run()}
    isActive={(e) => e.isActive("blockquote")}
  />
);
const Undo = () => (
  <ControlButton label={"Undo"} icon={<BsArrowCounterclockwise />} command={(e) => e.chain().focus().undo().run()} />
);
const Redo = () => (
  <ControlButton label={"Redo"} icon={<BsArrowClockwise />} command={(e) => e.chain().focus().redo().run()} />
);

/**
 * Tiptap-based rich text editor with an optional formatting toolbar.
 * Controlled via `value` / `onChange`; pass `readOnly` to render without the toolbar
 * and with the editor locked.
 */
const RichTextEditor = (props: RichTextEditorProps) => {
  const { value, onChange, readOnly = false, ...rest } = props;

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !readOnly, // initial value only, kept in sync below
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // Sync externally-controlled content changes (e.g. loading saved data) into the editor
  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    editor.commands.setContent(value);
  }, [value, editor]);

  // useEditor's `editable` option is read once on mount, so prop changes need an explicit sync
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  return (
    <Root editor={editor} css={{ "--content-min-height": "sizes.24" }} w={"100%"} minH={"180px"} {...rest}>
      {!readOnly && (
        <Toolbar padding={"1"}>
          <ControlGroup>
            <Bold />
            <Italic />
            <Strike />
            <Code />
          </ControlGroup>
          <ControlGroup>
            <H2 />
            <H3 />
          </ControlGroup>
          <ControlGroup>
            <BulletList />
            <OrderedList />
            <Blockquote />
          </ControlGroup>
          <ControlGroup>
            <Undo />
            <Redo />
          </ControlGroup>
        </Toolbar>
      )}
      <Content readOnly={readOnly} />
    </Root>
  );
};

export default RichTextEditor;
