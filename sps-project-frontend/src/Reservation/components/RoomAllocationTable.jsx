import { Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RequiredLabel from "../../components/RequiredLabel";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

const equipmentStatusLabel = (status) => (
  status === "hors_service" ? "Hors service" : "En maintenance"
);

const hasDegradedService = (room) => Number(room?.equipment_alerts?.count || 0) > 0;

const RoomAllocationTable = ({
  rows,
  errors,
  roomSectionError,
  canAddRoom,
  availableRoomCount,
  remainingRoomRows,
  addRoom,
  removeRoom,
  updateRoom,
  typeOptionsFor,
  floorOptionsFor,
  viewOptionsFor,
  roomOptionsFor,
}) => (
  <section className="reservation-form-section">
    <div className="reservation-section-heading">
      <h3>4. Chambres et occupation</h3>
      <div className="reservation-room-add-controls">
        <span className="reservation-room-counter">
          {availableRoomCount} disponible(s) · {rows.length} ligne(s) ajoutée(s) · {remainingRoomRows} restante(s)
        </span>
        <Button type="button" className="app-add-button" onClick={addRoom} disabled={!canAddRoom}>
          <FontAwesomeIcon icon={faPlus} /> Ajouter une chambre
        </Button>
      </div>
    </div>

    {roomSectionError && <div className="reservation-field-error">{roomSectionError}</div>}
    {rows.length === 0 && (
      <div className="reservation-empty-state">
        Ajoutez une chambre disponible pour commencer la tarification.
      </div>
    )}

    <div className="reservation-room-list">
      {rows.map((row, index) => {
        const typeOptions = typeOptionsFor(index);
        const floorOptions = floorOptionsFor(index);
        const viewOptions = viewOptionsFor(index);
        const roomOptions = roomOptionsFor(index);
        const adults = Number(row.adultes || 0);
        const children = Number(row.enfants || 0);
        const occupants = adults + children;
        const standardCapacity = Number(row.room?.capacite_standard || 0);
        const extraMaximum = Number(row.room?.lits_supplementaires_max || 0);
        const maximumOccupants = standardCapacity + extraMaximum;
        const extraBeds = Math.max(0, occupants - standardCapacity);

        return (
          <article className="reservation-room-row" key={row.key}>
            <div className="reservation-room-row-header">
              <strong>Chambre {index + 1}</strong>
              <button
                type="button"
                className="app-table-action is-delete"
                onClick={() => removeRoom(index)}
                title="Retirer cette chambre"
                aria-label="Retirer cette chambre"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>

            <div className="reservation-room-filters">
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select value={row.typeFilter} onChange={(event) => updateRoom(index, "typeFilter", event.target.value)}>
                  <option value="">Tous les types</option>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Étage</Form.Label>
                <Form.Select value={row.floorFilter} onChange={(event) => updateRoom(index, "floorFilter", event.target.value)}>
                  <option value="">Tous les étages</option>
                  {floorOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Vue</Form.Label>
                <Form.Select value={row.viewFilter} onChange={(event) => updateRoom(index, "viewFilter", event.target.value)}>
                  <option value="">Toutes les vues</option>
                  {viewOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group data-field={`chambres.${index}.chambre_id`}>
                <Form.Label><RequiredLabel required>Numéro de chambre</RequiredLabel></Form.Label>
                <Form.Select
                  value={row.chambre_id}
                  onChange={(event) => updateRoom(index, "chambre_id", event.target.value)}
                  isInvalid={Boolean(errors[`chambres.${index}.chambre_id`])}
                  aria-required="true"
                  aria-invalid={Boolean(errors[`chambres.${index}.chambre_id`])}
                >
                  <option value="">
                    {roomOptions.length === 0 ? "Aucune chambre compatible" : "Sélectionner une chambre"}
                  </option>
                  {roomOptions.map((room) => (
                    <option key={room.id} value={room.id}>
                      Chambre {room.num_chambre}{hasDegradedService(room) ? " — service dégradé" : ""}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors[`chambres.${index}.chambre_id`]}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            {roomOptions.length === 0 && (
              <div className="reservation-room-no-match">
                Aucune chambre disponible ne correspond à cette combinaison.
              </div>
            )}

            {row.availabilityMessage && (
              <div className="reservation-room-availability-message" role="status">
                {row.availabilityMessage}
              </div>
            )}

            {row.room && (
              <>
                {hasDegradedService(row.room) && (
                  <div className="reservation-equipment-warning" role="status">
                    <strong>Attention — service dégradé</strong>
                    <ul>
                      {row.room.equipment_alerts.items.map((equipment) => (
                        <li key={equipment.id}>
                          {equipment.nom} : {equipmentStatusLabel(equipment.statut)}
                        </li>
                      ))}
                    </ul>
                    <span>
                      La chambre reste réservable. Vérifiez que le client peut être accueilli dans ces conditions.
                    </span>
                  </div>
                )}
                <div className="reservation-room-metadata">
                  <span><strong>Capacité standard :</strong> {row.room.capacite_standard ?? "—"}</span>
                  <span><strong>Capacité supplémentaire :</strong> {row.room.lits_supplementaires_max ?? 0}</span>
                  <span><strong>Maximum :</strong> {maximumOccupants} occupants</span>
                </div>
              </>
            )}

            <div className="reservation-occupancy-row">
              <Form.Group data-field={`chambres.${index}.adultes`}>
                <Form.Label><RequiredLabel required>Adultes</RequiredLabel></Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={row.adultes}
                  onChange={(event) => updateRoom(index, "adultes", event.target.value)}
                  isInvalid={Boolean(errors[`chambres.${index}.adultes`])}
                  aria-required="true"
                  aria-invalid={Boolean(errors[`chambres.${index}.adultes`])}
                />
                <Form.Control.Feedback type="invalid">
                  {errors[`chambres.${index}.adultes`]}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group data-field={`chambres.${index}.enfants`}>
                <Form.Label><RequiredLabel required>Enfants occupants</RequiredLabel></Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={row.enfants}
                  onChange={(event) => updateRoom(index, "enfants", event.target.value)}
                  isInvalid={Boolean(errors[`chambres.${index}.enfants`])}
                  aria-required="true"
                  aria-invalid={Boolean(errors[`chambres.${index}.enfants`])}
                />
                <Form.Control.Feedback type="invalid">
                  {errors[`chambres.${index}.enfants`]}
                </Form.Control.Feedback>
              </Form.Group>
              <div className="reservation-occupancy-summary">
                {row.adultes === "" || row.enfants === ""
                  ? "Renseignez l’occupation de cette chambre."
                  : `${occupants} occupant(s) · ${extraBeds} lit(s) supplémentaire(s)`}
              </div>
            </div>
            {errors[`chambres.${index}.occupants`] && (
              <div className="reservation-field-error">{errors[`chambres.${index}.occupants`]}</div>
            )}
            {row.room && occupants > maximumOccupants && (
              <div className="reservation-field-error">
                Cette chambre accepte au maximum {maximumOccupants} occupant(s).
              </div>
            )}
          </article>
        );
      })}
    </div>
  </section>
);

export default RoomAllocationTable;
