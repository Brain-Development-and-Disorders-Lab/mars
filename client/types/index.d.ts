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
  key: number;
  name: string;
  type: "Sample" | "Number" | "Data"
  value: string;
};
