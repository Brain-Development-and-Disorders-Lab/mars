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
export type IAttribute = {
  name: string;
  description: string;
  parameters: Parameters[];
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

// Parameters
export namespace Parameter {
  interface IParameter {
    identifier: string;
    name: string;
    disabled?: boolean;
    showRemove?: boolean;
    onRemove?: (identifier: string) => void;
  }

  type Number = IParameter & {
    type: "number";
    data: number;
    onUpdate?: (data: Number) => void;
  };

  type Text = IParameter & {
    type: "text";
    data: string;
    onUpdate?: (data: Text) => void;
  };

  type URL = IParameter & {
    type: "url";
    data: string;
    onUpdate?: (data: URL) => void;
  };

  type Date = IParameter & {
    type: "date";
    data: string;
    onUpdate?: (data: Date) => void;
  };

  type Entity = IParameter & {
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
