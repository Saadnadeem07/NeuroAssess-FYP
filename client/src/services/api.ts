/**
 * This file is responsible for setting up and configuring the Axios instance
 * that will be used to make HTTP requests to the backend API. It includes
 * custom methods, request interceptors, and default configurations such as
 * base URL, headers, and timeout settings.
 *
 * On an abstract level, this file serves as a centralized service for
 * handling API communication, ensuring that all requests are properly
 * authenticated and configured before being sent to the server.
 */

import axios, { AxiosInstance } from "axios";

// Extend the AxiosInstance type to include our custom methods
interface CustomAxiosInstance extends AxiosInstance {
  checkAuth: () => Promise<boolean>;
}

// Get the API URL from environment variables or use a fallback
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
console.log("Using API URL:", apiUrl);

// Create an axios instance with default config
const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable cookies for cross-origin requests
  timeout: 30000, // Increase timeout to 30 seconds
}) as CustomAxiosInstance;

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`,
      config.data
    );

    // Get token from localStorage
    const token = localStorage.getItem("token");

    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Added token to request headers");
    } else {
      console.warn("No authentication token found in localStorage");
    }

    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(
      `API Response: ${response.status} ${response.config.url}`,
      response.data
    );
    return response;
  },
  (error) => {
    // Log the error details
    console.error("API Response Error:", error);

    if (error.response) {
      console.error(`API Error ${error.response.status}:`, error.response.data);

      // Handle unauthorized errors (401)
      if (error.response.status === 401) {
        console.error("Unauthorized access detected. Redirecting to login...");
        // Clear local storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Get the current role to determine where to redirect
        const currentRole = localStorage.getItem("currentRole");

        // Add a small delay before redirecting to allow the error to be handled
        setTimeout(() => {
          // Redirect based on role
          if (currentRole === "admin") {
            window.location.href = "/admin/login";
          } else if (currentRole === "psychiatrist") {
            window.location.href = "/login"; // Regular login page for psychiatrists
          } else {
            window.location.href = "/login"; // Default to regular login
          }
        }, 1000);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Network Error - No response received:", error.request);
      console.error("Request details:", {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        headers: error.config?.headers,
      });

      // Check if the error is due to network connectivity
      if (!navigator.onLine) {
        error.message =
          "You are currently offline. Please check your internet connection and try again.";
      } else {
        error.message =
          "Network Error: Unable to connect to the server. Please check your internet connection and server status.";
      }

      // Add a flag to indicate this is a network error (for retry logic)
      error.isNetworkError = true;
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up request:", error.message);
    }

    return Promise.reject(error);
  }
);

// Add a method to check authentication status
api.checkAuth = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return false;
    }

    // Get the current role
    const currentRole = localStorage.getItem("currentRole");
    if (!currentRole) {
      return false;
    }

    // Try to get the current user profile to verify the token is valid
    // Use the appropriate endpoint based on role
    const endpoint = `/auth/${currentRole}/me`;
    const response = await api.get(endpoint);
    return response.data.success;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
};

export default api;
