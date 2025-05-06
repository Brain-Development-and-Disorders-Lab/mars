// React
import React from "react";

// Existing components and icons
import { Icon as ChakraIcon } from "@chakra-ui/react";
import {
  BsActivity,
  BsArchiveFill,
  BsArrowCounterclockwise,
  BsArrowRight,
  BsArrowUpRight,
  BsArrowsAngleExpand,
  BsBarChartFill,
  BsBellFill,
  BsBoxArrowRight,
  BsBoxFill,
  BsCalculator,
  BsCalendarWeekFill,
  BsCheckCircleFill,
  BsChevronDoubleLeft,
  BsChevronDoubleRight,
  BsChevronDown,
  BsChevronExpand,
  BsChevronLeft,
  BsChevronRight,
  BsChevronUp,
  BsClockHistory,
  BsCloudDownloadFill,
  BsCollectionFill,
  BsCopy,
  BsDatabaseFill,
  BsDiagram2Fill,
  BsExclamationOctagonFill,
  BsEye,
  BsEyeSlash,
  BsFileCodeFill,
  BsFileTextFill,
  BsFillBookFill,
  BsFillBookmarkFill,
  BsFillCloudUploadFill,
  BsFillExclamationTriangleFill,
  BsFillFileBinaryFill,
  BsFillGearFill,
  BsFillKeyFill,
  BsFillLightningChargeFill,
  BsFillPersonFill,
  BsFloppyFill,
  BsGithub,
  BsGlobe,
  BsInfoCircleFill,
  BsLink45Deg,
  BsList,
  BsLockFill,
  BsPaperclip,
  BsPencilFill,
  BsPlusCircleFill,
  BsPower,
  BsPrinter,
  BsQrCode,
  BsQuestionOctagonFill,
  BsSearch,
  BsShareFill,
  BsTagFill,
  BsTrashFill,
  BsUpcScan,
  BsX,
  BsXCircleFill,
  BsZoomIn,
  BsZoomOut,
} from "react-icons/bs";
import { SiBox } from "react-icons/si";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import {
  TbBaselineDensityMedium,
  TbBaselineDensitySmall,
  TbRefresh,
} from "react-icons/tb";

// Existing and custom types
import { IconNames } from "@types";
import { IconType } from "react-icons";

// Utility functions and libraries
import _ from "lodash";

// Define the icon set
const SYSTEM_ICONS: Record<string, IconType> = {
  // Default
  unknown: BsQuestionOctagonFill,

  // Locations
  dashboard: BsBarChartFill,
  entity: BsBoxFill,
  project: BsFillBookmarkFill,
  attribute: BsTagFill,
  template: BsTagFill,

  // Signal and action icons
  activity: BsActivity,
  archive: BsArchiveFill,
  attachment: BsPaperclip,
  check: BsCheckCircleFill,
  counter: BsCalculator,
  close: BsX,
  info: BsInfoCircleFill,
  search: BsSearch,
  bell: BsBellFill,
  add: BsPlusCircleFill,
  copy: BsCopy,
  edit: BsPencilFill,
  expand: BsArrowsAngleExpand,
  delete: BsTrashFill,
  download: BsCloudDownloadFill,
  upload: BsFillCloudUploadFill,
  cross: BsXCircleFill,
  list: BsList,
  save: BsFloppyFill,
  person: BsFillPersonFill,
  warning: BsFillExclamationTriangleFill,
  exclamation: BsExclamationOctagonFill,
  key: BsFillKeyFill,
  lightning: BsFillLightningChargeFill,
  qr: BsQrCode,
  reload: TbRefresh,
  share: BsShareFill,
  graph: BsDiagram2Fill,
  clock: BsClockHistory,
  rewind: BsArrowCounterclockwise,
  link: BsLink45Deg,
  scan: BsUpcScan,
  lock: BsLockFill,
  exit: BsPower,
  settings: BsFillGearFill,
  print: BsPrinter,
  view: BsArrowUpRight,
  visibility_show: BsEye,
  visibility_hide: BsEyeSlash,
  workspace: BsDatabaseFill,
  zoom_in: BsZoomIn,
  zoom_out: BsZoomOut,

  // Logos
  l_box: SiBox,
  l_labArchives: BsFillBookFill,
  l_globus: BsGlobe,
  l_gitHub: BsGithub,

  // Values
  v_date: BsCalendarWeekFill,
  v_text: BsFileTextFill,
  v_number: BsFillFileBinaryFill,
  v_url: BsFileCodeFill,
  v_select: BsCollectionFill,

  // Arrows
  a_right: BsArrowRight,
  b_right: BsBoxArrowRight,

  // Chevrons
  c_left: BsChevronLeft,
  c_double_left: BsChevronDoubleLeft,
  c_right: BsChevronRight,
  c_double_right: BsChevronDoubleRight,
  c_up: BsChevronUp,
  c_down: BsChevronDown,
  c_expand: BsChevronExpand,

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

  // Set the icon sizing if specified
  if (!_.isUndefined(props.size)) {
    switch (props.size) {
      case "xs":
        return (
          <ChakraIcon
            as={iconComponent}
            w={"2"}
            h={"2"}
            color={iconColor}
            style={props.style}
          />
        );
      case "sm":
        return (
          <ChakraIcon
            as={iconComponent}
            w={"4"}
            h={"4"}
            color={iconColor}
            style={props.style}
          />
        );
      case "md":
        return (
          <ChakraIcon
            as={iconComponent}
            w={"6"}
            h={"6"}
            color={iconColor}
            style={props.style}
          />
        );
      case "lg":
        return (
          <ChakraIcon
            as={iconComponent}
            w={"8"}
            h={"8"}
            color={iconColor}
            style={props.style}
          />
        );
      case "xl":
        return (
          <ChakraIcon
            as={iconComponent}
            w={"16"}
            h={"16"}
            color={iconColor}
            style={props.style}
          />
        );
      default:
        return (
          <ChakraIcon
            as={iconComponent}
            w={props.size[0]}
            h={props.size[1]}
            color={iconColor}
            style={props.style}
          />
        );
    }
  }

  // Return icon with default size
  return (
    <ChakraIcon as={iconComponent} color={iconColor} style={props.style} />
  );
};

export default Icon;
