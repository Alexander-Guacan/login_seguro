export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type OperationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };
