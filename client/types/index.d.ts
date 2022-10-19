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
    created: string;
    owner: string;
    description: string;
  };
}

// Attributes
export type AttributeStruct = {
  name: string;
  description: string;
  type: "physical" | "digital";
  parameters: ParameterStruct[];
};

export type AttributeModel = AttributeStruct & {
  _id: string;
};

declare type AttributeProps = AttributeStruct & {
  identifier: string;
  dataCallback?: (data: AttributeProps) => void;
  removeCallback?: (identifier: string) => void;
};

declare type AttributeGroupProps = {
  attributes: AttributeModel[];
  onRemove?: (identifier: string) => void;
  onDataUpdate?: (data: AttributeProps) => void;
};

export type AttributeCardProps = {
  data: AttributeStruct;
};

// Parameters
export type ParameterStruct = {
  identifier: string;
  name: string;
  type: "number" | "file" | "url" | "date" | "string" | "entity";
  data: number | string | ReactElement;
};

export type ParameterProps = ParameterStruct & {
  disabled: boolean;
  dataCallback?: (data: ParameterStruct) => void;
  removeCallback?: (identifier: string) => void;
};

export type ParameterGroupProps = {
  disabled: boolean;
  parameters: ParameterStruct[];
  onRemove?: (identifier: string) => void;
  onDataUpdate?: (data: ParameterStruct) => void;
};

declare type LinkyProps = {
  type: "entities" | "collections" | "attributes";
  id: string;
};

export type CollectionStruct = {
  name: string;
  description: string;
  owner: string;
  created: string;
  entities: string[];
};

export type CollectionModel = CollectionStruct & {
  _id: string;
};

export type EntityStruct = {
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