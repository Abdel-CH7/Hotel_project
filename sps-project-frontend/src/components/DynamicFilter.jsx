import React from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';

const DynamicFilter = ({ filters, onFilterChange, onAddClick, addButtonLabel }) => {
  const handleFilterChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange(key, value);
    }
  };

  return (
    <div className="mb-4">
      <Row className="align-items-end g-3">
        {filters.map((filter, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={3}>
            <Form.Group>
              <Form.Label>{filter.label}</Form.Label>
              {filter.type === 'date' ? (
                <Form.Control
                  type="date"
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                />
              ) : (
                <Form.Select
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                >
                  {filter.options.map((option, optIndex) => (
                    <option key={optIndex} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>
          </Col>
        ))}
        <Col xs="auto" className="ms-auto">
          <Button
            variant="primary"
            onClick={onAddClick}
            className="d-flex align-items-center gap-2"
          >
            <FaPlus />
            {addButtonLabel}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default DynamicFilter; 