// React
import React from "react";

// Existing components and icons
import { Icon as ChakraIcon } from "@chakra-ui/react";
import {
  BsArrowClockwise,
  BsArrowRight,
  BsBarChart,
  BsBox,
  BsCalendarWeek,
  BsCheckLg,
  BsChevronDoubleLeft,
  BsChevronDoubleRight,
  BsChevronDown,
  BsChevronLeft,
  BsChevronRight,
  BsChevronUp,
  BsDiagram2,
  BsDownload,
  BsExclamationOctagon,
  BsFillExclamationTriangleFill,
  BsGraphUp,
  BsGrid,
  BsInfoCircle,
  BsLightning,
  BsLink45Deg,
  BsList,
  BsPencilSquare,
  BsPlusLg,
  BsQuestionOctagon,
  BsSearch,
  BsTag,
  BsTextareaT,
  BsTrash,
  BsXLg,
} from "react-icons/bs";

// Existing and custom types
import { IconNames } from "@types";
import { IconType } from "react-icons";

// Utility functions and libraries
import _ from "lodash";

// Define the icon set
const SYSTEM_ICONS: { [k: string]: IconType } = {
  // Default
  unknown: BsQuestionOctagon,

  // Locations
  dashboard: BsBarChart,
  entity: BsBox,
  collection: BsGrid,
  attribute: BsTag,

  // Signal and action icons
  activity: BsLightning,
  check: BsCheckLg,
  info: BsInfoCircle,
  search: BsSearch,
  add: BsPlusLg,
  edit: BsPencilSquare,
  delete: BsTrash,
  download: BsDownload,
  cross: BsXLg,
  list: BsList,
  warning: BsFillExclamationTriangleFill,
  exclamation: BsExclamationOctagon,
  reload: BsArrowClockwise,
  graph: BsDiagram2,

  // Values
  p_date: BsCalendarWeek,
  p_text: BsTextareaT,
  p_number: BsGraphUp,
  p_url: BsLink45Deg,

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
  size?: "sm" | "md" | "lg" | "xl";
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
        return <ChakraIcon as={iconComponent} color={iconColor} />;
    }
  }

  // Return icon with default size
  return <ChakraIcon as={iconComponent} color={iconColor} />;
};

export default Icon;
