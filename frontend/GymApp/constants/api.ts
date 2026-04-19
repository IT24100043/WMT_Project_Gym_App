// API Configuration
// Change the IP address here to update all API endpoints throughout the app

const IP = '192.168.1.5';
const PORT = '5000';

export const API_BASE_URL = `http://${IP}:${PORT}`;

// API Endpoints
export const API_ENDPOINTS = {
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`,

  // Auth endpoints
  GYM_LOGIN: `${API_BASE_URL}/api/gyms/gym-login`,
  USER_LOGIN: `${API_BASE_URL}/api/users/user-login`,
  COACH_LOGIN: `${API_BASE_URL}/api/coaches/coach-login`,
  ADMIN_LOGIN: `${API_BASE_URL}/api/admins/admin-login`,
  GYM_ROLE: `${API_BASE_URL}/api/gyms/gym-role`,
  USER_ROLE: `${API_BASE_URL}/api/users/user-role`,
  COACH_ROLE: `${API_BASE_URL}/api/coaches/coach-role`,
  ADMIN_ROLE: `${API_BASE_URL}/api/admins/admin-role`,
  
  // Registration endpoints
  GYM_REGISTER: `${API_BASE_URL}/api/gyms/gym-register`,
  USER_REGISTER: `${API_BASE_URL}/api/users/user-register`,
  COACH_REGISTER: `${API_BASE_URL}/api/coaches/coach-register`,
  ADMIN_REGISTER: `${API_BASE_URL}/api/admins/admin-register`,

  // Gym profile endpoints
  GYM_DETAILS: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-details/${gymId}`,
  GYM_UPDATE_PROFILE: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-profile/${gymId}`,
  GYM_UPDATE_CONTACT: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-contact-number/${gymId}`,
  GYM_UPDATE_PASSWORD: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-update-password/${gymId}`,
  GYM_DELETE: (gymId: string) => `${API_BASE_URL}/api/gyms/gym-delete/${gymId}`,

  // User profile endpoints
  USER_DETAILS: (userId: string) => `${API_BASE_URL}/api/users/user-details/${userId}`,
  USER_UPDATE_PROFILE: (userId: string) => `${API_BASE_URL}/api/users/user-profile/${userId}`,
  USER_UPDATE_CONTACT: (userId: string) => `${API_BASE_URL}/api/users/user-contact/${userId}`,
  USER_UPDATE_PASSWORD: (userId: string) => `${API_BASE_URL}/api/users/user-password/${userId}`,
  USER_DELETE: (userId: string) => `${API_BASE_URL}/api/admins/admin-delete-user/${userId}`,
  USER_GET_ALL: `${API_BASE_URL}/api/admins/admin-all-users`,

  // Admin profile endpoints
  ADMIN_DETAILS: (adminId: string) => `${API_BASE_URL}/api/admins/admin-details/${adminId}`,
  ADMIN_UPDATE_PROFILE: (adminId: string) => `${API_BASE_URL}/api/admins/admin-profile/${adminId}`,
  ADMIN_UPDATE_CONTACT: (adminId: string) => `${API_BASE_URL}/api/admins/admin-contact/${adminId}`,
  ADMIN_UPDATE_PASSWORD: (adminId: string) => `${API_BASE_URL}/api/admins/admin-password/${adminId}`,
  ADMIN_DELETE: (adminId: string) => `${API_BASE_URL}/api/admins/admin-delete/${adminId}`,
  COACH_GET_ALL: `${API_BASE_URL}/api/admins/admin-all-coaches`,
  COACH_DELETE: (coachId: string) => `${API_BASE_URL}/api/admins/admin-delete-coach/${coachId}`,
  GYM_GET_ALL: `${API_BASE_URL}/api/admins/admin-all-gyms`,
  GYM_DELETE_BY_ADMIN: (gymId: string) => `${API_BASE_URL}/api/admins/admin-delete-gym/${gymId}`,
  ADMIN_GET_ALL: `${API_BASE_URL}/api/admins/admin-all-admins`,
  ADMIN_DELETE_BY_ADMIN: (adminId: string) => `${API_BASE_URL}/api/admins/admin-delete-admin/${adminId}`,

  // Gym Info endpoints
  GYM_INFO_BY_GYM_ID: (gymId: string) => `${API_BASE_URL}/api/gyminfo/info-by-gym/${gymId}`,
  GYM_INFO_CREATE: (gymId: string) => `${API_BASE_URL}/api/gyminfo/info-create/${gymId}`,
  GYM_INFO_UPDATE_DESCRIPTION: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-update-information/${infoId}`,
  GYM_INFO_UPDATE_OPEN_HOURS: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-update-open-hours/${infoId}`,
  GYM_INFO_UPDATE_CLOSE_HOURS: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-update-close-hours/${infoId}`,
  GYM_INFO_UPDATE_CONTACT_NUMBER: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-update-contact-number/${infoId}`,
  GYM_INFO_UPDATE_CITY: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-update-city/${infoId}`,
  GYM_INFO_ADD_FACILITY: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-add-fasility/${infoId}`,
  GYM_INFO_DELETE_FACILITY: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-delete-fasility/${infoId}`,
  GYM_INFO_ADD_PACKAGE: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-add-package/${infoId}`,
  GYM_INFO_DELETE_PACKAGE: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-delete-package/${infoId}`,
  GYM_INFO_DELETE: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-delete-info/${infoId}`,
  GYM_INFO_UPDATE_IMAGE: (infoId: string) => `${API_BASE_URL}/api/gyminfo/info-update-image/${infoId}`,
  GYM_INFO_ALL_INFORMATION: `${API_BASE_URL}/api/gyminfo/info-all-information`,

  // Workout endpoints
  WORKOUTS: `${API_BASE_URL}/api/workouts`,
  WORKOUTS_BY_USER: (userId: string) => `${API_BASE_URL}/api/workouts/user/${userId}`,
  WORKOUT_BY_ID: (workoutId: string) => `${API_BASE_URL}/api/workouts/${workoutId}`,
  WORKOUT_ACTIVATE: (workoutId: string) => `${API_BASE_URL}/api/workouts/${workoutId}/activate`,

  // Session endpoints
  SESSION_FINISH: `${API_BASE_URL}/api/sessions/finish`,

  // AI endpoints
  AI_GENERATE_ROUTINE: `${API_BASE_URL}/api/ai/generate-routine`,

  // Progress endpoints
  PROGRESS: (userId: string) => `${API_BASE_URL}/api/progress/${userId}`,

  // Coaching endpoints
  COACHING: (userId: string) => `${API_BASE_URL}/api/coaching/${userId}`,
  COACHING_APPLY: `${API_BASE_URL}/api/coaching/apply`,
  COACHING_DISMISS: `${API_BASE_URL}/api/coaching/dismiss`,
};

