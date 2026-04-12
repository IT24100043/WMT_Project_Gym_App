// API Configuration
// Change the IP address here to update all API endpoints throughout the app

const IP = '10.164.236.186';
const PORT = '5000';

export const API_BASE_URL = `http://${IP}:${PORT}`;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  GYM_LOGIN: `${API_BASE_URL}/api/gyms/gym-login`,
  USER_LOGIN: `${API_BASE_URL}/api/users/user-login`,
  GYM_ROLE: `${API_BASE_URL}/api/gyms/gym-role`,
  USER_ROLE: `${API_BASE_URL}/api/users/user-role`,
  
  // Registration endpoints
  GYM_REGISTER: `${API_BASE_URL}/api/gyms/gym-register`,
  USER_REGISTER: `${API_BASE_URL}/api/users/user-register`,

  // Gym profile endpoints
  GYM_DETAILS: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-details/${gymId}`,
  GYM_UPDATE_PROFILE: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-profile/${gymId}`,
  GYM_UPDATE_CONTACT: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-contact-number/${gymId}`,
  GYM_UPDATE_PASSWORD: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-update-password/${gymId}`,
  GYM_DELETE: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-delete/${gymId}`,

  // User profile endpoints
  USER_DETAILS: (userId: string) => `${API_BASE_URL}/api/users/user-details/${userId}`,
  USER_UPDATE_CONTACT: (userId: string) => `${API_BASE_URL}/api/users/user-contact/${userId}`,
  USER_UPDATE_PASSWORD: (userId: string) => `${API_BASE_URL}/api/users/user-password/${userId}`,
  USER_DELETE: (userId: string) => `${API_BASE_URL}/api/users/user-delete/${userId}`,
};
