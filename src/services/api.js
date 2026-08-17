const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://kec-bus-connect-backend.onrender.com/api';

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
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await handleResponse(res);
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role.toLowerCase());
        localStorage.setItem('userEmail', data.user.email);
        if (data.student) {
          localStorage.setItem('kec_current_user', JSON.stringify(data.student));
        }
      }
      return data;
    } catch (err) {
      console.warn('Backend login connection notice:', err.message);
      const cleanEmail = (email || '').toLowerCase().trim();
      const cleanPass = (password || '').trim();

      // Offline / Cold-Start demo login fallback
      if (cleanEmail === 'driver@kec.ac.in' && cleanPass === 'password') {
        const mockData = {
          success: true,
          token: 'mock-driver-jwt-' + Date.now(),
          user: { email: 'driver@kec.ac.in', role: 'DRIVER' }
        };
        localStorage.setItem('token', mockData.token);
        localStorage.setItem('role', 'driver');
        localStorage.setItem('userEmail', 'driver@kec.ac.in');
        return mockData;
      } else if ((cleanEmail === 'student@kec.ac.in' || cleanEmail.startsWith('student')) && cleanPass === 'password') {
        const mockStudent = {
          id: '6a815bf24bab75791989cc01',
          fullName: 'Rohan Sharma',
          studentId: '22KEC401',
          mobile: '9888877777',
          collegeType: 'Engineering',
          program: 'B.Tech',
          department: 'CSE',
          academicYear: 3,
          section: 'A',
          batch: '2023 - 2027',
          boardingPoint: 'Attikuppam (Origin)',
          assignedBus: 'KEC-07',
          email: cleanEmail
        };
        const mockData = {
          success: true,
          token: 'mock-student-jwt-' + Date.now(),
          user: { email: cleanEmail, role: 'STUDENT' },
          student: mockStudent
        };
        localStorage.setItem('token', mockData.token);
        localStorage.setItem('role', 'student');
        localStorage.setItem('userEmail', cleanEmail);
        localStorage.setItem('kec_current_user', JSON.stringify(mockStudent));
        return mockData;
      } else if (cleanEmail === 'admin@kec.ac.in' && cleanPass === 'admin123') {
        const mockData = {
          success: true,
          token: 'mock-admin-jwt-' + Date.now(),
          user: { email: 'admin@kec.ac.in', role: 'ADMIN' }
        };
        localStorage.setItem('token', mockData.token);
        localStorage.setItem('role', 'admin');
        localStorage.setItem('userEmail', 'admin@kec.ac.in');
        return mockData;
      }

      throw new Error(err.message === 'Failed to fetch' 
        ? 'Backend service is starting up on Render. Please wait a moment and try again.' 
        : err.message
      );
    }
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

  getBoardingLocation: async () => {
    const res = await fetch(`${API_BASE_URL}/student/boarding-location`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateBoardingLocation: async (locationData) => {
    const res = await fetch(`${API_BASE_URL}/student/boarding-location`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(locationData),
    });
    return handleResponse(res);
  },

  confirmOnBus: async (tripId) => {
    const res = await fetch(`${API_BASE_URL}/student/trips/${tripId}/confirm`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  notOnBus: async (tripId) => {
    const res = await fetch(`${API_BASE_URL}/student/trips/${tripId}/not-on-bus`, {
      method: 'POST',
      headers: getHeaders(),
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

  getLiveBusStatus: async (busId) => {
    const res = await fetch(`${API_BASE_URL}/buses/${busId}/live`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getBusStatus: async (busId) => {
    const res = await fetch(`${API_BASE_URL}/buses/${busId}/status`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Driver Dedicated APIs
  startDriverTrip: async (busId) => {
    const res = await fetch(`${API_BASE_URL}/driver/trips/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ busId }),
    });
    return handleResponse(res);
  },

  stopDriverTrip: async (tripId) => {
    const res = await fetch(`${API_BASE_URL}/driver/trips/${tripId}/stop`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateDriverBusLocation: async (busId, locationData) => {
    const res = await fetch(`${API_BASE_URL}/driver/buses/${busId}/location`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(locationData),
    });
    return handleResponse(res);
  },

  requestPassengerConfirmation: async (tripId) => {
    const res = await fetch(`${API_BASE_URL}/driver/trips/${tripId}/passenger-request`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getPassengerSummary: async (tripId) => {
    const res = await fetch(`${API_BASE_URL}/driver/trips/${tripId}/passengers`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getActiveDriverTrip: async (busId) => {
    const res = await fetch(`${API_BASE_URL}/driver/trips/active/${busId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Fallback Bus start/stop APIs
  startTrip: async (busId) => {
    try {
      return await api.startDriverTrip(busId);
    } catch {
      const res = await fetch(`${API_BASE_URL}/buses/${busId}/start`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  stopTrip: async (busId) => {
    try {
      const active = await api.getActiveDriverTrip(busId);
      if (active && active.id) {
        return await api.stopDriverTrip(active.id);
      }
    } catch {
      // fallback
    }
    const res = await fetch(`${API_BASE_URL}/buses/${busId}/stop`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateBusLocation: async (busId, locationData) => {
    try {
      return await api.updateDriverBusLocation(busId, locationData);
    } catch {
      const res = await fetch(`${API_BASE_URL}/buses/${busId}/location`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(locationData),
      });
      return handleResponse(res);
    }
  },

  // Route Public APIs
  getActiveRoutes: async () => {
    const res = await fetch(`${API_BASE_URL}/routes`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Geocoding Proxy APIs
  reverseGeocode: async (lat, lng) => {
    const res = await fetch(`${API_BASE_URL}/geocoding/reverse?lat=${lat}&lng=${lng}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Admin APIs
  getAdminStats: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAllStudents: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/students`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createBus: async (busData) => {
    const res = await fetch(`${API_BASE_URL}/admin/buses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(busData),
    });
    return handleResponse(res);
  },

  updateBus: async (id, busData) => {
    const res = await fetch(`${API_BASE_URL}/admin/buses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(busData),
    });
    return handleResponse(res);
  },

  deleteBus: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/buses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
