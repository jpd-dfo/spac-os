import type { ApiResponse, PaginatedResponse, ApiError } from '@/types';

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Default fetch options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Generic API request handler
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        code: data.code || 'UNKNOWN_ERROR',
        message: data.message || 'An error occurred',
        details: data.details,
      } as ApiError;
    }

    return {
      data: data.data || data,
      success: true,
      message: data.message,
    };
  } catch (error) {
    if ((error as ApiError).code) {
      throw error;
    }

    throw {
      code: 'NETWORK_ERROR',
      message: 'Network error occurred',
      details: error,
    } as ApiError;
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 */
export async function put<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request
 */
export async function patch<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'DELETE' });
}

/**
 * Paginated GET request
 */
export async function getPaginated<T>(
  endpoint: string,
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<T>> {
  const response = await get<PaginatedResponse<T>>(
    `${endpoint}?page=${page}&pageSize=${pageSize}`
  );
  return response.data;
}

// API endpoints for different resources
export const api = {
  // SPACs
  spacs: {
    list: () => get('/spacs'),
    get: (id: string) => get(`/spacs/${id}`),
    create: (data: Record<string, unknown>) => post('/spacs', data),
    update: (id: string, data: Record<string, unknown>) => put(`/spacs/${id}`, data),
    delete: (id: string) => del(`/spacs/${id}`),
  },

  // Targets
  targets: {
    list: (spacId?: string) =>
      get(spacId ? `/spacs/${spacId}/targets` : '/targets'),
    get: (id: string) => get(`/targets/${id}`),
    create: (data: Record<string, unknown>) => post('/targets', data),
    update: (id: string, data: Record<string, unknown>) => put(`/targets/${id}`, data),
    delete: (id: string) => del(`/targets/${id}`),
  },

  // Documents
  documents: {
    list: (params?: { spacId?: string; targetId?: string }) => {
      const query = new URLSearchParams();
      if (params?.spacId) query.set('spacId', params.spacId);
      if (params?.targetId) query.set('targetId', params.targetId);
      const queryString = query.toString();
      return get(`/documents${queryString ? `?${queryString}` : ''}`);
    },
    get: (id: string) => get(`/documents/${id}`),
    create: (data: Record<string, unknown>) => post('/documents', data),
    update: (id: string, data: Record<string, unknown>) => put(`/documents/${id}`, data),
    delete: (id: string) => del(`/documents/${id}`),
  },

  // Filings
  filings: {
    list: (spacId?: string) =>
      get(spacId ? `/spacs/${spacId}/filings` : '/filings'),
    get: (id: string) => get(`/filings/${id}`),
    create: (data: Record<string, unknown>) => post('/filings', data),
    update: (id: string, data: Record<string, unknown>) => put(`/filings/${id}`, data),
    delete: (id: string) => del(`/filings/${id}`),
  },

  // Tasks
  tasks: {
    list: (params?: { spacId?: string; assigneeId?: string }) => {
      const query = new URLSearchParams();
      if (params?.spacId) query.set('spacId', params.spacId);
      if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
      const queryString = query.toString();
      return get(`/tasks${queryString ? `?${queryString}` : ''}`);
    },
    get: (id: string) => get(`/tasks/${id}`),
    create: (data: Record<string, unknown>) => post('/tasks', data),
    update: (id: string, data: Record<string, unknown>) => put(`/tasks/${id}`, data),
    delete: (id: string) => del(`/tasks/${id}`),
  },

  // Contacts
  contacts: {
    list: () => get('/contacts'),
    get: (id: string) => get(`/contacts/${id}`),
    create: (data: Record<string, unknown>) => post('/contacts', data),
    update: (id: string, data: Record<string, unknown>) => put(`/contacts/${id}`, data),
    delete: (id: string) => del(`/contacts/${id}`),
  },

  // Users
  users: {
    me: () => get('/users/me'),
    get: (id: string) => get(`/users/${id}`),
    update: (id: string, data: Record<string, unknown>) => put(`/users/${id}`, data),
  },
};
