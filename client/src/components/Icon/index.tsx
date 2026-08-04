// React
import React from "react";

// Existing components and icons
import { Icon as ChakraIcon, Flex } from "@chakra-ui/react";
import { BsChevronDoubleLeft, BsChevronDoubleRight, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { SiBox } from "react-icons/si";
import { LuDatabaseZap } from "react-icons/lu";
import { AiOutlineClose } from "react-icons/ai";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import {
  FaArrowUpRightFromSquare,
  FaChartSimple,
  FaCircleQuestion,
  FaLayerGroup,
  FaTable,
  FaChartLine,
  FaBoxArchive,
  FaPaperclip,
  FaBug,
  FaCircleCheck,
  FaCalculator,
  FaCodeCompare,
  FaCircleInfo,
  FaFile,
  FaMagnifyingGlass,
  FaBell,
  FaCirclePlus,
  FaCircleMinus,
  FaClone,
  FaExpand,
  FaTrash,
  FaDownload,
  FaEnvelope,
  FaFilter,
  FaTableCells,
  FaUpload,
  FaCircleXmark,
  FaBuilding,
  FaTableList,
  FaFloppyDisk,
  FaArrowRightToBracket,
  FaUser,
  FaCircleExclamation,
  FaKey,
  FaBolt,
  FaQrcode,
  FaArrowsRotate,
  FaShareNodes,
  FaPenToSquare,
  FaClockRotateLeft,
  FaRotateLeft,
  FaLink,
  FaMobileScreen,
  FaLock,
  FaPowerOff,
  FaCube,
  FaGear,
  FaPrint,
  FaMagnifyingGlassChart,
  FaEye,
  FaEyeSlash,
  FaDatabase,
  FaMagnifyingGlassPlus,
  FaMagnifyingGlassMinus,
  FaBook,
  FaGlobe,
  FaGithub,
  FaSitemap,
  FaChartColumn,
  FaList,
  FaRegCalendar,
  FaT,
  FaArrowRight,
  FaCircleArrowRight,
  FaCircleArrowLeft,
  FaRightLeft,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa6";

// Existing and custom types
import { IconNames } from "@types";
import { IconType } from "react-icons";

// Utility functions and libraries
import _ from "lodash";

// Define the icon set
export const SYSTEM_ICONS: Record<string, IconType> = {
  // Default
  unknown: FaCircleQuestion,

  // Locations
  dashboard: FaChartSimple,
  entity: FaCube,
  project: FaLayerGroup,
  attribute: FaTable,
  template: FaTable,

  // Signal and action icons
  activity: FaChartLine,
  archive: FaBoxArchive,
  attachment: FaPaperclip,
  bug: FaBug,
  check: FaCircleCheck,
  counter: FaCalculator,
  close: AiOutlineClose,
  diff: FaCodeCompare,
  info: FaCircleInfo,
  file: FaFile,
  bell: FaBell,
  add: FaCirclePlus,
  remove: FaCircleMinus,
  copy: FaClone,
  edit: FaPenToSquare,
  expand: FaExpand,
  delete: FaTrash,
  download: FaDownload,
  email: FaEnvelope,
  external: FaArrowUpRightFromSquare,
  filter: FaFilter,
  grid: FaTableCells,
  upload: FaUpload,
  cross: FaCircleXmark,
  institution: FaBuilding,
  list: FaTableList,
  save: FaFloppyDisk,
  logout: FaArrowRightToBracket,
  person: FaUser,
  warning: FaCircleExclamation,
  exclamation: FaCircleExclamation,
  key: FaKey,
  lightning: FaBolt,
  qr: FaQrcode,
  reload: FaArrowsRotate,
  share: FaShareNodes,
  graph: FaSitemap,
  clock: FaClockRotateLeft,
  rewind: FaRotateLeft,
  link: FaLink,
  scan: FaMobileScreen,
  lock: FaLock,
  exit: FaPowerOff,
  settings: FaGear,
  print: FaPrint,
  search: FaMagnifyingGlass,
  search_text: FaMagnifyingGlassChart,
  search_query: LuDatabaseZap,
  visibility_show: FaEye,
  visibility_hide: FaEyeSlash,
  workspace: FaDatabase,
  zoom_in: FaMagnifyingGlassPlus,
  zoom_out: FaMagnifyingGlassMinus,

  // Logos
  l_box: SiBox,
  l_labarchives: FaBook,
  l_globus: FaGlobe,
  l_github: FaGithub,

  // Values
  v_date: FaRegCalendar,
  v_text: FaT,
  v_number: FaChartColumn,
  v_url: FaLink,
  v_select: FaList,

  // Arrows
  a_right: FaArrowRight,
  a_right_fill: FaCircleArrowRight,
  a_left_fill: FaCircleArrowLeft,
  a_both: FaRightLeft,
  a_both_fill: FaCircleMinus,

  // Chevrons
  c_left: BsChevronLeft,
  c_double_left: BsChevronDoubleLeft,
  c_right: BsChevronRight,
  c_double_right: BsChevronDoubleRight,
  c_up: FaChevronUp,
  c_down: FaChevronDown,

  // Sort
  sort: FaSort,
  sort_up: FaSortUp,
  sort_down: FaSortDown,
};

const Icon = (props: {
  name: IconNames;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | [number, number];
  color?: string;
  style?: React.CSSProperties;
}) => {
  // Default to unknown icon type
  let iconComponent = SYSTEM_ICONS["unknown"];

  // Get the corresponding icon
  if (!_.isUndefined(SYSTEM_ICONS[props.name])) {
    iconComponent = SYSTEM_ICONS[props.name];
  }

  // Set the icon color if specified
  const iconColor = !_.isUndefined(props.color) ? props.color : "";

  let returned = <ChakraIcon as={iconComponent} color={iconColor} style={props.style} />;

  // Set the icon sizing if specified
  if (!_.isUndefined(props.size)) {
    switch (props.size) {
      case "xxs":
        returned = <ChakraIcon as={iconComponent} w={"2"} h={"2"} color={iconColor} style={props.style} />;
        break;
      case "xs":
        returned = <ChakraIcon as={iconComponent} w={"3"} h={"3"} color={iconColor} style={props.style} />;
        break;
      case "sm":
        returned = <ChakraIcon as={iconComponent} w={"4"} h={"4"} color={iconColor} style={props.style} />;
        break;
      case "md":
        returned = <ChakraIcon as={iconComponent} w={"6"} h={"6"} color={iconColor} style={props.style} />;
        break;
      case "lg":
        returned = <ChakraIcon as={iconComponent} w={"8"} h={"8"} color={iconColor} style={props.style} />;
        break;
      case "xl":
        returned = <ChakraIcon as={iconComponent} w={"16"} h={"16"} color={iconColor} style={props.style} />;
        break;
      default:
        returned = (
          <ChakraIcon as={iconComponent} w={props.size[0]} h={props.size[1]} color={iconColor} style={props.style} />
        );
    }
  }

  // Return icon with default size
  return (
    <Flex p={"0"} m={"0"} align={"center"} justify={"center"}>
      {returned}
    </Flex>
  );
};

export default Icon;
