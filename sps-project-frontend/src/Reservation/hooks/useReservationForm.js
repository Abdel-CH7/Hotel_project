import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculatePrice,
  createReservation,
  getAvailableRooms,
  getReservationClientOptions,
  getReservationFormOptions,
  updateReservation,
} from "../api/reservationApi";

let roomRowSequence = 0;

const newRoomRow = (adultes = "1", enfants = "0") => ({
  key: `reservation-room-${Date.now()}-${roomRowSequence++}`,
  chambre_id: "",
  adultes,
  enfants,
  typeFilter: "",
  floorFilter: "",
  viewFilter: "",
  room: null,
});

const initialForm = () => ({
  client_type: "",
  client_id: "",
  date_debut: "",
  date_fin: "",
  chambres: [],
  repas: [],
  type_reduction_id: "",
});

const integerValue = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const datesAreValid = (start, end) => Boolean(start && end && end > start);

const fieldErrorsFrom = (error) => {
  const response = error?.response;
  if (response?.status === 422 && response.data?.errors) {
    return Object.entries(response.data.errors).reduce((result, [field, messages]) => {
      result[field] = Array.isArray(messages) ? messages[0] : messages;
      return result;
    }, {});
  }

  if (response?.data?.field && response.data?.message) {
    return { [response.data.field]: response.data.message };
  }

  return {};
};

const apiMessage = (error, fallback) => error?.response?.data?.message || fallback;

const structuralPayload = (form, includeStatus = false) => ({
  client_type: form.client_type,
  client_id: Number(form.client_id),
  date_debut: form.date_debut,
  date_fin: form.date_fin,
  ...(includeStatus ? { status: "en attente" } : {}),
  chambres: form.chambres.map((row) => ({
    chambre_id: Number(row.chambre_id),
    adultes: Number(row.adultes),
    enfants: Number(row.enfants),
  })),
  repas: form.repas.map((meal) => ({
    type_repas_id: Number(meal.type_repas_id),
    quantite_par_jour: Number(meal.quantite_par_jour),
  })),
  type_reduction_id: form.type_reduction_id ? Number(form.type_reduction_id) : null,
});

const previewPayloadOf = (form) => {
  const payload = structuralPayload(form, false);
  delete payload.client_type;
  delete payload.client_id;
  return payload;
};

