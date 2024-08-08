// Utility functions and libraries
import _ from "lodash";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Custom types
import { RequestMethod, ServerResponse } from "@types";

// Get the URL of the database
import { API_URL, STATIC_URL, TOKEN_KEY } from "src/variables";

// Token for request authorization
import { getToken } from "src/util";

export const request = async <T>(
  type: RequestMethod,
  path: string,
  data?: any,
  options?: AxiosRequestConfig,
): Promise<ServerResponse<T>> => {
  // Merge in options if specified
  const requestOptions: AxiosRequestConfig = {
    ...options,
  };

  // Configure authorization
  if (!_.isUndefined(getToken(TOKEN_KEY))) {
    requestOptions.headers = {
      token: getToken(TOKEN_KEY)?.token,
      ...requestOptions.headers,
    };
  }

  // Execute request and store response if successful
  let response: AxiosResponse;
  switch (type) {
    case "GET":
      try {
        response = await axios.get(`${API_URL}${path}`, requestOptions);
      } catch {
        return {
          success: false,
          message: "Error while making request, check connectivity",
          data: {} as T,
        };
      }
      if (!response) {
        return {
          success: false,
          message: "No response received from server",
          data: {} as T,
        };
      }
      break;
    case "POST":
      // POST request
      try {
        response = await axios.post(`${API_URL}${path}`, data, requestOptions);
      } catch {
        return {
          success: false,
          message: "Error while making request, check connectivity",
          data: {} as T,
        };
      }
      const contentTypeHeader = response.headers["content-type"];
      if (_.isNull(contentTypeHeader)) {
        return {
          success: false,
          message: "Invalid response received from server",
          data: {} as T,
        };
      } else if (
        _.startsWith(contentTypeHeader, "application/json") &&
        !_.isEqual(response.statusText, "OK")
      ) {
        return {
          success: false,
          message: "Invalid JSON response received from server",
          data: {} as T,
        };
      }
      break;
    case "DELETE":
      // DELETE request
      try {
        response = await axios.delete(`${API_URL}${path}`, requestOptions);
      } catch {
        return {
          success: false,
          message: "Error while making request, check connectivity",
          data: {} as T,
        };
      }
      break;
  }

  // Return an object containing the response data and status
  return {
    success: true,
    message: "Recieved response from server",
    data: response.data,
  };
};

export const requestStatic = async <T>(
  path: string,
  options?: AxiosRequestConfig,
): Promise<ServerResponse<T>> => {
  // Merge in options if specified
  const requestOptions: AxiosRequestConfig = {
    ...options,
  };

  // Configure authorization
  if (!_.isUndefined(getToken(TOKEN_KEY))) {
    requestOptions.headers = {
      token: getToken(TOKEN_KEY)?.token,
      ...requestOptions.headers,
    };
  }

  // Execute request and store response if successful
  let response: AxiosResponse;
  try {
    response = await axios.get(`${STATIC_URL}${path}`, requestOptions);
  } catch {
    return {
      success: false,
      message: "Error while making request, check connectivity",
      data: {} as T,
    };
  }

  if (!response) {
    return {
      success: false,
      message: "No response received from server",
      data: {} as T,
    };
  }

  // Return an object containing the response data and status
  return {
    success: true,
    message: "Recieved response from server",
    data: response.data,
  };
};
