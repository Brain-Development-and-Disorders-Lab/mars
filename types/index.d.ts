// Import types
import { ReadStream } from "fs";

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
    location: "none" | "start" | "relationships" | "attributes";
    name: string;
    created: string;
    owner: string;
    description: string;
  };

  type Relationships = Start & {
    projects: string[];
    relationships: IRelationship[];
  };

  type Attributes = Relationships & {
    attributes: IAttribute[];
  };
}

export namespace State.Project {
  type Start = {
    location: "none" | "start";
    name: string;
    created: string;
    owner: string;
    description: string;
  };
}

// Attributes
// Generic Attribute interface containing required Values
export type IAttribute = {
  name: string;
  owner: string;
  description: string;
  values: IValue<any>[];
  archived: boolean;
};

// Database model of Attribute, including assigned ID
export type AttributeModel = IAttribute & {
  _id: string;
  timestamp: string;
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
export type IValueType =
  | "number"
  | "text"
  | "url"
  | "date"
  | "entity"
  | "select";

export type GenericValueType = any;

export type IValue<D> = {
  _id: string;
  name: string;
  type: IValueType;
  data: D;
  disabled?: boolean;
  showRemove?: boolean;
  onRemove?: (id: string) => void;
  onUpdate?: (data: D) => void;
};

// "Collaborators" component props
export type CollaboratorsProps = {
  editing: boolean;
  projectCollaborators: string[];
  setProjectCollaborators: (value: React.SetStateAction<string[]>) => void;
};

// "Linky" component props
export type LinkyProps = {
  type: "entities" | "templates" | "projects";
  id: string;
  fallback?: string;
  color?: string;
  justify?: string;
  size?: string;
  truncate?: boolean | number;
};

// "Actor" component props
export type ActorTagProps = {
  orcid: string;
  fallback: string;
  size: "sm" | "md";
  inline?: boolean;
};

// "VisibilityTagProps" component props
export type VisibilityTagProps = {
  isPublic: boolean;
  setIsPublic?: (value: React.SetStateAction<boolean>) => void;
  disabled?: boolean; // Disable changing the visibility
  isInherited?: boolean; // Specify if this visibility is inherited
};

// Project types
export type IProject = {
  name: string;
  owner: string;
  archived: boolean;
  created: string;
  collaborators: string[];
  description: string;
  entities: string[];
  history: ProjectHistory[];
};

export type ProjectModel = IProject & {
  _id: string;
  timestamp: string;
};

export type ProjectHistory = {
  author: string; // Change author identifier
  message: string; // Change message
  timestamp: string; // Timestamp of change
  version: string; // Project version

  _id: string;
  owner: string;
  created: string;
  archived: boolean;
  name: string;
  description: string;
  entities: string[];
  collaborators: string[];
};

// Utility type used across other types, typically in a list
export type IGenericItem = {
  _id: string;
  name: string;
};

// Utility type used for `Select` component options
export type ISelectOption = {
  label: string;
  value: string;
};

// Utility type to define set of relationship types
export type RelationshipType = "parent" | "child" | "general";

// Utility type to define relationship between two Entities
export type IRelationship = {
  type: RelationshipType;
  source: IGenericItem;
  target: IGenericItem;
};

export type RelationshipsProps = {
  relationships: IRelationship[];
  setRelationships: (value: React.SetStateAction<IRelationship[]>) => void;
  viewOnly?: boolean;
};

// Workspace types
export type IWorkspace = {
  name: string;
  owner: string;
  public: boolean;
  description: string;
  collaborators: string[];
  entities: string[];
  projects: string[];
  templates: string[];
  activity: string[];
};

export type WorkspaceModel = IWorkspace & {
  _id: string;
  timestamp: string;
};

// Entity types
export type IEntity = {
  name: string;
  owner: string;
  archived: boolean;
  created: string;
  description: string;
  projects: string[];
  relationships: IRelationship[];
  attributes: AttributeModel[];
  attachments: IGenericItem[];
  history: EntityHistory[];
};

export type EntityModel = IEntity & {
  _id: string;
  timestamp: string;
};

export type EntityNode = IGenericItem & {
  relationships: IRelationship[];
};

export type EntityHistory = {
  author: string; // Change author identifier
  message: string; // Change message
  timestamp: string; // Timestamp of change
  version: string; // Entity version

  _id: string;
  name: string;
  owner: string;
  archived: boolean;
  created: string;
  description: string;
  projects: string[];
  relationships: IRelationship[];
  attributes: AttributeModel[];
  attachments: IGenericItem[];
};

export type EntityImport = {
  // Specific details
  name: string;
  created: string;
  owner: string;
  description: string;
  projects: string;
  relationships: IRelationship[];
  attributes: AttributeModel[];
};

// Import review summary for Entities being imported
export type EntityImportReview = {
  name: string;
  state: "create" | "update";
};

// Import review summary for Templates being imported
export type TemplateImportReview = {
  name: string;
  state: "create" | "update";
};

// Column mappings for Entity imports
export type IRow = Record<string, any>;
export type IColumnMapping = Record<string, any>;

// Import options for CSV files
export type CSVImportOptions = {
  counters: { field: string; _id: string }[];
};

// Import data for CSV files, including mappings and options
export type CSVImportData = {
  columnMapping: IColumnMapping;
  options: CSVImportOptions;
  file: File;
};

// Import options for JSON files
export type JSONImportOptions = {
  project: string; // Project to add all Entities
  attributes: AttributeModel[]; // Created attrbutes
};

// Attachment data
export type AttachmentData = {
  _id: string;
  length: number;
  chunkSize: number;
  uploadDate: string;
  filename: string;
};

// Counter types
export type ICounter = {
  workspace: string; // The Workspace ID assigned the Counter
  name: string;
  format: string; // Format, with one set of `{}` used to position the numerical values
  current: number; // Current value of the numeric component
  increment: number; // Amount to increase the counter by each iteration
  created: string;
};

export type CounterModel = ICounter & {
  _id: string;
};

export type CounterProps = {
  counter: string;
  setCounter: (value: React.SetStateAction<string>) => void;
  showCreate: boolean;
};

// Activity types
export type IActivity = {
  timestamp: string;
  type: "create" | "update" | "delete" | "archived";
  details: string;
  target: {
    type: "entities" | "projects" | "templates";
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

// `AlertDialog` component
export type AlertDialogProps = {
  // Ref for placement
  header: string;
  children: React.ReactElement | React.ReactElement[];
  // Dialog actions and state
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
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
  selectedRows: any;
  onSelectedRowsChange?: (selectedRows: any[]) => void;
  columnFilters?: any;
  onColumnFiltersChange?: (filters: any) => void;
  data: any[];
  setData?: (value: React.SetStateAction<any[]>) => void;
  viewOnly?: boolean;

  // Interface visibility
  showColumnSelect?: boolean;
  showPagination?: boolean;
  showSelection?: boolean;
  actions?: DataTableAction[];

  // Layout behavior
  fill?: boolean; // If true, table fills available space and scrolls. If false, fits within parent container.
};

export type DataTableAction = {
  label: string; // Action label
  icon: IconNames; // Icon
  action: (table: any, rows: any) => void; // Action function acting on the provided the table and rows
  alwaysEnabled?: boolean; // Enable the action at all times, regardless if any rows selected
};

// `PreviewModal` props
export type PreviewModalProps = {
  attachment: IGenericItem;
};

// `PreviewModal` support type
export type PreviewSupport = {
  document: boolean;
  image: boolean;
  sequence: boolean;
};

// `ImportDialog` props
export type ImportDialogProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `ScanModal` props
export type ScanModalProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `UnsavedChangesModal` props
export type UnsavedChangesModalProps = {
  blocker: Blocker;
  cancelBlockerRef: React.MutableRefObject<null>;
  onClose: () => void;
  callback: () => void;
};

// `Scanner` props
export type ScannerProps = Html5QrcodeCameraScanConfig & {
  verbose: boolean;
};

// Icon component
export type IconNames =
  // Default
  | "unknown"

  // Locations
  | "dashboard"
  | "entity"
  | "template"
  | "attribute"
  | "project"

  // Signal and action icons
  | "activity"
  | "archive"
  | "attachment"
  | "check"
  | "close"
  | "counter"
  | "info"
  | "search"
  | "search_query"
  | "bell"
  | "add"
  | "copy"
  | "edit"
  | "expand"
  | "delete"
  | "download"
  | "filter"
  | "upload"
  | "cross"
  | "list"
  | "save"
  | "logout"
  | "person"
  | "warning"
  | "exclamation"
  | "key"
  | "lightning"
  | "qr"
  | "reload"
  | "share"
  | "graph"
  | "clock"
  | "rewind"
  | "link"
  | "scan"
  | "lock"
  | "settings"
  | "power"
  | "print"
  | "text"
  | "view"
  | "visibility_show"
  | "visibility_hide"
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

  // Chevrons
  | "c_left"
  | "c_double_left"
  | "c_right"
  | "c_double_right"
  | "c_up"
  | "c_down"
  | "c_expand"

  // Density
  | "d_low"
  | "d_high"

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
  id?: string;
  value: IGenericItem;
  resultType: "entity" | "project";
  placeholder?: string;
  onChange?: (value: any) => void;
  disabled?: boolean;
  isEmbedded?: boolean;
};

// SearchBox props
export type SearchBoxProps = {
  resultType: "entity" | "project";
};

// Generic ResponseMessage type
export type IResponseMessage = {
  success: boolean;
  message: string;
};

// ResponseMessage type carrying a data payload
export type ResponseData<D> = IResponseMessage & {
  data: D;
};

// Authentication types
export type IAuth = {
  orcid: string; // ORCiD value
  token: string; // ORCiD token
  setup: boolean; // Flag if application setup is complete
  firstLogin?: boolean; // (Optional) Flag if this is the first login
};

export type Token = IAuth & {
  access_token: string;
  token_type: string;
  refesh_token: string;
  expires_in: number;
  scope: string;
};

// Session type
export type ISession = {
  workspace: string; // Active workspace
};

// File type
export type IFile = Promise<{
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => fs.ReadStream;
}>;

// Generic GraphQL resolver parent type (for unused parents)
export type IResolverParent = Record<string, any>;

// Context passed through the request headers, includes the ORCID (user) of the user
export type Context = {
  user: string;
  workspace: string;
  token: string;
};

// API key data
export type APIKey = {
  value: string;
  expires: string;
  scope: "view" | "edit";
  workspaces: string[];
};

// API response
export type APIData<D> = {
  path: string;
  version: string;
  status: "success" | "warning" | "error" | "unauthorized";
  message: string;
  data: D;
};

// User types
export type IUser = {
  firstName: string;
  lastName: string;
  affiliation: string;
  email: string;
  lastLogin: string;
  workspaces: string[];
  api_keys: APIKey[];
};

export type UserModel = IUser & {
  _id: string;
  token: string;
};

// Metrics
export type IContentMetrics = {
  all: number;
  addedDay: number;
};

export type EntityMetrics = IContentMetrics;

export type ProjectMetrics = IContentMetrics;

export type TemplateMetrics = IContentMetrics;

export type WorkspaceMetrics = {
  collaborators: number;
};

export interface Html5QrcodeScannerConfig {
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
  disableFlip?: boolean;
}
