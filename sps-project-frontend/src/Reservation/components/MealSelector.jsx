import { Form } from "react-bootstrap";

const MealSelector = ({ options, selectedMeals, totalOccupants, errors, toggleMeal, updateQuantity }) => (
  <section className="reservation-form-section">
    <h3>4. Repas</h3>
    {options.length === 0 ? (
      <p className="reservation-muted">Aucun repas n’est disponible sur toute la période sélectionnée.</p>
    ) : (
      <div className="reservation-option-list">
        {options.map((option) => {
          const selectedIndex = selectedMeals.findIndex(
            (meal) => Number(meal.type_repas_id) === Number(option.type_repas_id)
          );
          const selected = selectedIndex >= 0 ? selectedMeals[selectedIndex] : null;
          return (
            <div className="reservation-option-row" key={option.type_repas_id}>
              <Form.Check
                type="checkbox"
                id={`meal-${option.type_repas_id}`}
                label={option.nom}
                checked={Boolean(selected)}
                onChange={(event) => toggleMeal(option.type_repas_id, event.target.checked)}
              />
              {selected && (
                <Form.Group>
                  <Form.Label>Quantité par jour</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={Math.max(1, totalOccupants)}
                    value={selected.quantite_par_jour}
                    onChange={(event) => updateQuantity(option.type_repas_id, event.target.value)}
                    isInvalid={Boolean(errors[`repas.${selectedIndex}.quantite_par_jour`])}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors[`repas.${selectedIndex}.quantite_par_jour`]}
                  </Form.Control.Feedback>
                </Form.Group>
              )}
            </div>
          );
        })}
      </div>
    )}
  </section>
);

export default MealSelector;
