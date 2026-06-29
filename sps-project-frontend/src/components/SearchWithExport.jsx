import React from 'react';
import { InputGroup, Form, Button, Row, Col } from 'react-bootstrap';
import { FaSearch, FaFilePdf, FaFileExcel, FaPrint } from 'react-icons/fa';

const SearchWithExport = ({ onSearch, exportToExcel, exportToPDF, printTable, Title }) => {
  return (
    <div>
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="mb-0">{Title}</h2>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Rechercher..."
              onChange={(e) => onSearch(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col xs="auto" className="ms-auto">
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              onClick={exportToExcel}
              title="Exporter en Excel"
            >
              <FaFileExcel />
            </Button>
            <Button
              variant="outline-danger"
              onClick={exportToPDF}
              title="Exporter en PDF"
            >
              <FaFilePdf />
            </Button>
            <Button
              variant="outline-primary"
              onClick={printTable}
              title="Imprimer"
            >
              <FaPrint />
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SearchWithExport;