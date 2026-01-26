import instance from "./instance"; // Assuming 'instance' is your configured axios instance

const authServices = {
  /**
   * @desc    Register a new user
   * @param   {object} data User registration data (username, email, password)
   */
  register: async (data) => {
    return await instance.post('/auth/register', data);
  },

  /**
   * @desc    Login a user
   * @param   {object} data User login data (email, password)
   */
  login: async (data) => {
    return await instance.post('/auth/login', data);
  },

  /**
   * @desc    Logout the current user
   */
  logout: async () => {
    // 1. Remove the user object from local storage. This is the primary
    //    client-side action that logs the user out of the UI.
    localStorage.removeItem('user');
    
    // 2. Make a request to the backend. The backend will clear the
    //    secure httpOnly cookie, completing the server-side logout.
    return await instance.post('/auth/logout');
  },

  /**
   * @desc    Get the current logged-in user's info
   */
  me: async (data) => {
    return await instance.get('/auth/me',data);
  }
};

export default authServices;
