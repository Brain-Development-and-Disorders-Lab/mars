import { gql } from "@apollo/client";

// GraphQL documents hoisted to module scope so they are not recreated on each render
export const PREPARE_ENTITY_CSV = gql`
  mutation PrepareEntityCSV($file: [Upload]!) {
    prepareEntityCSV(file: $file) {
      name
      inferredType
    }
  }
`;

export const GET_MAPPING_DATA = gql`
  query GetMappingData {
    projects {
      _id
      name
    }
    templates {
      _id
      name
      description
      owner
      values {
        _id
        data
        name
        type
      }
    }
  }
`;

export const REVIEW_ENTITY_CSV = gql`
  mutation ReviewEntityCSV($columnMapping: ColumnMappingInput, $file: [Upload]!) {
    reviewEntityCSV(columnMapping: $columnMapping, file: $file) {
      success
      message
      data {
        name
        state
        warnings
      }
    }
  }
`;

export const GET_COUNTER_VALUES = gql`
  query GetCounterValues($_id: String!, $count: Int!) {
    nextCounterValues(_id: $_id, count: $count) {
      success
      message
      data
    }
  }
`;

export const SUGGEST_COLUMN_MAPPING = gql`
  query SuggestColumnMapping($columns: [String]!) {
    suggestColumnMapping(columns: $columns) {
      name
      description
    }
  }
`;

export const IMPORT_ENTITY_CSV = gql`
  mutation ImportEntityCSV($columnMapping: ColumnMappingInput, $file: [Upload]!, $options: OptionsInput) {
    importEntityCSV(columnMapping: $columnMapping, file: $file, options: $options) {
      success
      message
    }
  }
`;

export const REVIEW_ENTITY_JSON = gql`
  mutation ReviewEntityJSON($file: [Upload]!) {
    reviewEntityJSON(file: $file) {
      success
      message
      data {
        name
        state
      }
    }
  }
`;

export const IMPORT_ENTITY_JSON = gql`
  mutation ImportEntityJSON($file: [Upload]!, $project: String, $attributes: [AttributeInput]) {
    importEntityJSON(file: $file, project: $project, attributes: $attributes) {
      success
      message
    }
  }
`;

export const REVIEW_TEMPLATE_JSON = gql`
  mutation ReviewTemplateJSON($file: [Upload]!) {
    reviewTemplateJSON(file: $file) {
      success
      message
      data {
        name
        state
      }
    }
  }
`;

export const IMPORT_TEMPLATE_JSON = gql`
  mutation ImportTemplateJSON($file: [Upload]!) {
    importTemplateJSON(file: $file) {
      success
      message
    }
  }
`;
