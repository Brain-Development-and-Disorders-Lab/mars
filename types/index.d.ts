declare global {
  interface Navigator {
    usb: {
      getDevices(): any;
      requestDevice({}): any;
      addEventListener(event: string, handler: (event: any) => void): any;
      onconnect({}): any;
    };
  }
}

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
export interface IValue<D> {
  _id: string;
  name: string;
  type: "number" | "text" | "url" | "date" | "entity" | "select";
  data: D;
  disabled?: boolean;
  showRemove?: boolean;
  onRemove?: (id: string) => void;
  onUpdate?: (data: D) => void;
}

export type LinkyProps = {
  type: "entities" | "attributes" | "projects";
  id: string;
  fallback?: string;
  color?: string;
  justify?: string;
  size?: string;
  truncate?: boolean | number;
};

// Project types
export type IProject = {
  name: string;
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
  description: string;
  entities: string[];
};

// Utility type used across other types, typically in a list
export type IGenericItem = {
  _id: string;
  name: string;
};

// Entity types
export type IEntity = {
  name: string;
  created: string;
  timestamp?: string;
  deleted: boolean;
  locked: boolean;
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
  deleted: boolean;
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

  // Generic details
  [key: string]: string;
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
  type: "create" | "update" | "delete";
  details: string;
  target: {
    type: "entities" | "projects" | "attributes";
    _id: string;
    name: string;
  };
  actor?: {
    name: string;
    _id: string;
  };
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
  visibleColumns: VisibilityState;
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
  | "view"
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

  // Chevrons
  | "c_left"
  | "c_double_left"
  | "c_right"
  | "c_double_right"
  | "c_up"
  | "c_down"

  // Sorting
  | "sort"
  | "sort_up"
  | "sort_down";

// Response message types
export type ResponseMessage = {
  success: boolean;
  message: string;
};

// Query types
export type QueryOperator = "AND" | "OR";
export type QueryFocusType = "Entity" | "Project" | "Attribute";
export type QueryParameters =
  | "Name"
  | "Owner"
  | "Description"
  | "Projects"
  | "Origins"
  | "Products";
export type QueryQualifier = "Contains" | "Does Not Contain" | "Is" | "Is Not";
export type QuerySubQualifier =
  | "Date"
  | "Text"
  | "Number"
  | "URL"
  | "Entity"
  | "Select";

export type QueryComponent = {
  operator?: QueryOperator;
  focus: QueryFocusType;
  parameter: QueryParameters;
  qualifier: QueryQualifier;
  subQualifier?: QuerySubQualifier;
  value: string;
  key: string;
};

// Authentication types
export type IAuth = {
  orcid: string;
  name: string;
  token: string;
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
};

// User types
export type IUser = {
  name: string;
  email?: string;
};

export type UserModel = IUser & {
  _id: string;
  token: string;
};

// Device types
export type IDevice = {
  name: string;
  vendor_id: number;
};

export type DeviceModel = IDevice & {
  _id: string;
};
