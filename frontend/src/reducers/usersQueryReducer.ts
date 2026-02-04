import type { GetAllUsersQuery } from "../services/user.service";

type Action =
  | { type: "previousPage" }
  | { type: "nextPage" }
  | { type: "search"; payload: string }
  | { type: "reset" };

export function createInitialState(): GetAllUsersQuery {
  return {
    page: 1,
    limit: 10,
  };
}

export function usersQueryReducer(
  previousState: GetAllUsersQuery,
  action: Action,
): GetAllUsersQuery {
  switch (action.type) {
    case "previousPage": {
      return {
        page: !previousState.page ? 1 : previousState?.page - 1,
      };
    }

    case "nextPage": {
      return {
        page: !previousState.page ? 1 : previousState?.page + 1,
      };
    }

    case "search": {
      return {
        search: action.payload,
      };
    }

    case "reset": {
      return createInitialState();
    }

    default: {
      return previousState;
    }
  }
}