export const useReservationForm = ({ onSaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [actionError, setActionError] = useState("");
  const [clients, setClients] = useState({ societe: [], particulier: [] });
  const [clientsLoading, setClientsLoading] = useState(true);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [formOptions, setFormOptions] = useState({ repas: [], reductions: [] });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [saving, setSaving] = useState(false);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);

  const refreshClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const options = await getReservationClientOptions();
      setClients({
        societe: Array.isArray(options?.societe) ? options.societe : [],
        particulier: Array.isArray(options?.particulier) ? options.particulier : [],
      });
      setActionError("");
    } catch (error) {
      setActionError(apiMessage(error, "Impossible de charger la liste des clients."));
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshClients();
  }, [refreshClients]);

  const openCreate = useCallback(() => {
    setEditingReservation(null);
    setForm(initialForm());
    setErrors({});
    setActionError("");
    setAvailability(null);
    setFormOptions({ repas: [], reductions: [] });
    setPreview(null);
    setPreviewError("");
    setIsOpen(true);
    void refreshClients();
  }, [refreshClients]);

  const openEdit = useCallback((reservation) => {
    setEditingReservation(reservation);
    setForm({
      client_type: reservation.client?.type || "",
      client_id: reservation.client?.id ? String(reservation.client.id) : "",
      date_debut: reservation.dates?.debut || "",
      date_fin: reservation.dates?.fin || "",
      chambres: (reservation.chambres || []).map((allocation) => ({
        ...newRoomRow(
          allocation.adultes === null ? "" : String(allocation.adultes),
          allocation.enfants === null ? "" : String(allocation.enfants)
        ),
        chambre_id: String(allocation.chambre_id),
        room: {
          id: allocation.chambre_id,
          num_chambre: allocation.num_chambre,
          type_chambre_id: allocation.type_chambre?.id,
          type_chambre: allocation.type_chambre?.nom_snapshot,
          capacite_standard: allocation.type_chambre?.capacite_standard_snapshot,
          lits_supplementaires_max: allocation.type_chambre?.lits_supplementaires_max_snapshot,
          etage: "",
          vue: "",
        },
      })),
      repas: (reservation.repas || []).map((meal) => ({
        type_repas_id: String(meal.type_repas_id),
        quantite_par_jour: String(meal.quantite_par_jour),
      })),
      type_reduction_id: reservation.reduction?.type_reduction_id
        ? String(reservation.reduction.type_reduction_id)
        : "",
    });
    setErrors({});
    setActionError("");
    setAvailability(null);
    setPreview(null);
    setPreviewError("");
    setIsOpen(true);
    void refreshClients();
  }, [refreshClients]);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingReservation(null);
    setForm(initialForm());
    setErrors({});
    setActionError("");
    setAvailability(null);
    setFormOptions({ repas: [], reductions: [] });
    setPreview(null);
    setPreviewError("");
  }, []);

  const setField = useCallback((field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "client_type" ? { client_id: "" } : {}),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "client_type") delete next.client_id;
      return next;
    });
    setActionError("");
  }, []);

  useEffect(() => {
    if (!isOpen || !datesAreValid(form.date_debut, form.date_fin)) {
      setAvailability(null);
      setFormOptions({ repas: [], reductions: [] });
      setAvailabilityError("");
      return undefined;
    }

    const controller = new AbortController();
    const params = {
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      ...(editingReservation?.id ? { reservation_id: editingReservation.id } : {}),
    };
    setAvailabilityLoading(true);
    setAvailability(null);
    setAvailabilityError("");

    Promise.all([
      getAvailableRooms(params, controller.signal),
      getReservationFormOptions({ date_debut: form.date_debut, date_fin: form.date_fin }, controller.signal),
    ])
      .then(([availableData, options]) => {
        const availableRooms = Array.isArray(availableData?.chambres) ? availableData.chambres : [];
        const availableIds = new Set(availableRooms.map((room) => Number(room.id)));
        const mealIds = new Set((options?.repas || []).map((meal) => Number(meal.type_repas_id)));
        const reductionIds = new Set((options?.reductions || []).map((item) => Number(item.type_reduction_id)));

        setAvailability(availableData);
        setFormOptions({
          repas: Array.isArray(options?.repas) ? options.repas : [],
          reductions: Array.isArray(options?.reductions) ? options.reductions : [],
        });
        setForm((current) => ({
          ...current,
          chambres: current.chambres
            .filter((row) => !row.chambre_id || availableIds.has(Number(row.chambre_id)))
            .map((row) => ({
              ...row,
              room: row.chambre_id
                ? availableRooms.find((room) => Number(room.id) === Number(row.chambre_id)) || row.room
                : null,
            })),
          repas: current.repas.filter((meal) => mealIds.has(Number(meal.type_repas_id))),
          type_reduction_id: current.type_reduction_id
            && reductionIds.has(Number(current.type_reduction_id))
            ? current.type_reduction_id
            : "",
        }));
      })
      .catch((error) => {
        if (error?.code !== "ERR_CANCELED") {
          setAvailability(null);
          setFormOptions({ repas: [], reductions: [] });
          setAvailabilityError(apiMessage(error, "Impossible de charger les chambres disponibles."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });

    return () => controller.abort();
  }, [availabilityVersion, editingReservation?.id, form.date_debut, form.date_fin, isOpen]);

  const totalOccupants = useMemo(() => form.chambres.reduce((total, row) => {
    const adults = integerValue(row.adultes);
    const children = integerValue(row.enfants);
    return total + (adults ?? 0) + (children ?? 0);
  }, 0), [form.chambres]);

  const validation = useMemo(() => {
    const next = {};
    if (!form.client_type) next.client_type = "Le type de client est obligatoire.";
    if (!form.client_id) next.client_id = "Le client est obligatoire.";
    if (!form.date_debut) next.date_debut = "La date d’arrivée est obligatoire.";
    if (!form.date_fin) next.date_fin = "La date de départ est obligatoire.";
    if (form.date_debut && form.date_fin && form.date_fin <= form.date_debut) {
      next.date_fin = "La date de départ doit être postérieure à la date d’arrivée.";
    }
    if (form.chambres.length === 0) next.chambres = "Ajoutez au moins une chambre.";

    form.chambres.forEach((row, index) => {
      if (!row.chambre_id) next[`chambres.${index}.chambre_id`] = "Sélectionnez une chambre.";
      const adults = integerValue(row.adultes);
      const children = integerValue(row.enfants);
      if (adults === null || adults < 1) {
        next[`chambres.${index}.adultes`] = "Au moins un adulte est requis.";
      }
      if (children === null || children < 0) {
        next[`chambres.${index}.enfants`] = "Le nombre d’enfants doit être positif ou nul.";
      }
      const capacity = Number(row.room?.capacite_standard);
      const extraCapacity = Number(row.room?.lits_supplementaires_max ?? 0);
      if (row.chambre_id && (!Number.isInteger(capacity) || capacity < 1)) {
        next[`chambres.${index}.chambre_id`] = "La capacité de ce type de chambre n’est pas configurée.";
      } else if (adults !== null && children !== null && adults + children > capacity + extraCapacity) {
        next[`chambres.${index}.occupants`] = `Maximum autorisé : ${capacity + extraCapacity} occupant(s).`;
      }
    });

    form.repas.forEach((meal, index) => {
      const quantity = integerValue(meal.quantite_par_jour);
      if (quantity === null || quantity < 1) {
        next[`repas.${index}.quantite_par_jour`] = "La quantité doit être au moins égale à 1.";
      } else if (quantity > totalOccupants) {
        next[`repas.${index}.quantite_par_jour`] = "La quantité dépasse le nombre total d’occupants.";
      }
    });

    return next;
  }, [form, totalOccupants]);

  const availableRoomIds = new Set((availability?.chambres || []).map((room) => Number(room.id)));
  const canPreview = isOpen
    && Boolean(availability)
    && !availabilityLoading
    && datesAreValid(form.date_debut, form.date_fin)
    && form.chambres.length > 0
    && form.chambres.every((row) => availableRoomIds.has(Number(row.chambre_id)))
    && !Object.keys(validation).some((field) => field === "chambres" || field.startsWith("chambres.") || field.startsWith("repas."));
  const previewPayload = useMemo(() => previewPayloadOf(form), [form]);
  const previewSignature = JSON.stringify(previewPayload);

  useEffect(() => {
    if (!canPreview) {
      setPreview(null);
      setPreviewLoading(false);
      setPreviewError("");
      return undefined;
    }

    const controller = new AbortController();
    setPreview(null);
    setPreviewError("");
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError("");
      calculatePrice(JSON.parse(previewSignature), controller.signal)
        .then(setPreview)
        .catch((error) => {
          if (error?.code !== "ERR_CANCELED") {
            setPreview(null);
            setPreviewError(apiMessage(error, "Le tarif ne peut pas être calculé."));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setPreviewLoading(false);
        });
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canPreview, previewSignature]);

  const addRoom = useCallback(() => {
    setForm((current) => ({ ...current, chambres: [...current.chambres, newRoomRow()] }));
    setErrors((current) => ({ ...current, chambres: "" }));
  }, []);

  const removeRoom = useCallback((index) => {
    setForm((current) => ({
      ...current,
      chambres: current.chambres.filter((_, rowIndex) => rowIndex !== index),
    }));
  }, []);

  const updateRoom = useCallback((index, field, value) => {
    setForm((current) => {
      const rows = [...current.chambres];
      const row = { ...rows[index], [field]: value };
      if (field === "chambre_id") {
        row.room = (availability?.chambres || []).find((room) => Number(room.id) === Number(value)) || null;
      } else if (row.room) {
        const noLongerMatches = (field === "typeFilter" && value && String(row.room.type_chambre_id) !== String(value))
          || (field === "floorFilter" && value && String(row.room.etage) !== String(value))
          || (field === "viewFilter" && value && String(row.room.vue) !== String(value));
        if (noLongerMatches) {
          row.chambre_id = "";
          row.room = null;
        }
      }
      rows[index] = row;
      return { ...current, chambres: rows };
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[`chambres.${index}.${field}`];
      delete next[`chambres.${index}.occupants`];
      return next;
    });
  }, [availability?.chambres]);

  const roomOptionsFor = useCallback((index) => {
    const row = form.chambres[index];
    if (!row) return [];
    const selectedElsewhere = new Set(form.chambres
      .filter((_, rowIndex) => rowIndex !== index)
      .map((item) => Number(item.chambre_id))
      .filter(Boolean));

    return (availability?.chambres || []).filter((room) => {
      if (selectedElsewhere.has(Number(room.id))) return false;
      if (row.typeFilter && String(room.type_chambre_id) !== String(row.typeFilter)) return false;
      if (row.floorFilter && String(room.etage) !== String(row.floorFilter)) return false;
      if (row.viewFilter && String(room.vue) !== String(row.viewFilter)) return false;
      return true;
    });
  }, [availability?.chambres, form.chambres]);

  const toggleMeal = useCallback((mealId, checked) => {
    setForm((current) => ({
      ...current,
      repas: checked
        ? [...current.repas, { type_repas_id: String(mealId), quantite_par_jour: "1" }]
        : current.repas.filter((meal) => Number(meal.type_repas_id) !== Number(mealId)),
    }));
  }, []);

  const updateMealQuantity = useCallback((mealId, value) => {
    setForm((current) => ({
      ...current,
      repas: current.repas.map((meal) => Number(meal.type_repas_id) === Number(mealId)
        ? { ...meal, quantite_par_jour: value }
        : meal),
    }));
  }, []);

  const submit = useCallback(async () => {
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setActionError("Veuillez corriger les champs signalés avant d’enregistrer.");
      return null;
    }

    setSaving(true);
    setErrors({});
    setActionError("");
    try {
      const result = editingReservation?.id
        ? await updateReservation(editingReservation.id, structuralPayload(form, false))
        : await createReservation(structuralPayload(form, true));
      await onSaved?.(result);
      close();
      return result;
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
      setActionError(apiMessage(error, "Impossible d’enregistrer la réservation."));
      if (error?.response?.status === 409) setAvailabilityVersion((value) => value + 1);
      return null;
    } finally {
      setSaving(false);
    }
  }, [close, editingReservation?.id, form, onSaved, validation]);

  const selectedRoomIds = new Set(form.chambres.map((row) => Number(row.chambre_id)).filter(Boolean));
  const canAddRoom = Boolean(availability?.chambres?.some((room) => !selectedRoomIds.has(Number(room.id))));

  return {
    isOpen,
    isEditing: Boolean(editingReservation),
    editingReservation,
    form,
    errors,
    actionError,
    clients,
    clientsLoading,
    availability,
    availabilityLoading,
    availabilityError,
    formOptions,
    preview,
    previewLoading,
    previewError,
    saving,
    totalOccupants,
    canAddRoom,
    today: new Date().toISOString().slice(0, 10),
    openCreate,
    openEdit,
    close,
    setField,
    addRoom,
    removeRoom,
    updateRoom,
    roomOptionsFor,
    toggleMeal,
    updateMealQuantity,
    submit,
  };
};
