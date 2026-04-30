import React, { createContext, useContext, useMemo } from "react";

// GraphQL
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Custom types
import { UserFeatures } from "@types";

const GET_CURRENT_USER_FEATURES = gql`
  query GetCurrentUserFeatures {
    currentUserFeatures {
      ai
      api
    }
  }
`;

type FeaturesContextValue = {
  features: UserFeatures;
};

const defaultFeatures: UserFeatures = { ai: false, api: false };

const FeaturesContext = createContext<FeaturesContextValue>({ features: defaultFeatures });

export const FeaturesProvider = (props: { children: React.JSX.Element }) => {
  const { data } = useQuery<{ currentUserFeatures: UserFeatures }>(GET_CURRENT_USER_FEATURES, {
    fetchPolicy: "network-only",
  });

  const value = useMemo<FeaturesContextValue>(
    () => ({ features: data?.currentUserFeatures ?? defaultFeatures }),
    [data?.currentUserFeatures],
  );

  return <FeaturesContext.Provider value={value}>{props.children}</FeaturesContext.Provider>;
};

export const useFeatures = () => {
  return useContext(FeaturesContext);
};
