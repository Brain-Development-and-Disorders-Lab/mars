// React
import React from "react";

// Existing components and icons
import { Icon as ChakraIcon, Flex } from "@chakra-ui/react";
import {
  BsChevronDoubleLeft,
  BsChevronDoubleRight,
  BsChevronExpand,
  BsChevronLeft,
  BsChevronRight,
} from "react-icons/bs";
import { SiBox } from "react-icons/si";
import { IoCreateOutline } from "react-icons/io5";
import { TbBaselineDensityMedium, TbBaselineDensitySmall } from "react-icons/tb";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import {
  FaArrowRight,
  FaArrowRightToBracket,
  FaArrowsRotate,
  FaBell,
  FaBolt,
  FaBook,
  FaBoxArchive,
  FaChartColumn,
  FaChartLine,
  FaChartSimple,
  FaChevronDown,
  FaChevronUp,
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleInfo,
  FaCirclePlus,
  FaCircleQuestion,
  FaCircleXmark,
  FaClockRotateLeft,
  FaCloud,
  FaCube,
  FaDatabase,
  FaDownload,
  FaExpand,
  FaGear,
  FaGithub,
  FaGlobe,
  FaLayerGroup,
  FaLink,
  FaList,
  FaLock,
  FaMagnifyingGlass,
  FaMagnifyingGlassMinus,
  FaMagnifyingGlassPlus,
  FaMobileScreen,
  FaPaperclip,
  FaPenToSquare,
  FaPowerOff,
  FaPrint,
  FaRegCalendar,
  FaRotateLeft,
  FaServer,
  FaSitemap,
  FaT,
  FaTable,
  FaTableList,
  FaTrash,
  FaUpload,
  FaUser,
} from "react-icons/fa6";

// Existing and custom types
import { IconNames } from "../../../types";
import { IconType } from "react-icons";

// Utility functions and libraries
import _ from "lodash";

// Define the icon set
const SYSTEM_ICONS: Record<string, IconType> = {
  // Default
  unknown: FaCircleQuestion,

  // Locations
  dashboard: FaChartSimple,
  entity: FaCube,
  project: FaLayerGroup,
  attribute: FaTable,

  // Signal and action icons
  activity: FaChartLine,
  archive: FaBoxArchive,
  attachment: FaPaperclip,
  check: FaCircleCheck,
  create: IoCreateOutline,
  info: FaCircleInfo,
  search: FaMagnifyingGlass,
  bell: FaBell,
  add: FaCirclePlus,
  edit: FaPenToSquare,
  delete: FaTrash,
  download: FaDownload,
  upload: FaUpload,
  cross: FaCircleXmark,
  list: FaTableList,
  person: FaUser,
  warning: FaCircleExclamation,
  exclamation: FaCircleExclamation,
  lightning: FaBolt,
  reload: FaArrowsRotate,
  graph: FaSitemap,
  clock: FaClockRotateLeft,
  rewind: FaRotateLeft,
  link: FaLink,
  scan: FaMobileScreen,
  lock: FaLock,
  exit: FaPowerOff,
  settings: FaGear,
  print: FaPrint,
  expand: FaExpand,
  workspace: FaDatabase,
  zoom_in: FaMagnifyingGlassPlus,
  zoom_out: FaMagnifyingGlassMinus,

  // Logos
  l_box: SiBox,
  l_labArchives: FaBook,
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
  b_right: FaArrowRightToBracket,

  // Chevrons
  c_left: BsChevronLeft,
  c_double_left: BsChevronDoubleLeft,
  c_right: BsChevronRight,
  c_double_right: BsChevronDoubleRight,
  c_up: FaChevronUp,
  c_down: FaChevronDown,
  c_expand: BsChevronExpand,

  // Servers
  serv_managed_hosted: FaCloud,
  serv_self_hosted: FaServer,

  // Density
  d_low: TbBaselineDensityMedium,
  d_high: TbBaselineDensitySmall,

  // Sort
  sort: FaSort,
  sort_up: FaSortUp,
  sort_down: FaSortDown,
};

const Icon = (props: {
  name: IconNames;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | [number, number];
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
      case "xs":
        returned = <ChakraIcon as={iconComponent} w={"2"} h={"2"} color={iconColor} style={props.style} />;
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
