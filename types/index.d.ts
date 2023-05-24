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
// Generic Attribute interface containing required data parameters
export type Attribute = {
  name: string;
  description: string;
  parameters: Parameters[];
};

// Database model of Attribute, including assigned ID
export type AttributeModel = Attribute & {
  _id: string;
};

export type AttributeActions = {
  showRemove?: boolean;
  onUpdate?: (data: AttributeProps) => void;
  onRemove?: (identifier: string) => void;
};

export type AttributeProps = Attribute & AttributeActions & {
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

// Parameters
export namespace Parameter {
  interface Generic {
    identifier: string;
    name: string;
    disabled?: boolean;
    showRemove?: boolean;
    onRemove?: (identifier: string) => void;
  }

  type Number = Generic & {
    type: "number";
    data: number;
    onUpdate?: (data: Number) => void;
  };

  type Text = Generic & {
    type: "text";
    data: string;
    onUpdate?: (data: Text) => void;
  };

  type URL = Generic & {
    type: "url";
    data: string;
    onUpdate?: (data: URL) => void;
  };

  type Date = Generic & {
    type: "date";
    data: string;
    onUpdate?: (data: Date) => void;
  };

  type Entity = Generic & {
    type: "entity";
    data: string;
    onUpdate?: (data: Entity) => void;
  };
}

export type Parameters = Parameter.Date | Parameter.Entity | Parameter.Number | Parameter.Text | Parameter.URL;

export type LinkyProps = {
  type: "entities" | "collections" | "attributes";
  id: string;
  fallback?: string;
  color?: string;
};

// Collection types
export type Collection = {
  name: string;
  description: string;
  owner: string;
  created: string;
  entities: string[];
};

export type CollectionModel = Collection & {
  _id: string;
};

// Entity types
export type Entity = {
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

export type EntityModel = Entity & {
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
  [k: string]: string;
}

// Update types
export type Update = {
  timestamp: Date;
  type: "create" | "update" | "delete";
  details: string;
  target: {
    type: "entities" | "collections" | "attributes",
    id: string,
    name: string,
  };
};

export type UpdateModel = Update & {
  _id: string;
};

// DataTable component
export type DataTableProps = {
  columns: any[];
  data: any[];
  visibleColumns: VisibilityState;
  hideControls?: boolean;
  editable?: boolean;
};

// Query types
export type QueryToken = "&" | "|" | "!" | "=";
export type QueryOperator = "AND" | "OR" | "NOT" | "INCLUDES";
export type QueryParameters = "NAME" | "CREATED" | "OWNER";
export type QueryFocusType = "ENTITY" | "COLLECTION" | "ATTRIBUTE";

export type Query = {
  raw: string;
  tokens: string[];
};
