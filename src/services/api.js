const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // Fallback if not JSON
    }
    throw new Error(errorMsg);
  }
  
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

export const api = {
  // Auth APIs
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role.toLowerCase());
      localStorage.setItem('userEmail', data.user.email);
    }
    return data;
  },

  signup: async (signupData) => {
    const res = await fetch(`${API_BASE_URL}/auth/student/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(signupData),
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Student APIs
  getMyProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/students/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateMyProfile: async (studentData) => {
    const res = await fetch(`${API_BASE_URL}/students/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(studentData),
    });
    return handleResponse(res);
  },

  boardBus: async (busId) => {
    const res = await fetch(`${API_BASE_URL}/students/board/${busId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Bus Public APIs
  getActiveBuses: async () => {
    const res = await fetch(`${API_BASE_URL}/buses`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getBusDetails: async (id) => {
    const res = await fetch(`${API_BASE_URL}/buses/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getBusLocation: async (busId) => {
    const res = await fetch(`${API_BASE_URL}/buses/${busId}/location`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Driver / Tracker APIs
  updateBusLocation: async (busId, locationData) => {
    const res = await fetch(`${API_BASE_URL}/buses/${busId}/location`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(locationData),
    });
    return handleResponse(res);
  },

  startTrip: async (busId) => {
    const res = await fetch(`${API_BASE_URL}/buses/${busId}/start`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  stopTrip: async (busId) => {
    const res = await fetch(`${API_BASE_URL}/buses/${busId}/stop`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Route Public APIs
  getActiveRoutes: async () => {
    const res = await fetch(`${API_BASE_URL}/routes`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getRouteDetails: async (id) => {
    const res = await fetch(`${API_BASE_URL}/routes/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Reverse Geocoding API
  reverseGeocode: async (lat, lng) => {
    const res = await fetch(`${API_BASE_URL}/geocoding/reverse?lat=${lat}&lng=${lng}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Admin APIs
  adminGetBuses: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/buses`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  adminCreateBus: async (busData) => {
    const res = await fetch(`${API_BASE_URL}/admin/buses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(busData),
    });
    return handleResponse(res);
  },

  adminUpdateBus: async (id, busData) => {
    const res = await fetch(`${API_BASE_URL}/admin/buses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(busData),
    });
    return handleResponse(res);
  },

  adminDeleteBus: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/buses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  adminGetRoutes: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/routes`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  adminCreateRoute: async (routeData) => {
    const res = await fetch(`${API_BASE_URL}/admin/routes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return handleResponse(res);
  },

  adminUpdateRoute: async (id, routeData) => {
    const res = await fetch(`${API_BASE_URL}/admin/routes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return handleResponse(res);
  },

  adminDeleteRoute: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/routes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  adminGetStudents: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/students`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  adminGetStudentDetails: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  }
};

export default api;
