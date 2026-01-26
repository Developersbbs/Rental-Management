import instance from './instance';

const API_URL = '/inwards';

// Create new inward (GRN)
const createInward = async (inwardData) => {
  const response = await instance.post(API_URL, inwardData);
  return response.data;
};

// Get all inwards
const getInwards = async (filters = {}) => {
  const response = await instance.get(API_URL, { params: filters });
  return response.data;
};

// Get single inward
const getInward = async (inwardId) => {
  const response = await instance.get(`${API_URL}/${inwardId}`);
  return response.data;
};

// Update inward
const updateInward = async (inwardId, inwardData) => {
  const response = await instance.put(`${API_URL}/${inwardId}`, inwardData);
  return response.data;
};

// Delete inward
const deleteInward = async (inwardId) => {
  const response = await instance.delete(`${API_URL}/${inwardId}`);
  return response.data;
};

// Approve inward
const approveInward = async (inwardId) => {
  const response = await instance.put(`${API_URL}/${inwardId}/approve`);
  return response.data;
};

// Reject inward
const rejectInward = async (inwardId, rejectionReason) => {
  const response = await instance.put(`${API_URL}/${inwardId}/reject`, { rejectionReason });
  return response.data;
};

// Complete inward
const completeInward = async (inwardId) => {
  const response = await instance.put(`${API_URL}/${inwardId}/complete`);
  return response.data;
};

// Add inward items to inventory
const addToInventory = async (inwardId) => {
  const response = await instance.put(`${API_URL}/${inwardId}/add-to-inventory`);
  return response.data;
};

// Get inward statistics
const getInwardStats = async () => {
  const response = await instance.get(`${API_URL}/stats/overview`);
  return response.data;
};

const inwardService = {
  createInward,
  getInwards,
  getInward,
  updateInward,
  deleteInward,
  approveInward,
  rejectInward,
  completeInward,
  getInwardStats,
  addToInventory
};

export default inwardService;
