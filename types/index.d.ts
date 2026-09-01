// Import external types
import { ListCollection } from "@chakra-ui/react";
import { Html5QrcodeCameraScanConfig } from "html5-qrcode";
import { ReadStream } from "fs";

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
  values: IValue[];
  archived: boolean;
};

// Database model of Attribute, including assigned ID
export type AttributeModel = IAttribute & {
  _id: string;
  timestamp: string;
  history?: AttributeHistory[];
};

export type AttributeHistory = {
  author: string;
  message: string;
  timestamp: string;
  version: string;

  _id: string;
  name: string;
  owner: string;
  archived: boolean;
  description: string;
  values: IValue[];
};

// Database model of Attribute usage, includes Entity ID and status of modification
export type AttributeUsage = {
  entity: string;
  modifications: ("name" | "description" | "values")[];
};

// `TemplateBreadcrumb` props, the breadcrumb trail and name tag shared by the Template detail page
export type TemplateBreadcrumbProps = {
  loading: boolean;
  workspaceName: string;
  onNavigateHome: () => void;
  onNavigateTemplates: () => void;
  archived: boolean;
  name: string;
};

// `TemplateOverviewCard` props, the Name/Owner/Timestamp/Visibility/Description fields shared by the Template detail page
export type TemplateOverviewCardProps = {
  name: string;
  onNameChange?: (value: string) => void;
  nameReadOnly: boolean;
  owner: string;
  timestamp: string;
  visibilityIsPublic: boolean;
  description: string;
  onDescriptionChange?: (value: string) => void;
  descriptionReadOnly: boolean;
  workspace?: string;
  isPublic?: boolean;
};

// `TemplateUsageTable` props, the Entities using a Template, shared by the Template detail page
export type TemplateUsageTableProps = {
  templateUsage: AttributeUsage[];
  onViewEntity: (entityId: string) => void;
  workspace?: string;
  isPublic?: boolean;
};

export type AttributeCardActions = {
  showRemove?: boolean;
  onUpdate?: (data: AttributeCardProps) => void;
  onRemove?: (id: string) => void;
  onValidityChange?: (id: string, isValid: boolean) => void;
};

export type AttributeCardProps = IAttribute &
  AttributeCardActions & {
    _id: string;
    restrictDataValues: boolean;
    permittedDataValues?: ColumnInfo[];
  };

export type AttributeGroupProps = AttributeCardActions & {
  attributes: AttributeModel[];
};

export type DialogViewAttributeProps = {
  // Dialog state
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;

  // Dialog Attribute information
  attribute: AttributeModel;
  editing?: boolean;
  isTemplate?: boolean;
  permittedDataValues?: ColumnInfo[];

  // Callback functions
  onAttributeUpdate: (updated: AttributeModel) => void;
  removeCallback?: () => void;
  cancelCallback?: () => void;

  // Optional context for comparison display
  entityName?: string;

  // Optional fields for public view
  workspace?: string;
  isPublic?: boolean;
};

