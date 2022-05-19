// Types for incrementally creating a new sample.

import { ReactElement } from "react";

// A new type is declared for each step.
declare namespace Create {
  type Start = {
    name: string;
    created: string;
    owner: string;
    group: { name: string; id: string };
    description: string;
  };

  type Associations = Start & {
    groups: { name: string; id: string }[];
    associations: {
      origin: { name: string; id: string };
      products: { name: string; id: string }[];
    };
  };

  type Parameters = Associations & {
    parameters: ParameterProps[];
  };
}

export type ParameterStruct = {
  name: string;
  description: string;
  type: "physical" | "digital";
  attributes: AttributeStruct[];
};

export type ParameterModel = ParameterStruct & {
  _id: string;
};

declare type ParameterProps = ParameterStruct & {
  identifier: string;
  dataCallback?: (data: ParameterProps) => void;
  removeCallback?: (identifier: string) => void;
};

declare type ParameterGroupProps = {
  parameters: ParameterModel[];
  onRemove?: (identifier: string) => void;
  onDataUpdate?: (data: ParameterProps) => void;
};

export type ParameterCardProps = {
  data: ParameterStruct;
};

export type GroupStruct = {
  name: string;
  description: string;
  attributes: string[];
  associations: {
    samples: string[];
  };
};

export type GroupModel = GroupStruct & {
  _id: string;
};

export type SampleStruct = {
  name: string;
  created: string;
  owner: string;
  group: { name: string; id: string };
  description: string;
  groups: { name: string; id: string }[];
  associations: {
    origin: { name: string; id: string };
    products: { name: string; id: string }[];
  };
  parameters: ParameterStruct[];
};

export type SampleModel = SampleStruct & {
  _id: string;
};

export type AttributeStruct = {
  identifier: string;
  name: string;
  type: "number" | "file" | "url" | "date" | "string" | "sample";
  data: number | string | ReactElement;
};

export type AttributeProps = AttributeStruct & {
  disabled: boolean;
  dataCallback?: (data: AttributeStruct) => void;
  removeCallback?: (identifier: string) => void;
};

export type AttributeGroupProps = {
  disabled: boolean;
  attributes: AttributeStruct[];
  onRemove?: (identifier: string) => void;
  onDataUpdate?: (data: AttributeStruct) => void;
};

declare type LinkyProps = {
  type: "samples" | "groups" | "parameters";
  id: string;
};
