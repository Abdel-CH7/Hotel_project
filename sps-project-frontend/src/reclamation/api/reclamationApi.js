import apiClient from "../../utils/apiClient";

const dataOf = (response) => response.data?.data ?? response.data;

let formOptionsRequest = null;
let listRequest = null;
const detailRequests = new Map();
const reservationContextRequests = new Map();

export const listReclamations = async () => {
  if (!listRequest) {
    listRequest = apiClient.get("/reclamations")
      .then((response) => (Array.isArray(response.data?.data) ? response.data.data : []))
      .finally(() => {
        listRequest = null;
      });
  }
  return listRequest;
};

export const getReclamation = async (id) => {
  const numericId = Number(id);
  if (!detailRequests.has(numericId)) {
    detailRequests.set(
      numericId,
      apiClient.get(`/reclamations/${numericId}`).then(dataOf).finally(() => {
        detailRequests.delete(numericId);
      })
    );
  }
  return detailRequests.get(numericId);
};

export const getReclamationFormOptions = async ({ refresh = false } = {}) => {
  if (refresh && formOptionsRequest) {
    try {
      await formOptionsRequest;
    } catch {
      // A refresh must start after the previous in-flight request settles.
    }
  }

  if (!formOptionsRequest) {
    formOptionsRequest = apiClient
      .get("/reclamations/form-options")
      .then(dataOf)
      .finally(() => {
        formOptionsRequest = null;
      });
  }
  return formOptionsRequest;
};

export const getReclamationReservationContext = async (reservationId) => {
  const numericId = Number(reservationId);
  if (!reservationContextRequests.has(numericId)) {
    reservationContextRequests.set(
      numericId,
      apiClient
        .get(`/reclamations/reservations/${numericId}/context`)
        .then(dataOf)
        .finally(() => reservationContextRequests.delete(numericId))
    );
  }
  return reservationContextRequests.get(numericId);
};

export const createReclamation = async (payload) =>
  dataOf(await apiClient.post("/reclamations", payload));

export const updateReclamation = async (id, payload) =>
  dataOf(await apiClient.put(`/reclamations/${Number(id)}`, payload));

export const changeReclamationStatus = async (id, payload) =>
  dataOf(await apiClient.patch(`/reclamations/${Number(id)}/status`, payload));

export const cancelReclamation = async (id, motif) =>
  dataOf(await apiClient.patch(`/reclamations/${Number(id)}/cancel`, { motif }));

const lookupPath = {
  type: "reclamation-types",
  canal: "reclamation-canaux",
  departement: "reclamation-departements",
};

export const listReclamationLookups = async (kind) =>
  dataOf(await apiClient.get(`/${lookupPath[kind]}`));

export const createReclamationLookup = async (kind, payload) =>
  dataOf(await apiClient.post(`/${lookupPath[kind]}`, payload));

export const updateReclamationLookup = async (kind, id, payload) =>
  dataOf(
    payload instanceof FormData
      ? await apiClient.post(`/${lookupPath[kind]}/${Number(id)}`, (() => {
          payload.set("_method", "PUT");
          return payload;
        })())
      : await apiClient.put(`/${lookupPath[kind]}/${Number(id)}`, payload)
  );

export const setReclamationLookupActive = async (kind, id, actif) =>
  dataOf(
    await apiClient.patch(`/${lookupPath[kind]}/${Number(id)}/active`, { actif })
  );
