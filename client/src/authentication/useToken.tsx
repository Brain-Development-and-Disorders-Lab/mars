import { useState } from "react";

const TOKEN_KEY = "MARS_token";

export const useToken = (): [ string, (token: string) => void ] => {
  const getToken = () => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);

    if (storedToken) {
      return JSON.parse(storedToken)?.token;
    }
    return undefined;
  };

  const [token, setToken] = useState(getToken());

  const storeToken = (token: string) => {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    setToken(token);
  };

  return [
    token,
    storeToken
  ];
};
