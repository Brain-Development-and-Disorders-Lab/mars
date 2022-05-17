// Types for incrementally creating a new sample.
// A new type is declared for each step.
declare namespace Create {
  type Start = {
    id: string;
    created: string;
    project: string;
    description: string;
  };

  type Associations = Start & {
    projects: string[];
  };
}

declare type ParameterStruct = {
  _id: string;
  name: string;
  description: string;
  type: "sample" | "number" | "data" | "select";
  attributes: string[];
  associations: {
    parent: string;
    children: string[];
  }
};

declare type ParameterProps = {
  key: string;
  name: string;
  type: "sample" | "number" | "data" | "select";
}

declare type ProjectStruct = {
  _id: string;
  name: string;
  description: string;
  attributes: string[];
  attributes: {
    samples: string[];
  };
}

declare type SampleStruct = {
  _id: string;
  name: string;
  created: string;
  owner: string;
  projects: string[];
  storage: {
    types: string[];
    data: { type: string, location: string }[];
  };
  associations: {
    parents: string[];
    children: string[];
  };
  parameters: string[];
}
