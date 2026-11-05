// Icon component
export type IconNames =
  // Default
  | "unknown"

  // Locations
  | "dashboard"
  | "entity"
  | "attribute"
  | "project"

  // Signal and action icons
  | "activity"
  | "archive"
  | "attachment"
  | "check"
  | "create"
  | "info"
  | "search"
  | "bell"
  | "add"
  | "edit"
  | "delete"
  | "download"
  | "upload"
  | "cross"
  | "list"
  | "menu"
  | "book"
  | "rocket"
  | "quote"
  | "shield"
  | "person"
  | "warning"
  | "exclamation"
  | "lightning"
  | "reload"
  | "graph"
  | "clock"
  | "rewind"
  | "link"
  | "scan"
  | "lock"
  | "exit"
  | "settings"
  | "print"
  | "expand"
  | "workspace"
  | "zoom_in"
  | "zoom_out"

  // Logos
  | "l_box"
  | "l_labArchives"
  | "l_globus"
  | "l_github"

  // Values
  | "v_date"
  | "v_text"
  | "v_number"
  | "v_url"
  | "v_select"

  // Arrows
  | "a_right"
  | "b_right"

  // Chevrons
  | "c_left"
  | "c_double_left"
  | "c_right"
  | "c_double_right"
  | "c_up"
  | "c_down"
  | "c_expand"

  // Servers
  | "serv_managed_hosted"
  | "serv_self_hosted"

  // Density
  | "d_low"
  | "d_high"

  // Sorting
  | "sort"
  | "sort_up"
  | "sort_down";

// Link shown with a label and destination
export type LinkTarget = {
  label: string;
  href: string;
};

// FeatureShowcase component, a feature description beside a screenshot
export type FeatureShowcaseProps = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  link: LinkTarget;
  reverse?: boolean;
};

// PathCard component, one way to start using Metadatify with a single action
export type PathCardProps = {
  icon: IconNames;
  title: string;
  description: string;
  action: LinkTarget;
  primary?: boolean;
  secondary?: LinkTarget;
};

// ResourceLink component, a compact link to a documentation page or resource
export type ResourceLinkProps = {
  icon: IconNames;
  title: string;
  description: string;
  href: string;
  isExternal?: boolean;
};
