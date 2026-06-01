// Utility functions and libraries
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Custom types
import { ServerResponse } from "@types";

// Get the URL of the database
import { STATIC_URL } from "src/variables";

export const requestStatic = async <T>(path: string, options?: AxiosRequestConfig): Promise<ServerResponse<T>> => {
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
