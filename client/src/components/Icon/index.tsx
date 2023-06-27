// React
import React from "react";

// Existing components and icons
import { Icon as ChakraIcon } from "@chakra-ui/react";
import {
  BsArrowClockwise,
  BsArrowCounterclockwise,
  BsArrowRight,
  BsBarChartFill,
  BsBellFill,
  BsBoxFill,
  BsCalendarWeekFill,
  BsCheckCircleFill,
  BsChevronDoubleLeft,
  BsChevronDoubleRight,
  BsChevronDown,
  BsChevronLeft,
  BsChevronRight,
  BsChevronUp,
  BsClockHistory,
  BsCloudDownloadFill,
  BsCollectionFill,
  BsDiagram2Fill,
  BsExclamationOctagonFill,
  BsFileCodeFill,
  BsFileTextFill,
  BsFillBookFill,
  BsFillExclamationTriangleFill,
  BsFillFileBinaryFill,
  BsGlobe,
  BsGridFill,
  BsInfoCircleFill,
  BsLightningFill,
  BsLink45Deg,
  BsList,
  BsLockFill,
  BsPencilFill,
  BsPlusCircleFill,
  BsQuestionOctagonFill,
  BsSearch,
  BsTagFill,
  BsTrashFill,
  BsUpcScan,
  BsUpload,
  BsXCircleFill,
} from "react-icons/bs";
import { SiBox } from "react-icons/si";

// Existing and custom types
import { IconNames } from "@types";
import { IconType } from "react-icons";

// Utility functions and libraries
import _ from "lodash";

// Define the icon set
const SYSTEM_ICONS: { [k: string]: IconType } = {
  // Default
  unknown: BsQuestionOctagonFill,

  // Locations
  dashboard: BsBarChartFill,
  entity: BsBoxFill,
  collection: BsGridFill,
  attribute: BsTagFill,

  // Signal and action icons
  activity: BsLightningFill,
  check: BsCheckCircleFill,
  info: BsInfoCircleFill,
  search: BsSearch,
  bell: BsBellFill,
  add: BsPlusCircleFill,
  edit: BsPencilFill,
  delete: BsTrashFill,
  download: BsCloudDownloadFill,
  upload: BsUpload,
  cross: BsXCircleFill,
  list: BsList,
  warning: BsFillExclamationTriangleFill,
  exclamation: BsExclamationOctagonFill,
  reload: BsArrowClockwise,
  graph: BsDiagram2Fill,
  clock: BsClockHistory,
  rewind: BsArrowCounterclockwise,
  link: BsLink45Deg,
  scan: BsUpcScan,
  lock: BsLockFill,

  // Logos
  l_box: SiBox,
  l_labArchives: BsFillBookFill,
  l_globus: BsGlobe,

  // Values
  v_date: BsCalendarWeekFill,
  v_text: BsFileTextFill,
  v_number: BsFillFileBinaryFill,
  v_url: BsFileCodeFill,
  v_select: BsCollectionFill,

  // Arrows
  a_right: BsArrowRight,

  // Chevrons
  c_left: BsChevronLeft,
  c_double_left: BsChevronDoubleLeft,
  c_right: BsChevronRight,
  c_double_right: BsChevronDoubleRight,
  c_up: BsChevronUp,
  c_down: BsChevronDown,
};

const Icon = (props: {
  name: IconNames;
  size?: "sm" | "md" | "lg" | "xl" | [number, number];
  color?: string;
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
      case "sm":
        return (
          <ChakraIcon as={iconComponent} w={"2"} h={"2"} color={iconColor} />
        );
      case "md":
        return (
          <ChakraIcon as={iconComponent} w={"4"} h={"4"} color={iconColor} />
        );
      case "lg":
        return (
          <ChakraIcon as={iconComponent} w={"8"} h={"8"} color={iconColor} />
        );
      case "xl":
        return (
          <ChakraIcon as={iconComponent} w={"16"} h={"16"} color={iconColor} />
        );
      default:
        return (
          <ChakraIcon
            as={iconComponent}
            w={props.size[0]}
            h={props.size[1]}
            color={iconColor}
          />
        );
    }
  }

  // Return icon with default size
  return <ChakraIcon as={iconComponent} color={iconColor} />;
};

export default Icon;
