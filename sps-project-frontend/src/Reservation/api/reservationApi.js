import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const dataOf = (response) => response.data?.data ?? response.data;
let clientOptionsRequest = null;

export const listReservations = async () => {
  const response = await axios.get(`${API_URL}/reservations`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getReservation = async (id) => {
  const response = await axios.get(`${API_URL}/reservations/${Number(id)}`);
  return dataOf(response);
};

export const getAvailableRooms = async (params, signal) => {
  const response = await axios.get(`${API_URL}/reservations/available-rooms`, {
    params,
    signal,
  });
  return dataOf(response);
};

export const getReservationFormOptions = async (params, signal) => {
  const response = await axios.get(`${API_URL}/reservations/form-options`, {
    params,
    signal,
  });
  return dataOf(response);
};

export const calculatePrice = async (payload, signal) => {
  const response = await axios.post(`${API_URL}/reservations/calculate-price`, payload, { signal });
  return dataOf(response);
};

export const createReservation = async (payload) => {
  const response = await axios.post(`${API_URL}/reservations`, payload);
  return dataOf(response);
};

export const updateReservation = async (id, payload) => {
  const response = await axios.put(`${API_URL}/reservations/${Number(id)}`, payload);
  return dataOf(response);
};

export const updateReservationStatus = async (id, payload) => {
  const response = await axios.patch(`${API_URL}/reservations/${Number(id)}/status`, payload);
  return dataOf(response);
};

export const getReservationClientOptions = async () => {
  if (!clientOptionsRequest) {
    clientOptionsRequest = axios
      .get(`${API_URL}/reservations/client-options`)
      .then(dataOf)
      .finally(() => {
        clientOptionsRequest = null;
      });
  }

  return clientOptionsRequest;
};
