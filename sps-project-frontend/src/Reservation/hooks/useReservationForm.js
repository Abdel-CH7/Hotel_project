import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculatePrice,
  createReservation,
  getAvailableRooms,
  getReservationCompanyCreditSummary,
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
  availabilityMessage: "",
});

const initialForm = () => ({
  client_type: "",
  client_id: "",
  politique_paiement: "",
  montant_acompte_requis: "",
  date_limite_paiement: "",
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

const localCalendarDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeRoomValue = (value) => String(value ?? "")
  .trim()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const roomId = (room) => String(room?.id ?? "").trim();

const normalizeRoom = (room) => ({
  id: roomId(room),
  typeId: String(room?.type_chambre_id ?? "").trim(),
  typeLabel: String(room?.type_chambre ?? "").trim(),
  floor: String(room?.etage ?? "").trim(),
  floorKey: normalizeRoomValue(room?.etage),
  view: String(room?.vue ?? "").trim(),
  viewKey: normalizeRoomValue(room?.vue),
  number: String(room?.num_chambre ?? "").trim(),
});

const canonicalAvailableRooms = (rooms) => {
  const unique = new Map();
  (Array.isArray(rooms) ? rooms : []).forEach((room) => {
    const id = roomId(room);
    if (id && !unique.has(id)) unique.set(id, room);
  });

  return [...unique.values()].sort((left, right) => normalizeRoom(left).number.localeCompare(
    normalizeRoom(right).number,
    "fr",
    { numeric: true, sensitivity: "base" }
  ));
};

const roomMatchesRowFilters = (room, row, ignoredFilter = "") => {
  const normalized = normalizeRoom(room);
  if (ignoredFilter !== "typeFilter" && row.typeFilter
    && normalized.typeId !== String(row.typeFilter)) return false;
  if (ignoredFilter !== "floorFilter" && row.floorFilter
    && normalized.floorKey !== normalizeRoomValue(row.floorFilter)) return false;
  if (ignoredFilter !== "viewFilter" && row.viewFilter
    && normalized.viewKey !== normalizeRoomValue(row.viewFilter)) return false;
  return true;
};

const baseRoomsFor = (rows, rooms, index) => {
  const selectedElsewhere = new Set(rows
    .filter((_, rowIndex) => rowIndex !== index)
    .map((row) => String(row.chambre_id ?? "").trim())
    .filter(Boolean));

  return canonicalAvailableRooms(rooms).filter((room) => !selectedElsewhere.has(roomId(room)));
};

const matchingRoomsFor = (rows, rooms, index, ignoredFilter = "") => {
  const row = rows[index];
  if (!row) return [];
  return baseRoomsFor(rows, rooms, index)
    .filter((room) => roomMatchesRowFilters(room, row, ignoredFilter));
};

const syncRowWithRoom = (row, room) => {
  const normalized = normalizeRoom(room);
  return {
    ...row,
    chambre_id: normalized.id,
    room,
    typeFilter: normalized.typeId,
    floorFilter: normalized.floor,
    viewFilter: normalized.view,
  };
};

const uniqueFacetOptions = (rooms, valueOf, labelOf = valueOf) => {
  const options = new Map();
  rooms.forEach((room) => {
    const value = String(valueOf(normalizeRoom(room)) ?? "").trim();
    const label = String(labelOf(normalizeRoom(room)) ?? "").trim();
    const key = normalizeRoomValue(value);
    if (value && label && !options.has(key)) options.set(key, { value, label });
  });

  return [...options.values()].sort((left, right) => left.label.localeCompare(
    right.label,
    "fr",
    { numeric: true, sensitivity: "base" }
  ));
};

const facetOptionsFor = (rows, rooms, index, field, valueOf, labelOf = valueOf) => {
  const options = uniqueFacetOptions(
    matchingRoomsFor(rows, rooms, index, field),
    valueOf,
    labelOf
  );
  const currentValue = String(rows[index]?.[field] ?? "").trim();
  if (!currentValue || options.some((option) => String(option.value) === currentValue)) {
    return options;
  }

  const currentRoom = baseRoomsFor(rows, rooms, index).find((room) => (
    String(valueOf(normalizeRoom(room)) ?? "").trim() === currentValue
  ));
  const currentLabel = currentRoom
    ? String(labelOf(normalizeRoom(currentRoom)) ?? currentValue).trim()
    : currentValue;

  return [{ value: currentValue, label: currentLabel }, ...options];
};

const reconcileRowsWithAvailability = (rows, rooms) => {
  const availableRooms = canonicalAvailableRooms(rooms);
  const availableById = new Map(availableRooms.map((room) => [roomId(room), room]));
  return rows.map((row) => {
    const previousRoomId = String(row.chambre_id ?? "").trim();
    const selectedRoom = availableById.get(String(row.chambre_id ?? "").trim());
    if (selectedRoom) {
      return {
        ...row,
        chambre_id: roomId(selectedRoom),
        room: selectedRoom,
        availabilityMessage: "",
      };
    }

    return {
      ...row,
      chambre_id: "",
      room: null,
      availabilityMessage: previousRoomId
        ? "La chambre précédemment sélectionnée n’est plus disponible pour ces dates."
        : row.availabilityMessage || "",
    };
  });
};

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
  politique_paiement: form.politique_paiement,
  montant_acompte_requis: form.politique_paiement === "acompte_requis"
    ? form.montant_acompte_requis
    : null,
  date_limite_paiement: ["acompte_requis", "paiement_integral_avant_arrivee"]
    .includes(form.politique_paiement)
    ? form.date_limite_paiement
    : null,
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
  delete payload.politique_paiement;
  delete payload.montant_acompte_requis;
  delete payload.date_limite_paiement;
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
  const [creditSummary, setCreditSummary] = useState(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [creditVersion, setCreditVersion] = useState(0);

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
      politique_paiement: reservation.politique_paiement?.code || "paiement_sur_place",
      montant_acompte_requis: reservation.politique_paiement?.montant_acompte_requis || "",
      date_limite_paiement: reservation.politique_paiement?.date_limite_paiement || "",
      date_debut: reservation.dates?.debut || "",
      date_fin: reservation.dates?.fin || "",
      chambres: (reservation.chambres || []).map((allocation) => syncRowWithRoom(
        newRoomRow(
          allocation.adultes === null ? "" : String(allocation.adultes),
          allocation.enfants === null ? "" : String(allocation.enfants)
        ),
        {
          id: allocation.chambre_id,
          num_chambre: allocation.num_chambre,
          type_chambre_id: allocation.type_chambre?.id,
          type_chambre: allocation.type_chambre?.nom_snapshot,
          capacite_standard: allocation.type_chambre?.capacite_standard_snapshot,
          lits_supplementaires_max: allocation.type_chambre?.lits_supplementaires_max_snapshot,
          etage: allocation.etage ?? "",
          vue: allocation.vue ?? "",
        }
      )),
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
      ...(field === "client_type" ? {
        client_id: "",
        ...(value !== "societe" && current.politique_paiement === "credit_societe"
          ? {
            politique_paiement: "",
            montant_acompte_requis: "",
            date_limite_paiement: "",
          }
          : {}),
      } : {}),
      ...(field === "politique_paiement" ? {
        montant_acompte_requis: value === "acompte_requis"
          ? current.montant_acompte_requis
          : "",
        date_limite_paiement: ["acompte_requis", "paiement_integral_avant_arrivee"].includes(value)
          ? current.date_limite_paiement
          : "",
      } : {}),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "client_type") delete next.client_id;
      if (field === "client_type" || field === "politique_paiement") {
        delete next.politique_paiement;
        delete next.montant_acompte_requis;
        delete next.date_limite_paiement;
      }
      return next;
    });
    setActionError("");
  }, []);

  const selectedClient = useMemo(() => {
    const options = clients[form.client_type] || [];
    const current = options.find((client) => String(client.id) === String(form.client_id));
    if (current) return current;
    return editingReservation?.client?.type === form.client_type
      && String(editingReservation.client.id) === String(form.client_id)
      ? editingReservation.client
      : null;
  }, [clients, editingReservation?.client, form.client_id, form.client_type]);

  useEffect(() => {
    if (!isOpen
      || form.politique_paiement !== "credit_societe"
      || form.client_type !== "societe"
      || !form.client_id) {
      setCreditSummary(null);
      setCreditLoading(false);
      setCreditError("");
      return undefined;
    }

    let active = true;
    setCreditLoading(true);
    setCreditError("");
    getReservationCompanyCreditSummary(Number(form.client_id), {
      ...(editingReservation?.id ? { exclude_reservation_id: editingReservation.id } : {}),
    })
      .then((summary) => {
        if (active) setCreditSummary(summary);
      })
      .catch((error) => {
        if (active) {
          setCreditSummary(null);
          setCreditError(apiMessage(error, "Impossible de charger la situation de crédit."));
        }
      })
      .finally(() => {
        if (active) setCreditLoading(false);
      });

    return () => { active = false; };
  }, [creditVersion, editingReservation?.id, form.client_id, form.client_type, form.politique_paiement, isOpen]);

  const retryCreditSummary = useCallback(() => {
    setCreditVersion((value) => value + 1);
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
        const availableRooms = canonicalAvailableRooms(availableData?.chambres);
        const mealIds = new Set((options?.repas || []).map((meal) => Number(meal.type_repas_id)));
        const reductionIds = new Set((options?.reductions || []).map((item) => Number(item.type_reduction_id)));

        setAvailability(availableData);
        setFormOptions({
          repas: Array.isArray(options?.repas) ? options.repas : [],
          reductions: Array.isArray(options?.reductions) ? options.reductions : [],
        });
        setForm((current) => ({
          ...current,
          chambres: reconcileRowsWithAvailability(current.chambres, availableRooms),
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

  const creditProjection = useMemo(() => {
    if (!creditSummary || form.politique_paiement !== "credit_societe") return null;
    const proposedTotal = Number(preview?.montant_total);
    const alreadyPaid = Number(editingReservation?.reglement?.montant_paye || 0);
    const exposure = Number(creditSummary.exposition_actuelle || 0);
    const ceiling = Number(creditSummary.plafond);
    const reservationRemaining = Number.isFinite(proposedTotal)
      ? Math.max(proposedTotal - alreadyPaid, 0)
      : null;
    const projected = reservationRemaining === null ? null : exposure + reservationRemaining;

    return {
      reservationRemaining,
      projected,
      exceeds: Number.isFinite(projected) && Number.isFinite(ceiling) && projected > ceiling,
    };
  }, [creditSummary, editingReservation?.reglement?.montant_paye, form.politique_paiement, preview?.montant_total]);

  const validation = useMemo(() => {
    const next = {};
    const availableRoomCount = Array.isArray(availability?.chambres)
      ? canonicalAvailableRooms(availability.chambres).length
      : null;
    if (!form.client_type) next.client_type = "Le type de client est obligatoire.";
    if (!form.client_id) next.client_id = "Le client est obligatoire.";
    if (!form.politique_paiement) {
      next.politique_paiement = "La politique de paiement est obligatoire.";
    }
    if (form.politique_paiement === "acompte_requis") {
      const deposit = Number(form.montant_acompte_requis);
      if (!form.montant_acompte_requis) {
        next.montant_acompte_requis = "Le montant de l’acompte requis est obligatoire.";
      } else if (!Number.isFinite(deposit) || deposit <= 0) {
        next.montant_acompte_requis = "Le montant de l’acompte doit être supérieur à zéro.";
      } else if (preview?.montant_total && deposit > Number(preview.montant_total)) {
        next.montant_acompte_requis = "L’acompte requis ne peut pas dépasser le total de la réservation.";
      }
      if (!form.date_limite_paiement) {
        next.date_limite_paiement = "La date limite de l’acompte est obligatoire.";
      }
    }
    if (form.politique_paiement === "paiement_integral_avant_arrivee"
      && !form.date_limite_paiement) {
      next.date_limite_paiement = "La date limite du paiement intégral est obligatoire.";
    }
    if (["acompte_requis", "paiement_integral_avant_arrivee"].includes(form.politique_paiement)
      && form.date_limite_paiement) {
      const reservationDate = editingReservation?.dates?.reservation || localCalendarDate();
      if (form.date_limite_paiement < reservationDate) {
        next.date_limite_paiement = "La date limite ne peut pas précéder la date de la réservation.";
      } else if (form.date_debut && form.date_limite_paiement > form.date_debut) {
        next.date_limite_paiement = "La date limite ne peut pas être postérieure à l’arrivée.";
      }
    }
    if (form.politique_paiement === "credit_societe") {
      if (form.client_type !== "societe") {
        next.politique_paiement = "Le crédit Société est réservé aux clients Société.";
      } else if (creditError) {
        next.politique_paiement = "La situation de crédit doit être actualisée avant l’enregistrement.";
      } else if (!creditLoading && !creditSummary) {
        next.politique_paiement = "La situation de crédit de cette société est indisponible.";
      } else if (!creditLoading && creditSummary && !creditSummary.configuration_complete) {
        next.politique_paiement = creditSummary.autorise
          ? "La configuration de crédit de cette société est incomplète."
          : "Le paiement à crédit n’est pas autorisé pour cette société.";
      } else if (creditProjection?.exceeds) {
        next.politique_paiement = "L’exposition projetée dépasse le plafond de crédit de cette société.";
      }
    }
    if (!form.date_debut) next.date_debut = "La date d’arrivée est obligatoire.";
    if (!form.date_fin) next.date_fin = "La date de départ est obligatoire.";
    if (form.date_debut && form.date_fin && form.date_fin <= form.date_debut) {
      next.date_fin = "La date de départ doit être postérieure à la date d’arrivée.";
    }
    if (form.chambres.length === 0) {
      next.chambres = "Ajoutez au moins une chambre.";
    } else if (availableRoomCount !== null && form.chambres.length > availableRoomCount) {
      next.chambres = `Le formulaire contient ${form.chambres.length} ligne(s) de chambre, mais seulement ${availableRoomCount} chambre(s) sont disponibles. Retirez les lignes en trop.`;
    }

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
  }, [availability?.chambres, creditError, creditLoading, creditProjection?.exceeds, creditSummary, editingReservation?.dates?.reservation, form, preview?.montant_total, totalOccupants]);

  const availableRooms = canonicalAvailableRooms(availability?.chambres);
  const availableRoomIds = new Set(availableRooms.map((room) => roomId(room)));
  const roomRowsExceedAvailability = Boolean(availability)
    && form.chambres.length > availableRooms.length;
  const roomRowsAvailabilityError = roomRowsExceedAvailability
    ? `Le formulaire contient ${form.chambres.length} ligne(s) de chambre, mais seulement ${availableRooms.length} chambre(s) sont disponibles. Retirez les lignes en trop.`
    : "";
  const canPreview = isOpen
    && Boolean(availability)
    && !availabilityLoading
    && datesAreValid(form.date_debut, form.date_fin)
    && form.chambres.length > 0
    && !roomRowsExceedAvailability
    && form.chambres.every((row) => availableRoomIds.has(String(row.chambre_id)))
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
    if (!isOpen
      || !datesAreValid(form.date_debut, form.date_fin)
      || !availability
      || availabilityLoading) return;

    setForm((current) => {
      const rooms = canonicalAvailableRooms(availability.chambres);
      if (rooms.length === 0 || current.chambres.length >= rooms.length) return current;

      return { ...current, chambres: [...current.chambres, newRoomRow()] };
    });
    setErrors((current) => ({ ...current, chambres: "" }));
  }, [availability, availabilityLoading, form.date_debut, form.date_fin, isOpen]);

  const removeRoom = useCallback((index) => {
    setForm((current) => ({
      ...current,
      chambres: current.chambres.filter((_, rowIndex) => rowIndex !== index),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.chambres;
      return next;
    });
  }, []);

  const updateRoom = useCallback((index, field, value) => {
    setForm((current) => {
      const rows = [...current.chambres];
      const row = { ...rows[index], [field]: value };
      if (field === "chambre_id") {
        if (!value) {
          row.chambre_id = "";
          row.room = null;
          row.availabilityMessage = "";
        } else {
          rows[index] = row;
          const selectedRoom = matchingRoomsFor(rows, availability?.chambres, index)
            .find((room) => roomId(room) === String(value));
          rows[index] = selectedRoom
            ? { ...syncRowWithRoom(row, selectedRoom), availabilityMessage: "" }
            : { ...row, chambre_id: "", room: null };
          return { ...current, chambres: rows };
        }
      } else if (["typeFilter", "floorFilter", "viewFilter"].includes(field)) {
        rows[index] = row;
        if (!value || !row.chambre_id) {
          return { ...current, chambres: rows };
        }

        const selectedRoom = baseRoomsFor(rows, availability?.chambres, index)
          .find((room) => roomId(room) === String(row.chambre_id));
        rows[index] = selectedRoom && roomMatchesRowFilters(selectedRoom, row)
          ? { ...row, room: selectedRoom }
          : { ...row, chambre_id: "", room: null };
        return { ...current, chambres: rows };
      }
      rows[index] = row;
      return { ...current, chambres: rows };
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[`chambres.${index}.${field}`];
      delete next[`chambres.${index}.occupants`];
      if (["chambre_id", "typeFilter", "floorFilter", "viewFilter"].includes(field)) {
        delete next[`chambres.${index}.chambre_id`];
      }
      return next;
    });
  }, [availability?.chambres]);

  const baseRoomsForRow = useCallback((index) => (
    baseRoomsFor(form.chambres, availability?.chambres, index)
  ), [availability?.chambres, form.chambres]);

  const typeOptionsFor = useCallback((index) => facetOptionsFor(
    form.chambres,
    availability?.chambres,
    index,
    "typeFilter",
    (room) => room.typeId,
    (room) => room.typeLabel
  ), [availability?.chambres, form.chambres]);

  const floorOptionsFor = useCallback((index) => facetOptionsFor(
    form.chambres,
    availability?.chambres,
    index,
    "floorFilter",
    (room) => room.floor
  ), [availability?.chambres, form.chambres]);

  const viewOptionsFor = useCallback((index) => facetOptionsFor(
    form.chambres,
    availability?.chambres,
    index,
    "viewFilter",
    (room) => room.view
  ), [availability?.chambres, form.chambres]);

  const roomOptionsFor = useCallback((index) => {
    return matchingRoomsFor(form.chambres, availability?.chambres, index);
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

  const availableRoomCount = availableRooms.length;
  const remainingRoomRows = Math.max(availableRoomCount - form.chambres.length, 0);
  const canAddRoom = isOpen
    && datesAreValid(form.date_debut, form.date_fin)
    && Boolean(availability)
    && !availabilityLoading
    && availableRoomCount > 0
    && form.chambres.length < availableRoomCount;

  return {
    isOpen,
    isEditing: Boolean(editingReservation),
    editingReservation,
    form,
    errors,
    actionError,
    clients,
    clientsLoading,
    selectedClient,
    creditSummary,
    creditLoading,
    creditError,
    creditProjection,
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
    availableRoomCount,
    remainingRoomRows,
    roomRowsExceedAvailability,
    roomRowsAvailabilityError,
    today: localCalendarDate(),
    openCreate,
    openEdit,
    close,
    setField,
    retryCreditSummary,
    addRoom,
    removeRoom,
    updateRoom,
    baseRoomsForRow,
    typeOptionsFor,
    floorOptionsFor,
    viewOptionsFor,
    roomOptionsFor,
    toggleMeal,
    updateMealQuantity,
    submit,
  };
};
