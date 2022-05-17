// Types for incrementally creating a new sample.
// A new type is declared for each step.
declare namespace Create {
  type Start = {
    id: string;
    created: string;
    project: {name: string, id: string};
    description: string;
  };

  type Associations = Start & {
    projects: {name: string, id: string}[];
    origin: string;
    products: {name: string, id: string}[];
  };
}

declare type ParameterStruct = {
  _id: string;
  name: string;
  description: string;
  type: "sample" | "number" | "data";
  attributes: string[];
  associations: {
    origin: string;
    products: string[];
  }
};

declare type ParameterProps = {
  key: string;
  name: string;
  description: string;
  type?: "sample" | "number" | "data";
  attributes?: string[];
  associations?: {
    origin?: string;
    products?: string[];
  };
}

declare type ProjectStruct = {
  _id: string;
  name: string;
  description: string;
  attributes: string[];
  associations: {
    samples: string[];
  };
}

declare type SampleStruct = {
  _id: string;
  name: string;
  created: string;
  owner: string;
  projects: string[];
  origin: string;
  storage: {
    types: string[];
    data: { type: string, location: string }[];
  };
  associations: {
    origins: string[];
    products: string[];
  };
  parameters: string[];
}

declare type LinkyProps = {
  type: "samples" | "projects" | "parameters";
  id: string;
}
