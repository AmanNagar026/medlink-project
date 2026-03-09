const AsyncStorage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

const API_BASE_URL = 'http://localhost:8080/api';

const getToken = async () => {
  return await AsyncStorage.getItem('@medlink_token');
};

const getHeaders = async (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Handle empty responses
  if (!contentType || !contentType.includes('application/json')) {
    if (response.status === 204 || response.status === 205) {
      return null; // No content
    }
    if (response.status >= 200 && response.status < 300) {
      return {}; // Empty successful response
    }
  }
  
  try {
    const data = await response.json();
    console.log('API Response:', response.status, data); // debug
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return data;
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error:', error);
      if (response.status >= 200 && response.status < 300) {
        return {}; // Return empty object for successful responses with invalid JSON
      }
      throw new Error(`Invalid JSON response from server`);
    }
    throw error;
  }
};

export const api = {
  get: async (endpoint, options = {}) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
      headers,
      signal: options.signal,
      ...options 
    });
    return handleResponse(response);
  },

  post: async (endpoint, body, auth = true, options = {}) => {
    const headers = await getHeaders(auth);
    console.log('POST', endpoint, body); // debug
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
      ...options
    });
    return handleResponse(response);
  },

  put: async (endpoint, body, options = {}) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
      ...options
    });
    return handleResponse(response);
  },

  patch: async (endpoint, body, options = {}) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
      ...options
    });
    return handleResponse(response);
  },

  delete: async (endpoint, options = {}) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      signal: options.signal,
      ...options
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return true;
  },
};

export default api;