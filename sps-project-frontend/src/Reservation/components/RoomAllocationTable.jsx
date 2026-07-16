import { Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

const uniqueOptions = (rooms, key) => [...new Set(rooms.map((room) => room[key]).filter(Boolean))]
  .sort((left, right) => String(left).localeCompare(String(right), "fr", { numeric: true }));

const RoomAllocationTable = ({
  rows,
  availableRooms,
  errors,
  canAddRoom,
  addRoom,
  removeRoom,
  updateRoom,
  roomOptionsFor,
}) => {
  const typeOptions = [...new Map(availableRooms.map((room) => [String(room.type_chambre_id), room.type_chambre])).entries()];
  const floors = uniqueOptions(availableRooms, "etage");
  const views = uniqueOptions(availableRooms, "vue");

  return (
    <section className="reservation-form-section">
      <div className="reservation-section-heading">
        <h3>3. Chambres et occupation</h3>
        <Button type="button" className="app-add-button" onClick={addRoom} disabled={!canAddRoom}>
          <FontAwesomeIcon icon={faPlus} /> Ajouter une chambre
        </Button>
      </div>

      {errors.chambres && <div className="reservation-field-error">{errors.chambres}</div>}
      {rows.length === 0 && (
        <div className="reservation-empty-state">
          Ajoutez une chambre disponible pour commencer la tarification.
        </div>
      )}

      <div className="reservation-room-list">
        {rows.map((row, index) => {
          const roomOptions = roomOptionsFor(index);
          const adults = Number(row.adultes || 0);
          const children = Number(row.enfants || 0);
          const occupants = adults + children;
          const standardCapacity = Number(row.room?.capacite_standard || 0);
          const extraMaximum = Number(row.room?.lits_supplementaires_max || 0);
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
                    <option value="">Tous</option>
                    {typeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Étage</Form.Label>
                  <Form.Select value={row.floorFilter} onChange={(event) => updateRoom(index, "floorFilter", event.target.value)}>
                    <option value="">Tous</option>
                    {floors.map((floor) => <option key={floor} value={floor}>{floor}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Vue</Form.Label>
                  <Form.Select value={row.viewFilter} onChange={(event) => updateRoom(index, "viewFilter", event.target.value)}>
                    <option value="">Toutes</option>
                    {views.map((view) => <option key={view} value={view}>{view}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Numéro de chambre</Form.Label>
                  <Form.Select
                    value={row.chambre_id}
                    onChange={(event) => updateRoom(index, "chambre_id", event.target.value)}
                    isInvalid={Boolean(errors[`chambres.${index}.chambre_id`])}
                  >
                    <option value="">Sélectionner</option>
                    {roomOptions.map((room) => (
                      <option key={room.id} value={room.id}>Chambre {room.num_chambre}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors[`chambres.${index}.chambre_id`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {row.room && (
                <div className="reservation-room-metadata">
                  <span><strong>Type :</strong> {row.room.type_chambre || "-"}</span>
                  <span><strong>Étage :</strong> {row.room.etage || "-"}</span>
                  <span><strong>Vue :</strong> {row.room.vue || "-"}</span>
                  <span><strong>Capacité standard :</strong> {row.room.capacite_standard ?? "-"}</span>
                  <span><strong>Capacité supplémentaire :</strong> {row.room.lits_supplementaires_max ?? 0}</span>
                </div>
              )}

              <div className="reservation-occupancy-row">
                <Form.Group>
                  <Form.Label>Adultes</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={row.adultes}
                    onChange={(event) => updateRoom(index, "adultes", event.target.value)}
                    isInvalid={Boolean(errors[`chambres.${index}.adultes`])}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors[`chambres.${index}.adultes`]}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Enfants</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={row.enfants}
                    onChange={(event) => updateRoom(index, "enfants", event.target.value)}
                    isInvalid={Boolean(errors[`chambres.${index}.enfants`])}
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
              {row.room && occupants > standardCapacity + extraMaximum && (
                <div className="reservation-field-error">
                  Cette chambre accepte au maximum {standardCapacity + extraMaximum} occupant(s).
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default RoomAllocationTable;
