import { useMemo, useSyncExternalStore } from "react";
import _ from "lodash";

// GraphQL
import { ApolloClient, DocumentNode, OperationVariables } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";

type WatchQueryState<TData> = {
  data: TData | undefined;
  loading: boolean;
  error: Error | undefined;
};

/**
 * Store that polls a query outside of React's render cycle, only notifying
 * subscribers when the polled data has actually changed
 */
const createWatchQueryStore = <TData, TVariables extends OperationVariables>(
  client: ApolloClient,
  query: DocumentNode,
  variables: TVariables,
  pollInterval: number,
) => {
  let snapshot: WatchQueryState<TData> = { data: undefined, loading: true, error: undefined };
  const listeners = new Set<() => void>();

  const notify = (next: WatchQueryState<TData>) => {
    if (_.isEqual(next, snapshot)) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const observable = client.watchQuery<TData, TVariables>({
    query,
    variables,
    fetchPolicy: "network-only",
    pollInterval,
  });

  const subscription = observable.subscribe({
    next: (result) => {
      if (!result.data) return;
      notify({ data: result.data as TData, loading: false, error: undefined });
    },
    error: (error: Error) => notify({ ...snapshot, loading: false, error }),
  });

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          subscription.unsubscribe();
        }
      };
    },
    getSnapshot: () => snapshot,
  };
};

/**
 * Poll a GraphQL query outside of React's render cycle, re-rendering the
 * calling component only when the polled data actually changes
 */
export const useWatchQuery = <TData, TVariables extends OperationVariables = OperationVariables>(
  query: DocumentNode,
  variables: TVariables,
  pollInterval = 5000,
): WatchQueryState<TData> => {
  const client = useApolloClient();
  const variablesKey = JSON.stringify(variables);

  const store = useMemo(
    () => createWatchQueryStore<TData, TVariables>(client, query, variables, pollInterval),
    [client, query, variablesKey, pollInterval],
  );

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
