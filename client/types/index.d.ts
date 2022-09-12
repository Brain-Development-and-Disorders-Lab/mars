// Types for incrementally creating a new sample.

import { ReactElement } from "react";

// A new type is declared for each step.
declare namespace Create {
  type Base = {
    from: "none" | "start" | "associations" | "attributes";
  };

  type Start = Base & {
    name: string;
    created: string;
    owner: string;
    collection: { name: string; id: string };
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

export type AttributeStruct = {
  name: string;
  description: string;
  type: "physical" | "digital";
  blocks: BlockStruct[];
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

export type CollectionStruct = {
  name: string;
  description: string;
  blocks: string[];
  associations: {
    samples: string[];
  };
};

export type CollectionModel = CollectionStruct & {
  _id: string;
};

export type SampleStruct = {
  name: string;
  created: string;
  owner: string;
  collection: { name: string; id: string };
  description: string;
  collections: { name: string; id: string }[];
  associations: {
    origin: { name: string; id: string };
    products: { name: string; id: string }[];
  };
  attributes: AttributeStruct[];
};

export type SampleModel = SampleStruct & {
  _id: string;
};

export type BlockStruct = {
  identifier: string;
  name: string;
  type: "number" | "file" | "url" | "date" | "string" | "sample";
  data: number | string | ReactElement;
};

export type BlockProps = BlockStruct & {
  disabled: boolean;
  dataCallback?: (data: BlockStruct) => void;
  removeCallback?: (identifier: string) => void;
};

export type BlockGroupProps = {
  disabled: boolean;
  blocks: BlockStruct[];
  onRemove?: (identifier: string) => void;
  onDataUpdate?: (data: BlockStruct) => void;
};

declare type LinkyProps = {
  type: "samples" | "collections" | "attributes";
  id: string;
};
