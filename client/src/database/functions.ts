// Utility functions and libraries
import _ from "lodash";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Custom types
import { RequestMethod, ServerResponse } from "@types";

// Get the URL of the database
import { API_URL, STATIC_URL } from "src/variables";

// Authentication
import { auth } from "@lib/auth";

// Hooks
import { useStorage } from "@hooks/useStorage";

export const request = async <T>(
  type: RequestMethod,
  path: string,
  data?: any,
  options?: AxiosRequestConfig,
): Promise<ServerResponse<T>> => {
  // Get the current session
  const { data: sessionData, error: sessionError } = await auth.getSession();
  if (!sessionData || sessionError) {
    return {
      success: false,
      message: "Error while making request, check connectivity",
      data: {} as T,
    };
  }

  // Merge in options if specified
  const requestOptions: AxiosRequestConfig = {
    ...options,
  };

  // Add Workspace information
  const { storage } = useStorage();
  requestOptions.headers = {
    user: sessionData.user.id,
    workspace: storage.workspace,
    ...requestOptions.headers,
  };

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
      if (_.isNull(response.headers["content-type"])) {
        return {
          success: false,
          message: "Invalid response received from server",
          data: {} as T,
        };
      } else if (
        _.startsWith(response.headers["content-type"], "application/json") &&
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
