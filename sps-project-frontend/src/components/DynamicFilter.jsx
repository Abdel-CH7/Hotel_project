import React from "react";
import { Form } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";

const DynamicFilter = ({
  filters,
  onFilterChange,
  onDateFilterChange,
  selectedDate,
  values,
  onAddClick,
  addButtonLabel,
  trailingControl,
}) => {
  const handleFilterChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange(key, value);
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";

    if (typeof selectedDate === "string") {
      return selectedDate;
    }

    if (selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())) {
      return selectedDate.toISOString().split("T")[0];
    }

    return "";
  };

  return (
    <div className="app-controls-row">
      <button
        type="button"
        onClick={onAddClick}
        className="app-add-button"
      >
        <FaPlus />
        {addButtonLabel}
      </button>

      <div className="app-filter-controls">
        {filters.map((filter, index) => {
          if (filter.type === "date") {
            return (
              <Form.Control
                key={index}
                type="date"
                value={formatSelectedDate()}
                onChange={(e) => {
                  if (onDateFilterChange) {
                    onDateFilterChange(e.target.value);
                  } else {
                    handleFilterChange(filter.key, e.target.value);
                  }
                }}
                className="app-filter-select"
                title={filter.label}
              />
            );
          }

          return (
            <Form.Select
              key={index}
              {...(values ? { value: values[filter.key] ?? "" } : {})}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="app-filter-select"
              title={filter.label}
            >
              <option value="">{filter.placeholder || "Tous"}</option>

              {filter.options.map((option, optIndex) => (
                <option key={optIndex} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          );
        })}
        {trailingControl}
      </div>
    </div>
  );
};

export default DynamicFilter;
