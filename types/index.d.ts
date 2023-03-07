declare namespace State.Entity {
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

declare namespace State.Collection {
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
declare type Attribute = {
  name: string;
  description: string;
  parameters: Parameters[];
};

// Database model of Attribute, including assigned ID
declare type AttributeModel = Attribute & {
  _id: string;
};

declare type AttributeActions = {
  showRemove?: boolean;
  onUpdate?: (data: AttributeProps) => void;
  onRemove?: (identifier: string) => void;
};

declare type AttributeProps = Attribute & AttributeActions & {
  identifier: string;
};

declare type AttributeGroupProps = AttributeActions & {
  attributes: AttributeModel[];
};

declare type AttributeCardProps = {
  data: Attribute;
};

// Parameters
declare namespace Parameter {
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

declare type Parameters = Parameter.Date | Parameter.Entity | Parameter.Number | Parameter.Text | Parameter.URL;

declare type LinkyProps = {
  type: "entities" | "collections" | "attributes";
  id: string;
  color?: string;
};

// Collection types
declare type Collection = {
  name: string;
  description: string;
  owner: string;
  created: Date;
  entities: string[];
};

declare type CollectionModel = Collection & {
  _id: string;
};

// Entity types
declare type Entity = {
  name: string;
  created: string;
  owner: string;
  description: string;
  collections: string[];
  associations: {
    origins: { name: string; id: string }[];
    products: { name: string; id: string }[];
  };
  attributes: Attribute[];
};

export type EntityModel = Entity & {
  _id: string;
};

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

// Authentication types
export type Authentication = {
  authenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};
