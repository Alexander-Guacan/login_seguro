import { useEffect, useReducer, useState } from "react";
import { UserService } from "../../services/user.service";
import { User } from "../../models/user";
import type { PaginatedData } from "../../types";
import {
  createInitialState,
  usersQueryReducer,
} from "../../reducers/usersQueryReducer";

export function useUsers() {
  const [data, setData] = useState<PaginatedData<User> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, queryDispatch] = useReducer(
    usersQueryReducer,
    null,
    createInitialState,
  );

  const previousPage = () => {
    if (!query.page || query.page <= 1) return;

    queryDispatch({
      type: "previousPage",
    });
  };

  const nextPage = () => {
    if (!query.page || !data?.totalPages || query.page >= data.totalPages)
      return;

    queryDispatch({
      type: "nextPage",
    });
  };

  const search = (input: string) => {
    if (!input) return;

    queryDispatch({
      type: "search",
      payload: input,
    });
  };

  const resetSearch = () => {
    queryDispatch({ type: "reset" });
  };

  useEffect(() => {
    UserService.getAll(query ? query : undefined)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [query]);

  return {
    ...data,
    error,
    loading,
    nextPage,
    previousPage,
    search,
    resetSearch,
  };
}
