export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function toPagination(page: number, pageSize: number): PaginationParams {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 20;
  return {
    page: safePage,
    pageSize: safePageSize
  };
}

export function offsetFromPagination(pagination: PaginationParams): number {
  return (pagination.page - 1) * pagination.pageSize;
}

export function toPaginatedResult<T>(items: T[], total: number, pagination: PaginationParams): PaginatedResult<T> {
  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.ceil(total / pagination.pageSize)
  };
}
