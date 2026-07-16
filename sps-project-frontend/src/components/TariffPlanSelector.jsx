import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList, faPlus } from "@fortawesome/free-solid-svg-icons";
import { planUsage } from "../Tarifs/tariffUtils";

const TariffPlanSelector = ({
  label,
  plans,
  selectedPlanId,
  onSelect,
  onManage,
  onAddDetail,
  addLabel,
  extraActions = null,
  filterActions = null,
}) => {
  const selectedPlan = plans.find((plan) => Number(plan.id) === Number(selectedPlanId));
  const usage = planUsage(selectedPlan);

  return (
    <div className="app-controls-row tariff-plan-controls">
      <div className="app-filter-controls tariff-plan-filter">
        <label htmlFor={`tariff-plan-${label}`} className="tariff-plan-label">{label}</label>
        <select
          id={`tariff-plan-${label}`}
          className="app-filter-select"
          value={selectedPlanId}
          onChange={(event) => onSelect(event.target.value === "" ? "" : Number(event.target.value))}
        >
          <option value="">Tous les plans</option>
          {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.designation}</option>)}
        </select>
        {selectedPlan && usage.state !== "unused" && (
          <span className={`tariff-plan-usage is-${usage.state}`} title={usage.label}>{usage.label}</span>
        )}
        {filterActions}
      </div>

      <div className="tariff-plan-buttons">
        <button type="button" className="app-secondary-button" onClick={onManage}>
          <FontAwesomeIcon icon={faList} /> Gérer les plans
        </button>
        {extraActions}
        <button
          type="button"
          className="app-add-button"
          onClick={onAddDetail}
          disabled={usage.locked}
          title={usage.locked ? usage.label : addLabel}
        >
          <FontAwesomeIcon icon={faPlus} /> {addLabel}
        </button>
      </div>
    </div>
  );
};

export default TariffPlanSelector;
