import { ReactElement } from "react";

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
export type ParameterStruct = {
  identifier: string;
  name: string;
  type: "number" | "url" | "date" | "string" | "entity";
  data: number | string | ReactElement;
};

export type ParameterActions = {
  disabled: boolean;
  showRemove?: boolean;
  onRemove?: (identifier: string) => void;
  onUpdate?: (data: ParameterStruct) => void;
};

export type ParameterProps = ParameterStruct & ParameterActions;

export type ParameterGroupProps = ParameterActions & {
  parameters: ParameterStruct[];
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