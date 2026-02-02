import { useEffect, useState } from "react";
import {
  type GetAllUsersQuery,
  UserService,
} from "../../services/user.service";
import { User } from "../../models/user";
import type { PaginatedData } from "../../types";

export function useUsers() {
  const [data, setData] = useState<PaginatedData<User> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<GetAllUsersQuery>({
    page: 1,
    limit: 10,
  });

  const previousPage = () => {
    if (!query.page || query.page <= 1) return;

    setQuery((previous) => {
      return {
        ...previous,
        page: !previous.page ? 1 : previous?.page - 1,
      };
    });
  };

  const nextPage = () => {
    if (!query.page || !data?.totalPages || query.page >= data.totalPages)
      return;

    setQuery((previous) => {
      return {
        ...previous,
        page: !previous.page ? 1 : previous?.page + 1,
      };
    });
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
  };
}
