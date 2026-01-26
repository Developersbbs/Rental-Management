import instance from './instance';

const API_URL = '/purchases';

// Create new purchase
const createPurchase = async (purchaseData) => {
  const response = await instance.post(API_URL, purchaseData);
  return response.data;
};

// Get all purchases
const getPurchases = async (filters = {}) => {
  const response = await instance.get(API_URL, { params: filters });
  return response.data;
};

// Get single purchase
const getPurchase = async (purchaseId) => {
  const response = await instance.get(`${API_URL}/${purchaseId}`);
  return response.data;
};

// Update purchase
const updatePurchase = async (purchaseId, purchaseData) => {
  const response = await instance.put(`${API_URL}/${purchaseId}`, purchaseData);
  return response.data;
};

// Delete purchase
const deletePurchase = async (purchaseId) => {
  const response = await instance.delete(`${API_URL}/${purchaseId}`);
  return response.data;
};

// Approve purchase
const approvePurchase = async (purchaseId) => {
  const response = await instance.put(`${API_URL}/${purchaseId}/approve`);
  return response.data;
};

// Reject purchase
const rejectPurchase = async (purchaseId, rejectionReason) => {
  const response = await instance.put(`${API_URL}/${purchaseId}/reject`, { rejectionReason });
  return response.data;
};

// Receive purchase items
const receivePurchase = async (purchaseId, receivedItems) => {
  const response = await instance.put(`${API_URL}/${purchaseId}/receive`, { receivedItems });
  return response.data;
};

// Get purchase statistics
const getPurchaseStats = async () => {
  const response = await instance.get(`${API_URL}/stats/overview`);
  return response.data;
};

// Add payment
const addPayment = async (purchaseId, paymentData) => {
  const response = await instance.post(`${API_URL}/${purchaseId}/payments`, paymentData);
  return response.data;
};

const purchaseService = {
  createPurchase,
  getPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  approvePurchase,
  rejectPurchase,
  receivePurchase,
  getPurchaseStats,
  addPayment
};

export default purchaseService;