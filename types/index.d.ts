// Request types to the server
declare enum Requests {
  POST,
  GET,
  DELETE,
}
export type RequestMethod = keyof typeof Requests;

// Utility type to standardize server response objects
export type ServerResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ScannerStatus = "disconnected" | "connected" | "error";

export namespace State.Entity {
  type Start = {
    location: "none" | "start" | "associations" | "attributes";
    name: string;
    created: string;
    owner: string;
    description: string;
  };

  type Associations = Start & {
    projects: string[];
    associations: {
      origins: IGenericItem[];
      products: IGenericItem[];
    };
  };

  type Attributes = Associations & {
    attributes: IAttribute[];
  };
}

export namespace State.Project {
  type Start = {
    location: "none" | "start";
    name: string;
    created: Date;
    owner: string;
    description: string;
  };
}

// Attributes
// Generic Attribute interface containing required Values
export type IAttribute = {
  name: string;
  description: string;
  values: IValue<any>[];
  archived: boolean;
  owner?: string;
};

// Database model of Attribute, including assigned ID
export type AttributeModel = IAttribute & {
  _id: string;
};

export type AttributeCardActions = {
  showRemove?: boolean;
  onUpdate?: (data: AttributeCardProps) => void;
  onRemove?: (id: string) => void;
};

export type AttributeCardProps = IAttribute &
  AttributeCardActions & {
    _id: string;
    restrictDataValues: boolean;
    permittedDataValues?: string[];
  };

export type AttributeGroupProps = AttributeCardActions & {
  attributes: AttributeModel[];
};

export type AttributeViewButtonProps = {
  attribute: AttributeModel;
  editing?: boolean;
  removeCallback?: () => void;
  doneCallback?: (updated: AttributeModel) => void;
  cancelCallback?: () => void;
};

// Values
export type IValue<D> = {
  _id: string;
  name: string;
  type: "number" | "text" | "url" | "date" | "entity" | "select";
  data: D;
  disabled?: boolean;
  showRemove?: boolean;
  onRemove?: (id: string) => void;
  onUpdate?: (data: D) => void;
};

// "Linky" component props
export type LinkyProps = {
  type: "entities" | "attributes" | "projects";
  id: string;
  fallback?: string;
  color?: string;
  justify?: string;
  size?: string;
  truncate?: boolean | number;
};

// "Actor" component props
export type ActorProps = {
  orcid: string;
  fallback: string;
};

// Project types
export type IProject = {
  name: string;
  archived: boolean;
  created: string;
  timestamp?: string;
  owner: string;
  collaborators?: string[];
  description: string;
  shared: string[];
  entities: string[];
  history?: ProjectHistory[];
};

export type ProjectModel = IProject & {
  _id: string;
};

export type ProjectHistory = {
  timestamp: string;
  name: string;
  description: string;
  entities: string[];
};

// Utility type used across other types, typically in a list
export type IGenericItem = {
  _id: string;
  name: string;
};

// Workspace types
export type IWorkspace = {
  name: string;
  description: string;
  owner: string;
  collaborators: string[];
  entities: string[];
  projects: string[];
  attributes: string[];
  activity: string[];
};

export type WorkspaceModel = IWorkspace & {
  _id: string;
};

// Entity types
export type IEntity = {
  name: string;
  archived: boolean;
  locked: boolean;
  created: string;
  timestamp?: string;
  owner: string;
  description: string;
  projects: string[];
  associations: {
    origins: IGenericItem[];
    products: IGenericItem[];
  };
  attributes: AttributeModel[];
  attachments: IGenericItem[];
  history?: EntityHistory[];
};

export type EntityModel = IEntity & {
  _id: string;
};

export type EntityNode = IGenericItem & {
  associations: {
    origins: IGenericItem[];
    products: IGenericItem[];
  };
};

