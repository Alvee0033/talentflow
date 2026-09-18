export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function getPaginationOptions(params: PaginationParams) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;
  
  const order: Record<string, string> = {};
  if (params.sortBy) {
    order[params.sortBy] = params.sortOrder || 'ASC';
  } else {
    order['createdAt'] = 'DESC';
  }

  return { skip, take: limit, order };
}

export function buildPaginatedResponse<T>(data: T[], total: number, params: PaginationParams) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  return {
    items: data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}
