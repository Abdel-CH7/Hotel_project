import { Button, Form } from "react-bootstrap";
import ClientSelector from "./ClientSelector";
import MealSelector from "./MealSelector";
import PricingPreview from "./PricingPreview";
import ReductionSelector from "./ReductionSelector";
import RoomAllocationTable from "./RoomAllocationTable";
import { formatDate, statusClass, statusLabel } from "../reservationUtils";

const ReservationDrawer = ({ formState }) => {
  const {
    isOpen,
    isEditing,
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
    today,
    close,
    setField,
    addRoom,
    removeRoom,
    updateRoom,
    roomOptionsFor,
    toggleMeal,
    updateMealQuantity,
    submit,
  } = formState;

  return (
    <aside className={`app-form-drawer reservation-drawer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <div className="reservation-drawer-header">
        <div>
          <h2 className="app-form-drawer-title">
            {isEditing ? "Modifier la réservation" : "Ajouter une réservation"}
          </h2>
          <span className={`app-status-badge ${statusClass(isEditing ? editingReservation?.status : "en attente")}`}>
            {statusLabel(isEditing ? editingReservation?.status : "en attente")}
          </span>
          {editingReservation?.legacy_pricing && <span className="reservation-history-badge">Historique</span>}
        </div>
        <button type="button" className="reservation-drawer-close" onClick={close} aria-label="Fermer">×</button>
      </div>

      {actionError && <div className="reservation-alert is-error">{actionError}</div>}
      {editingReservation?.legacy_pricing && form.chambres.some((room) => room.adultes === "" || room.enfants === "") && (
        <div className="reservation-alert is-warning">
          Cette réservation historique ne contient pas l’occupation par chambre. Renseignez les adultes et les enfants avant de l’enregistrer.
        </div>
      )}

      <ClientSelector
        form={form}
        clients={clients}
        loading={clientsLoading}
        errors={errors}
        setField={setField}
        fallbackClient={editingReservation?.client}
      />

      <section className="reservation-form-section">
        <h3>2. Dates du séjour</h3>
        <div className="reservation-form-grid">
          <Form.Group>
            <Form.Label>Date d’arrivée</Form.Label>
            <Form.Control
              type="date"
              min={isEditing ? undefined : today}
              value={form.date_debut}
              onChange={(event) => setField("date_debut", event.target.value)}
              isInvalid={Boolean(errors.date_debut)}
            />
            <Form.Control.Feedback type="invalid">{errors.date_debut}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Date de départ</Form.Label>
            <Form.Control
              type="date"
              min={form.date_debut || (isEditing ? undefined : today)}
              value={form.date_fin}
              onChange={(event) => setField("date_fin", event.target.value)}
              isInvalid={Boolean(errors.date_fin)}
            />
            <Form.Control.Feedback type="invalid">{errors.date_fin}</Form.Control.Feedback>
          </Form.Group>
        </div>

        {availabilityLoading && <div className="reservation-inline-loading">Recherche des chambres disponibles…</div>}
        {availabilityError && <div className="reservation-alert is-error">{availabilityError}</div>}
        {!availabilityLoading && availability && (
          <div className="reservation-availability-summary">
            <strong>{availability.nuits} nuit(s)</strong>
            <span>{availability.chambres?.length || 0} chambre(s) disponible(s)</span>
            {(availability.periodes || []).map((period) => (
              <span key={`${period.id}-${period.date_debut}`}>
                {period.designation} · {formatDate(period.date_debut)} au {formatDate(period.date_fin)}
              </span>
            ))}
          </div>
        )}
        {!availabilityLoading && availability && (availability.chambres || []).length === 0 && (
          <div className="reservation-empty-state">Aucune chambre n’est disponible pour ces dates.</div>
        )}
      </section>

      <RoomAllocationTable
        rows={form.chambres}
        availableRooms={availability?.chambres || []}
        errors={errors}
        canAddRoom={canAddRoom}
        addRoom={addRoom}
        removeRoom={removeRoom}
        updateRoom={updateRoom}
        roomOptionsFor={roomOptionsFor}
      />

      <MealSelector
        options={formOptions.repas}
        selectedMeals={form.repas}
        totalOccupants={totalOccupants}
        errors={errors}
        toggleMeal={toggleMeal}
        updateQuantity={updateMealQuantity}
      />

      <ReductionSelector
        options={formOptions.reductions}
        value={form.type_reduction_id}
        error={errors.type_reduction_id}
        onChange={(value) => setField("type_reduction_id", value)}
      />

      <PricingPreview preview={preview} loading={previewLoading} error={previewError} />

      <section className="reservation-form-section">
        <h3>7. Enregistrement</h3>
        <div className="app-form-actions reservation-drawer-actions">
          <Button type="button" className="app-primary-button" onClick={submit} disabled={saving || previewLoading}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button type="button" className="app-secondary-button" onClick={close} disabled={saving}>
            Annuler
          </Button>
        </div>
      </section>
    </aside>
  );
};

export default ReservationDrawer;
