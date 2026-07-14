import axios from 'axios';

const API_URL = '/api/bills';

export const getBills = async (params) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

export const uploadBill = async (formData) => {
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateBill = async (id, data) => {
  let config = {};
  if (data instanceof FormData) {
    config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
  }
  const response = await axios.put(`${API_URL}/${id}`, data, config);
  return response.data;
};

export const deleteBill = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
