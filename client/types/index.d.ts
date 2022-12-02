import { ReactElement } from "react";

// A new type is declared for each step.
declare namespace Create.Entity {
  type Base = {
    from: "none" | "start" | "associations" | "attributes";
  };

  type Start = Base & {
    name: string;
    created: string;
    owner: string;
    description: string;
  };

  type Associations = Start & {
    collections: { name: string; id: string }[];
    associations: {
      origin: { name: string; id: string };
      products: { name: string; id: string }[];
    };
  };

  type Attributes = Associations & {
    attributes: AttributeStruct[];
  };
}

declare namespace Create.Collection {
  type Base = {
    from: "none" | "start" | "add";
  };

  type Start = Base & {
    name: string;
    created: Date;
    owner: string;
    description: string;
  };
}

// Attributes
export type AttributeStruct = {
  name: string;
  description: string;
  parameters: ParameterStruct[];
};

export type AttributeModel = AttributeStruct & {
  _id: string;
};

declare type AttributeActions = {
  showRemove?: boolean;
  onUpdate?: (data: AttributeProps) => void;
  onRemove?: (identifier: string) => void;
};

declare type AttributeProps = AttributeStruct & AttributeActions & {
  identifier: string;
};

declare type AttributeGroupProps = AttributeActions & {
  attributes: AttributeModel[];
};

export type AttributeCardProps = {
  data: AttributeStruct;
};

// Parameters
declare namespace Parameter {
  interface Base {
    identifier: string;
    name: string;
    disabled?: boolean;
    showRemove?: boolean;
    onRemove?: (identifier: string) => void;
    onUpdate?: (data: ParameterStruct) => void;
  };

  type PNumber = Base & {
    type: "number";
    data: number;
  };

  type PString = Base & {
    type: "string";
    data: string;
  }

  type PURL = Base & {
    type: "url";
    data: string;
  }

  type PDate = Base & {
    type: "date";
    data: Date;
  };

  type PEntity = Base & {
    type: "entity";
    data: string;
  }
};

declare type Parameters = Parameter.PDate | Parameter.PEntity | Parameter.PNumber | Parameter.PString | Parameter.PURL;

declare type LinkyProps = {
  type: "entities" | "collections" | "attributes";
  id: string;
};

// Collection types
declare type CollectionStruct = {
  name: string;
  description: string;
  owner: string;
  created: Date;
  entities: string[];
};

declare type CollectionModel = CollectionStruct & {
  _id: string;
};

// Entity types
declare type EntityStruct = {
  name: string;
  created: string;
  owner: string;
  description: string;
  collections: string[];
  associations: {
    origin: { name: string; id: string };
    products: { name: string; id: string }[];
  };
  attributes: AttributeStruct[];
};

export type EntityModel = EntityStruct & {
  _id: string;
};