export type DialogCreateProps = {
  // Dialog state
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

export type DialogCompareAttributeProps = {
  // Dialog state
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;

  // Dialog Attribute information
  modifiedAttribute: AttributeModel;
  templateAttributeId: string;

  // Optional callback to apply selected Template changes back to the Entity Attribute
  onUpdate?: (updated: AttributeModel) => void;

  // When true, all changes are pre-selected
  defaultApplyAll?: boolean;

  // Optional context for comparison display
  entityName?: string;
};

export type CompareAttributeDialogCollapsibleProps = {
  sectionKey: string;
  icon: IconNames;
  color: string;
  label: string;
  count: number;
  disabled: boolean;
  children: React.ReactNode;
};

export type CompareAttributeFieldDiffProps = {
  label: string;
  isDifferent: boolean;
  currentValue: string;
  originalValue: string;
  useOriginal: boolean;
  setUseOriginal: (v: boolean) => void;
};

// Column descriptor returned by prepareEntityCSV
export type ColumnInfo = {
  name: string;
  inferredType: IValueType;
};

// Values
export type IValueType = "number" | "text" | "url" | "date" | "entity" | "select";

export type IValue = {
  _id: string;
  name: string;
  type: IValueType;
  data: string;
  source?: "column" | "value";
  disabled?: boolean;
  showRemove?: boolean;
  onRemove?: (id: string) => void;
  onUpdate?: (data: string) => void;
};

export type IValueSelectData = {
  selected: string;
  options: string[];
};

// Parsed display label for an `IValue`, produced by `formatValueForDisplay`
export type FormattedValueDisplay = { label: string; secondary?: string };

type StyledSelectIconGetter<T> = (data: T) => { name: IconNames; color?: string } | undefined;

export type StyledSelectConfig<T> = {
  getIcon?: StyledSelectIconGetter<T>;
  optionHeight: string;
  optionPadding: string;
  optionMargin?: string;
  controlPaddingLeft: string;
  controlHasBorder: boolean;
  valueContainerHeight: string;
};

// `Select` component props, shared native `Select` wrapper
export type SelectProps<T> = {
  collection: ListCollection<T>;
  value?: string[];
  onValueChange: (details: { value: string[]; items: T[] }) => void;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  width?: string;
  minW?: string;
  fontSize?: string;
  testId?: string;
  groupBy?: (item: T) => string;
  itemDisabled?: (item: T) => boolean;
};

export type Collaborator = {
  _id: string;
  permissions: UserWorkspacePermissions; // Workspace-scoped permissions
};

// "Collaborators" component props
export type CollaboratorsProps = {
  editing: boolean;
  currentUser: string;
  owner: string;
  collaborators: Collaborator[];
  setCollaborators: (value: React.SetStateAction<Collaborator[]>) => void;
};

// "Linky" component props
export type LinkyProps = {
  type: "entities" | "templates" | "projects" | "workspaces";
  id: string;
  fallback?: string;
  color?: string;
  justify?: string;
  size?: string;
  truncate?: boolean | number;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

export type LinkyType = LinkyProps["type"];

// Normalized data returned by the "Linky" component's per-type data fetchers
export type LinkyData = {
  name: string;
  archived: boolean;
  description: string;
  items: { _id: string; name: string; type?: IValueType }[];
};

// "Actor" component props
export type TagActorProps = {
  identifier: string;
  fallback: string;
  size: "sm" | "md";
  inline?: boolean;
  inlineNoAvatar?: boolean;
  avatarOnly?: boolean;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

// "Visibility" component props
export type TagVisibilityProps = {
  isPublic: boolean;
  setIsPublic?: (value: React.SetStateAction<boolean>) => void;
  disabled?: boolean; // Disable changing the visibility
  isInherited?: boolean; // Specify if this visibility is inherited
};

// "Timestamp" component props
export type TagTimestampProps = {
  timestamp: string;
  description?: string;
};

// "TagField" component props, a single field value (Empty, Value, or Attribute) rendered as a colored Tag
export type EmptyTagProps = {
  label: string; // Noun describing the missing content, rendered as "No {label}"
  size?: "sm" | "md";
};

export type ValueTagProps = {
  value: IValue;
  size?: "sm" | "md";
};

export type AttributeTagProps = {
  attribute: IGenericItem;
  size?: "sm" | "md";
};

// "FieldTagList" component props, renders up to `max` `TagField`s followed by an "and N more" summary
export type FieldTagListProps = {
  items: any[];
  max: number;
  getKey: (item: any) => string;
  renderTag: (item: any) => React.ReactNode;
  emptyLabel?: string; // When set, an `EmptyTag` is shown in place of an empty list
};

// "PageHeader" component props, the icon, title, and Workspace subtitle shown atop list pages
export type PageHeaderProps = {
  icon: IconNames;
  iconColor?: string;
  title: string;
  subtitle: string; // Workspace name
  loading: boolean;
};

// "TableCell" component props, shared `DataTable` cell renderers repeated across list pages
export type CreatedCellProps = {
  value: string;
};

export type OwnerCellProps = {
  value: string;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

export type DescriptionCellProps = {
  value: string | null | undefined;
  maxLength?: number;
};

// Project types
export type IProject = {
  name: string;
  owner: string;
  archived: boolean;
  created: string;
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
};

// `ProjectBreadcrumb` props, the breadcrumb trail and name tag shared by the Project detail page
export type ProjectBreadcrumbProps = {
  loading: boolean;
  workspaceName: string;
  onNavigateHome: () => void;
  onNavigateProjects: () => void;
  archived: boolean;
  name: string;
};

// `ProjectOverviewCard` props, the Name/Owner/Timestamp/Visibility/Description fields shared by the Project detail page
export type ProjectOverviewCardProps = {
  name: string;
  onNameChange?: (value: string) => void;
  nameReadOnly: boolean;
  owner: string;
  created: string;
  visibilityIsPublic: boolean;
  description: string;
  onDescriptionChange?: (value: string) => void;
  descriptionReadOnly: boolean;
  workspace?: string;
  isPublic?: boolean;
};

// Row shape for the `ProjectEntitiesTable`; description and attributes are undefined until fetched
export type ProjectEntityTableRow = {
  _id: string;
  description?: string;
  attributes?: AttributeModel[];
};

// `ProjectEntitiesTable` props, the Entities within a Project, shared by the Project detail page
export type ProjectEntitiesTableProps = {
  entities: ProjectEntityTableRow[];
  entityCount: number;
  editing: boolean;
  workspace?: string;
  isPublic?: boolean;
  onView: (entityId: string) => void;
  onRemove?: (entityId: string) => void;
  onRemoveMany?: (entityIds: string[]) => void;
  onAddClick?: () => void;
  addDisabled?: boolean;
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
  sourceName?: string;
  sourceId?: string;
};

// Utility type to specify the props of `DialogAddRelationship`
export type DialogAddRelationshipProps = {
  open: boolean;
  onClose: () => void;
  sourceId?: string;
  sourceName: string;
  existingRelationships: IRelationship[];
  onAdd: (relationships: IRelationship[]) => void;
};

export type DialogAddAttributeProps = {
  open: boolean;
  onClose: () => void;
  owner: string;
  templates: AttributeModel[];
  entityName: string;
  entityDescription: string;
  permittedDataValues?: ColumnInfo[];
  onAdd: (attribute: AttributeModel) => void;
  /** Optional, shown only when the user is creating from scratch (not from a template). */
  onSaveAsTemplate?: (attribute: IAttribute) => Promise<void>;
};

// Workspace types
export type IWorkspace = {
  name: string;
  owner: string;
  isPublic: boolean;
  description: string;
  collaborators: Collaborator[];
  entities: string[];
  projects: string[];
  templates: string[];
  activity: string[];
};

export type WorkspaceModel = IWorkspace & {
  _id: string;
  timestamp: string;
};

// Secondary identifier assigned to an Entity
export type SecondaryIdentifier = {
  value: string; // Secondary identifier value
  format: string; // Base format value or custom IdentifierFormat id
};

// Entity types
export type IEntity = {
  name: string;
  secondaryIdentifier?: SecondaryIdentifier;
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
  secondaryIdentifier?: SecondaryIdentifier;
  owner: string;
  archived: boolean;
  created: string;
  description: string;
  projects: string[];
  relationships: IRelationship[];
  attributes: AttributeModel[];
  attachments: IGenericItem[];
};

// `EntityBreadcrumb` props, the breadcrumb trail and name tag shared by the Entity detail page
export type EntityBreadcrumbProps = {
  loading: boolean;
  workspaceName: string;
  onNavigateHome: () => void;
  onNavigateEntities: () => void;
  archived: boolean;
  name: string;
};

// `EntityOverviewCard` props, the Name/Secondary Identifier/Owner/Timestamp/Visibility/Description fields shared by the Entity detail page
export type EntityOverviewCardProps = {
  name: string;
  onNameChange?: (value: string) => void;
  nameReadOnly: boolean;

  showSecondaryIdentifier: boolean;
  onShowSecondaryIdentifierChange?: (value: boolean) => void;
  showSecondaryIdentifierDisabled: boolean;

  secondaryIdentifierValue: string;
  onSecondaryIdentifierChange?: (value: string) => void;
  secondaryIdentifierReadOnly: boolean;
  secondaryIdentifierDisabled: boolean;

  identifierFormat: string[];
  onIdentifierFormatChange?: (value: string[]) => void;
  identifierFormats: ListCollection;
  identifierFormatDisabled: boolean;
  customIdentifierFormats: IdentifierFormatModel[];
  // Value-field validation errors are only meaningful when the field is actually editable
  showValidationErrors: boolean;

  owner: string;
  created: string;
  visibilityIsPublic: boolean;

  description: string;
  onDescriptionChange?: (value: string) => void;
  descriptionReadOnly: boolean;

  workspace?: string;
  isPublic?: boolean;
};

// `EntityAttributesTable` props, the Attributes on an Entity, shared by the Entity detail page
export type EntityAttributesTableProps = {
  attributes: AttributeModel[];
  editing: boolean;
  entityName: string;
  templates: AttributeModel[];
  onUpdate: (updated: AttributeModel) => void;
  onRemove?: (id: string) => void;
  onAddClick?: () => void;
  workspace?: string;
  isPublic?: boolean;
};

// `EntityAttributeNameCell` props, the "Name" column cell within `EntityAttributesTable`
export type EntityAttributeNameCellProps = {
  attribute: AttributeModel;
  editing: boolean;
  entityName: string;
  templates: AttributeModel[];
  onUpdate: (updated: AttributeModel) => void;
  onRemove?: (id: string) => void;
  workspace?: string;
  isPublic?: boolean;
};

// `CreateEntityAttributesTable` props, the Entity creation flow's attributes table
export type CreateEntityAttributesTableProps = {
  attributes: AttributeModel[];
  templates: AttributeModel[];
  onUpdate: (updated: AttributeModel) => void;
  onRemove: (id: string) => void;
  onAddClick: () => void;
};

// `CreateEntityAttributeNameCell` props, the "Name" column cell within `CreateEntityAttributesTable`
export type CreateEntityAttributeNameCellProps = {
  attribute: AttributeModel;
  templates: AttributeModel[];
  onUpdate: (updated: AttributeModel) => void;
  onRemove: (id: string) => void;
};

// `EntityProjectsTable` props, the Projects an Entity belongs to, shared by the Entity detail page
export type EntityProjectsTableProps = {
  projects: string[];
  editing: boolean;
  workspace?: string;
  isPublic?: boolean;
  onView: (projectId: string) => void;
  onRemove?: (projectId: string) => void;
  onRemoveMany?: (projectIds: string[]) => void;
  onAddClick?: () => void;
};

// `EntityAttachmentsTable` props, the files attached to an Entity, shared by the Entity detail page
export type EntityAttachmentsTableProps = {
  attachments: IGenericItem[];
  editing: boolean;
  workspace?: string;
  isPublic?: boolean;
  onDownload: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
  onRemoveMany?: (ids: string[]) => void;
  onUploadClick?: () => void;
};

// Import review summary for Entities being imported
export type EntityImportReview = {
  name: string;
  state: "create" | "update";
  warnings?: string[];
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

export type SelectCounterProps = {
  counter: string;
  setCounter: (value: React.SetStateAction<string>) => void;
  showCreate: boolean;
};

export type DialogCreateCounterProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (_id: string) => void;
};

// Identifier format types
export type IIdentifierFormat = {
  name: string;
  created: string;
  workspace: string;
  fixedLength: number;
  alphanumericOnly: boolean;
  lettersOnly: boolean;
  numbersOnly: boolean;
  allowSpecialCharacters: boolean;
  uppercaseRequired: boolean;
};

export type IdentifierFormatModel = IIdentifierFormat & {
  _id: string;
};

export type DialogCreateIdentifierFormatProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (_id: string) => void;
};

// "SelectIdentifierFormat" component props
export type SelectIdentifierFormatProps = {
  format: string[];
  setFormat: (value: React.SetStateAction<string[]>) => void;
  onFormatsChange?: (formats: IdentifierFormatModel[]) => void;
  showCreate?: boolean;
  disabled?: boolean;
};

// Activity types
export type IActivity = {
  timestamp: string;
  type: "create" | "update" | "delete" | "archived";
  details: string;
  target: {
    type: "entities" | "projects" | "templates" | "workspaces";
    _id: string;
    name: string;
  };
  actor?: string;
  medium?: "API" | "Web";
};

export type ActivityModel = IActivity & {
  _id: string;
};

// `ActivityFeed` component props
export type ActivityFeedProps = {
  activities?: ActivityModel[];
  feedLimit?: number; // Number of activities to show in the feed (default: 5)
};

// `RelativeTime` component props
export type RelativeTimeProps = {
  value: string | number | Date;
  format?: (relative: string) => string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
};

// `Content` component
export type ContentProps = {
  children: React.ReactElement | React.ReactElement[];
  isError?: boolean;
  isLoaded?: boolean;
};

// `Page` component
export type PageProps = {
  children?: React.ReactElement | React.ReactElement[];
  isPublic: boolean;
};

// `Navigation` component
export type NavigationProps = {
  isPublic: boolean;
  workspace?: string;
};

// `DialogAlert` component
export type DialogAlertProps = {
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
  viewOnly?: boolean;

  // Interface visibility
  showColumnSelect?: boolean;
  showColumnFilters?: boolean;
  showPagination?: boolean;
  showSelection?: boolean;
  actions?: DataTableAction[];

  // Layout behavior
  fill?: boolean; // If true, table fills available space and scrolls. If false, fits within parent container.
  resizableColumns?: boolean; // If true, header columns can be resized by dragging their right edge
  footerAction?: { label: string; icon: IconNames; onClick: () => void }; // Renders a full-width action button below the rows

  // Server-side pagination (if pageCount is provided, pagination is handled server-side)
  pageCount?: number; // Total number of pages (enables server-side pagination)
  pageIndex?: number; // Current page index (0-based)
  pageSize?: number; // Current page size
  onPaginationChange?: (pageIndex: number, pageSize: number) => void; // Callback when pagination changes
  onSortChange?: (field: string, direction: "asc" | "desc" | null) => void; // Callback when sorting changes (for server-side sorting)
  sortState?: { field: string; direction: "asc" | "desc" } | null; // Current sort state (for syncing with server-side sorting)
};

export type DataTableAction = {
  label: string | ((selectedCount: number) => string); // Action label, or a function receiving the selected row count
  icon: IconNames; // Icon
  action: (table: any, rows: any) => void; // Action function acting on the provided the table and rows
  disabled?: boolean; // Disable the action
  alwaysEnabled?: boolean; // Enable the action at all times, regardless if any rows selected
};

// `DataTablePaginationNav` props
export type DataTablePaginationNavProps = {
  table: any;
};

// Item shape backing the `DataTablePageSizeSelect` collection
export type DataTablePageSizeOption = { label: string; value: string };

// `DataTablePageSizeSelect` props
export type DataTablePageSizeSelectProps = {
  table: any;
  pageLength: string[];
  setPageLength: (value: string[]) => void;
  pageLengthsCollection: ListCollection<DataTablePageSizeOption>;
};

// Item shape backing the `DataTableColumnSelect` collection
export type DataTableColumnOption = { label: string; value: string; disabled: boolean };

// `DataTableColumnSelect` props
export type DataTableColumnSelectProps = {
  columnNamesCollection: ListCollection<DataTableColumnOption>;
  visibleColumnsForSelect: string[];
  alwaysVisibleColumns: string[];
  updateColumnVisibility: (toggleableColumns: string[]) => void;
};

// `DataTableFilters` props
export type DataTableFiltersCountProps =
  | {
      mode: "range";
      label: string;
      min: string;
      max: string;
      onMinChange: (value: string) => void;
      onMaxChange: (value: string) => void;
    }
  | {
      mode: "buckets";
      label: string;
      unitLabel: string;
      selected: string[];
      onChange: (ranges: string[]) => void;
    };

export type DataTableFiltersProps = {
  entityLabel: string;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  activeFilterCount: number;

  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;

  owners: string[];
  selectedOwners: string[];
  onOwnersChange: (owners: string[]) => void;
  workspace?: string;
  isPublic?: boolean;

  countFilter?: DataTableFiltersCountProps;
  extraCheckbox?: {
    label: string;
    checkboxLabel: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  };

  onApply: () => void;
  onReset: () => void;
};

// `DialogPreview` props
export type DialogPreviewProps = {
  attachment: IGenericItem;
  trigger?: React.ReactNode;
  workspace?: string;
  isPublic?: boolean;
};

// `DialogImport` props
export type DialogImportProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `SampleFile` type representing a downloadable example file
export type SampleFile = { label: string; filename: string; mimeType: string; content: string };

// `UploadStep` props, the `DialogImport` step used to select the import type and upload a file
export type UploadStepProps = {
  importType: "entities" | "template" | undefined;
  isTypeSelectDisabled: boolean;
  onSelectImportType: (type: "entities" | "template") => void;
  fileUpload: any; // `useFileUpload()` return value
};

// `EntityDetailsStep` props, the `DialogImport` step used to configure name/description/project/owner fields
export type EntityDetailsStepProps = {
  fileType: string;
  columns: ColumnInfo[];
  namePrefixField: string;
  onNamePrefixFieldChange: (value: string) => void;
  nameField: ColumnInfo | undefined;
  onNameFieldChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>;
  nameUseCounter: boolean;
  onNameUseCounterChange: (value: boolean) => void;
  counter: string;
  onCounterChange: React.Dispatch<React.SetStateAction<string>>;
  onContinueDisabledChange: (value: boolean) => void;
  suggestions: { name: string | null; description: string | null } | null;
  isSuggesting: boolean;
  descriptionField: ColumnInfo | undefined;
  onDescriptionFieldChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>;
  identifierField: ColumnInfo | undefined;
  onIdentifierFieldChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>;
  identifierFormat: string[];
  onIdentifierFormatChange: React.Dispatch<React.SetStateAction<string[]>>;
  projectField: string;
  onProjectFieldChange: (value: string) => void;
  projectsCollection: ListCollection<IGenericItem>;
  ownerField: string;
  getSelectComponent: (
    key: string,
    currentValue: ColumnInfo | undefined,
    onValueChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>,
  ) => React.ReactElement;
};

// `EntityMappingStep` props, the `DialogImport` step used to add Attributes applied to all imported Entities
export type EntityMappingStepProps = {
  attributesField: AttributeModel[];
  onAttributesFieldChange: (value: AttributeModel[]) => void;
  addAttributeOpen: boolean;
  onAddAttributeOpenChange: (value: boolean) => void;
  ownerField: string;
  templates: AttributeModel[];
  fileType: string;
  columns: ColumnInfo[];
};

// `AttributeNameCell` props, the "Name" column cell within `EntityMappingStep`'s attribute table
export type AttributeNameCellProps = {
  attribute: AttributeModel;
  fileType: string;
  columns: ColumnInfo[];
  onRemove: (identifier: string) => void;
  onUpdate: (updated: AttributeModel) => void;
};

// `EntityReviewStep` props, the final `DialogImport` review step for an Entity import
export type EntityReviewStepProps = {
  reviewEntities: EntityImportReview[];
};

// `TemplateReviewStep` props, the final `DialogImport` review step for a Template import
export type TemplateReviewStepProps = {
  reviewTemplates: TemplateImportReview[];
};

// `DialogExport` props
export type DialogExportProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
  dataType: "entity" | "entities" | "project" | "template";
  // Single-item export (entity, project, or template)
  id?: string;
  // Multi-entity export; undefined means export all entities
  ids?: string[];
};

// `DialogScan` props
export type DialogScanProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `DialogReport` props
export type DialogReportProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `DialogUnsavedChanges` props
export type DialogUnsavedChangesProps = {
  blocker: Blocker;
  cancelBlockerRef: React.MutableRefObject<null>;
  onClose: () => void;
  callback: () => void;
};

// `DialogUpload` props
export type DialogUploadProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  target: string;
  uploads: string[];
  setUploads: React.Dispatch<React.SetStateAction<string[]>>;
  onUploadSuccess?: () => void;
};

// `Scanner` props
export type ScannerProps = Html5QrcodeCameraScanConfig & {
  fps: number;
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
  | "bug"
  | "check"
  | "close"
  | "counter"
  | "diff"
  | "info"
  | "file"
  | "format"
  | "bell"
  | "add"
  | "remove"
  | "copy"
  | "edit"
  | "expand"
  | "delete"
  | "download"
  | "email"
  | "external"
  | "filter"
  | "grid"
  | "upload"
  | "cross"
  | "institution"
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
  | "search"
  | "search_query"
  | "search_text"
  | "visibility_show"
  | "visibility_hide"
  | "workspace"
  | "zoom_in"
  | "zoom_out"

  // Logos
  | "l_box"
  | "l_labarchives"
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
  | "a_right_fill"
  | "a_left_fill"
  | "a_both"
  | "a_both_fill"

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

// SearchQuery types
export type SearchCombinator = "and" | "or";
export type SearchField = "name" | "description" | "projects" | "relationships" | "attributes";

export interface SearchAttributeValue {
  type: IValueType;
  operator: "contains" | "does not contain" | "equals" | ">" | "<";
  data: string;
}

export interface SearchRule {
  id: string;
  field: SearchField;
  operator: string;
  value: string | SearchAttributeValue;
}

export interface SearchQuery {
  combinator: SearchCombinator;
  rules: SearchRule[];
}

// SearchQueryBuilder props
export interface SearchQueryBuilderProps {
  query: SearchQuery;
  onQueryChange: (query: SearchQuery) => void;
  isValid: boolean;
  onSearch: () => void;
  onClear: () => void;
}

// SearchRuleSelect props
export type SearchRuleSelectProps = {
  value: string;
  collection: ListCollection<string>;
  onChange: (value: string) => void;
  minW?: string;
  placeholder?: string;
  testId?: string;
};

// SelectSearch props
export type SelectSearchProps = {
  id?: string;
  value: IGenericItem;
  resultType: "entity" | "project" | "institution";
  placeholder?: string;
  defaultOption?: string;
  onChange?: (value: any) => void;
  disabled?: boolean;
  isEmbedded?: boolean;
};

// SelectMultiEntity props
export type SelectMultiEntityProps = {
  projectEntities: string[];
  selectedEntities: IGenericItem[];
  setSelectedEntities: React.Dispatch<React.SetStateAction<IGenericItem[]>>;
};

// `DialogSave` props
export type DialogSaveProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onDone: () => void;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  placeholder?: string;
  showCloseButton?: boolean;
  modifiedType?: "Entity" | "Project" | "Template";
  isPublic?: boolean;
};

// "HistoryDrawer" component props, a version history Drawer shared by Entity, Project, and Template detail pages.
// `type` selects both the drawer title and which type-specific detail panel (Attributes/Attachments, Entities, or
// Values) is rendered for each version
export type HistoryDrawerProps = {
  type: "entity" | "project" | "template";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: (EntityHistory | ProjectHistory | AttributeHistory)[];
  archived: boolean; // Disables Preview while the current item is archived
  previewActive: boolean; // Whether a version is currently being previewed, disables Restore
  canRestore: boolean; // Workspace permission to restore a version
  onPreview: (version: any) => void;
  onRestore: (version: any) => void | Promise<void>;
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

// Storage and local data management types
export type ApplicationStorage = {
  setup: boolean; // Flag if application setup is complete
  workspace: string; // ID of active Workspace
};

// File type
export type IFile = Promise<{
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => ReadStream;
}>;

// Generic GraphQL resolver parent type (for unused parents)
export type IResolverParent = Record<string, any>;

// Context passed through the request headers, includes the ORCID (user) of the user
export type Context = {
  user: string;
  workspace: string;
  userRole: string;
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
  name: string; // better-auth: Display name
  affiliation: string;
  email: string; // better-auth: Email
  emailVerified: boolean; // better-auth: Email verification
  image: string; // better-auth: Display image URL
  createdAt: string; // better-auth: Created
  updatedAt: string; // better-auth: Last updated
  lastLogin: string; // better-auth: Timestamp of last login
  api_keys: string; // better-auth: Stored as a JSON string
  role: string; // better-auth: "user" or "admin"
  banned: boolean; // better-auth: Overarching access status
  permissions: UserGlobalPermissions; // Global permissions such as AI search or API access
  account_orcid: string; // ORCiD if connected
  hasSeenWalkthrough?: boolean; // If user has seen or skipped the initial walkthrough
  completedProfile?: boolean; // `false` until third-party signup profile is completed
};

export type UserModel = IUser & {
  _id: string;
};

// User Workspace permissions structure
export type UserWorkspacePermissions = {
  administration: {
    edit: boolean;
    invite: boolean;
  };
  entities: {
    create: boolean;
    edit: boolean;
    archive: boolean;
  };
  projects: {
    create: boolean;
    edit: boolean;
    archive: boolean;
  };
  templates: {
    create: boolean;
    edit: boolean;
    archive: boolean;
  };
};

// User global permissions structure
export type UserGlobalPermissions = {
  features: {
    import: boolean;
    scan: boolean;
    ai: boolean;
    api: boolean;
  };
  workspaces: {
    create: boolean;
  };
};

export type UserCollatedPermissions = {
  workspace: UserWorkspacePermissions;
  global: UserGlobalPermissions;
};

// Permissions Dialog props
export type DialogPermissionsProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: string;
  editable?: boolean; // If `false`, show a read-only preview instead of editable toggles
  isGlobal: boolean; // Define if modifying "global" permissions or just for the Workspace
  workspace?: string; // Specify the Workspace if modifying Workspace permissions
  workspacePermissions?: UserWorkspacePermissions; // Current local Workspace permissions for `user`, used instead of fetching from the server
  onUpdateWorkspacePermissions?: (permissions: UserWorkspacePermissions) => void; // Called with the edited permissions instead of persisting them immediately
};

// Metrics
export type IContentMetrics = {
  all: number;
  addedDay: number;
};

export type EntityMetrics = IContentMetrics;
export type ProjectMetrics = IContentMetrics;
export type TemplateMetrics = IContentMetrics;
export type CollaboratorMetrics = IContentMetrics;

export type AdminWorkspace = {
  _id: string;
  name: string;
  description: string;
  owner: string;
  entities: number;
  projects: number;
  templates: number;
};

export type AdminMetrics = {
  users: number;
  workspaces: number;
  entities: number;
  projects: number;
  templates: number;
};

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  workspaces: number;
  permissions: UserGlobalPermissions;
  banned: boolean;
  lastLogin: string;
};

// Types to assist with test frameworks
// A path on the client where a Workspace permission is enforced
export type ClientPath = {
  name: string;
  verify: (page: Page, granted: boolean) => Promise<void>;
};
