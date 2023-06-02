export namespace State.Entity {
  type Start = {
    location: "none" | "start" | "associations" | "attributes";
    name: string;
    created: string;
    owner: string;
    description: string;
  };

  type Associations = Start & {
    collections: string[];
    associations: {
      origins: { name: string; id: string };
      products: { name: string; id: string }[];
    };
  };

  type Attributes = Associations & {
    attributes: Attribute[];
  };
}

export namespace State.Collection {
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
  values: IValue[];
};

// Database model of Attribute, including assigned ID
export type AttributeModel = IAttribute & {
  _id: string;
};

export type AttributeActions = {
  showRemove?: boolean;
  onUpdate?: (data: AttributeProps) => void;
  onRemove?: (identifier: string) => void;
};

export type AttributeProps = IAttribute & AttributeActions & {
  identifier: string;
};

export type AttributeGroupProps = AttributeActions & {
  attributes: AttributeModel[];
};

export type AttributeCardProps = {
  attribute: AttributeModel;
  editing?: boolean;
  removeCallback?: () => void;
  doneCallback?: (updated: AttributeModel) => void;
  cancelCallback?: () => void;
};

// Values
export interface IValue<D> {
  identifier: string;
  name: string;
  type: "number" | "text" | "url" | "date" | "entity";
  data: D;
  disabled?: boolean;
  showRemove?: boolean;
  onRemove?: (identifier: string) => void;
  onUpdate?: (data: D) => void;
};

export type LinkyProps = {
  type: "entities" | "collections" | "attributes";
  id: string;
  fallback?: string;
  color?: string;
};

// Collection types
export type ICollection = {
  name: string;
  description: string;
  owner: string;
  created: string;
  entities: string[];
};

export type CollectionModel = ICollection & {
  _id: string;
};

// Entity types
export type IEntity = {
  name: string;
  created: string;
  owner: string;
  description: string;
  collections: string[];
  associations: {
    origins: { name: string; id: string }[];
    products: { name: string; id: string }[];
  };
  attributes: AttributeModel[];
};

export type EntityModel = IEntity & {
  _id: string;
};

export type EntityExport = {
  // Specific details
  name: string;
  created: string;
  owner: string;
  description: string;
  collections: string;
  origins: string;
  products: string;

  // Generic details
  [key: string]: string;
}

// Update types
export type IUpdate = {
  timestamp: Date;
  type: "create" | "update" | "delete";
  details: string;
  target: {
    type: "entities" | "collections" | "attributes",
    id: string,
    name: string,
  };
};

export type UpdateModel = IUpdate & {
  _id: string;
};

// DataTable component
export type DataTableProps = {
  columns: any[];
  data: any[];
  setData?: (value: React.SetStateAction<any[]>) => void;
  visibleColumns: VisibilityState;
  hideControls?: boolean;
  viewOnly?: boolean;
};

// Icon component
export type IconNames =
  // Default
  "unknown" |

  // Locations
  "dashboard" |
  "entity" |
  "collection" |
  "attribute" |

  // Signal and action icons
  "activity" |
  "check" |
  "info" |
  "search" |
  "add" |
  "edit" |
  "delete" |
  "download" |
  "cross" |
  "list" |
  "warning" |
  "exclamation" |
  "reload" |
  "graph" |

  // Values
  "p_date" |
  "p_text" |
  "p_number" |
  "p_url" |

  // Arrows
  "a_right" |

  // Chevrons
  "c_left" |
  "c_double_left" |
  "c_right" |
  "c_double_right" |
  "c_up" |
  "c_down";

// Query types
export type QueryToken = "&" | "|" | "!" | "=";
export type QueryOperator = "AND" | "OR" | "NOT" | "INCLUDES";
export type QueryParameters = "NAME" | "CREATED" | "OWNER";
export type QueryFocusType = "ENTITY" | "COLLECTION" | "ATTRIBUTE";

export type Query = {
  raw: string;
  tokens: string[];
};