export type EntityHistory = {
  timestamp: string;
  archived: boolean;
  name: string;
  owner: string;
  description: string;
  projects: string[];
  associations: {
    origins: IGenericItem[];
    products: IGenericItem[];
  };
  attributes: AttributeModel[];
  attachments: IGenericItem[];
};

export type EntityExport = {
  // Specific details
  name: string;
  created: string;
  owner: string;
  description: string;
  projects: string;
  origins: string;
  products: string;
};

export type EntityImport = {
  // Specific details
  name: string;
  created: string;
  owner: string;
  description: string;
  projects: string;
  origins: IGenericItem[];
  products: IGenericItem[];
  attributes: AttributeModel[];
};

// Attachment data
export type AttachmentData = {
  _id: string;
  length: number;
  chunkSize: number;
  uploadDate: string;
  filename: string;
};

// Activity types
export type IActivity = {
  timestamp: Date;
  type: "create" | "update" | "delete" | "archived";
  details: string;
  target: {
    type: "entities" | "projects" | "attributes";
    _id: string;
    name: string;
  };
  actor?: string;
};

export type ActivityModel = IActivity & {
  _id: string;
};

// Content component
export type ContentProps = {
  children: React.ReactElement | React.ReactElement[];
  isError?: boolean;
  isLoaded?: boolean;
};

// Page component
export type PageProps = {
  children: React.ReactElement | React.ReactElement[];
};

// Login component
export type LoginProps = {
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
};

// Dialog component
export type DialogProps = {
  // Ref for placement
  dialogRef: React.MutableRefObject<any>;
  header: string;
  children: React.ReactElement | React.ReactElement[];
  // Dialog actions and state
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  // Left and right buttons
  leftButtonLabel?: string;
  leftButtonColor?: string;
  leftButtonAction?: () => void;
  rightButtonLabel?: string;
  rightButtonColor?: string;
  rightButtonAction?: () => void;
};

// DataTable component
export type DataTableProps = {
  columns: any[];
  visibleColumns: Record<string, boolean>;
  data: any[];
  setData?: (value: React.SetStateAction<any[]>) => void;
  viewOnly?: boolean;

  // Interface visibility
  showPagination?: boolean;
  showSelection?: boolean;
  actions?: DataTableAction[];
};

export type DataTableAction = {
  label: string; // Action label
  icon: IconNames; // Icon
  action: (table: any, rows: any) => void; // Action function acting on the provided the table and rows
  alwaysEnabled?: boolean; // Enable the action at all times, regardless if any rows selected
};

// PreviewModal props
export type PreviewModalProps = {
  attachment: IGenericItem;
};

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
  | "person"
  | "warning"
  | "exclamation"
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
  | "view"
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

  // Sorting
  | "sort"
  | "sort_up"
  | "sort_down";

// SearchQueryBuilder props
export type SearchQueryBuilderProps = {
  setHasSearched: React.Dispatch<React.SetStateAction<boolean>>;
  setResults: React.Dispatch<Partial<EntityModel>[]>;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

// SearchSelect props
export type SearchSelectProps = {
  value: IGenericItem;
  placeholder?: string;
  onChange?: (value: any) => void;
  isDisabled?: boolean;
};

// Response message types
export type ResponseMessage = {
  success: boolean;
  message: string;
};

// Authentication types
export type IAuth = {
  name: string; // User name
  orcid: string; // ORCiD value
  token: string; // ORCiD token
  workspace: string; // Identifier for active Workspace
};

export type Token = IAuth & {
  access_token: string;
  token_type: string;
  refesh_token: string;
  expires_in: number;
  scope: string;
};

// Context passed through the request headers, includes the ORCID (user) of the user
export type Context = {
  user: string;
  workspace: string;
};

// User types
export type IUser = {
  firstName: string;
  lastName: string;
  affiliation: string;
  email: string;
  workspaces: string[];
};

export type UserModel = IUser & {
  _id: string;
  token: string;
};
