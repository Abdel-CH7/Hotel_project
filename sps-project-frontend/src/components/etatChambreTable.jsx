import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { FaEdit, FaBroom } from 'react-icons/fa';

const ChambreTable = ({ filteredChambres, handleEditClick, handleMarkAsClean }) => {
  return (
    <div className="table-responsive">
      <Table striped bordered hover id="exportTable">
        <thead>
          <tr>
            <th>N° Chambre</th>
            <th>Status</th>
            <th>Date Nettoyage</th>
            <th>Nettoyée Par</th>
            <th>Maintenance</th>
            <th>Type Maintenance</th>
            <th>Début Maintenance</th>
            <th>Fin Maintenance</th>
            <th>Commentaire</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredChambres.map((chambre, index) => (
            <tr key={index}>
              <td>{chambre.num_chambre}</td>
              <td>
                <span className={`badge ${
                  chambre.status === 'nettoyée' ? 'bg-success' : 'bg-warning'
                }`}>
                  {chambre.status}
                </span>
              </td>
              <td>{chambre.date_nettoyage || '-'}</td>
              <td>{chambre.nettoyée_par || '-'}</td>
              <td>
                <span className={`badge ${
                  chambre.maintenance === 'oui' ? 'bg-danger' : 'bg-success'
                }`}>
                  {chambre.maintenance}
                </span>
              </td>
              <td>{chambre.type_maintenance_label || '-'}</td>
              <td>{chambre.date_debut_maintenance || '-'}</td>
              <td>{chambre.date_fin_maintenance || '-'}</td>
              <td>{chambre.commentaire || '-'}</td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleEditClick(chambre)}
                    title="Modifier"
                  >
                    <FaEdit />
                  </Button>
                  {chambre.status !== 'nettoyée' && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleMarkAsClean(chambre)}
                      title="Marquer comme nettoyée"
                    >
                      <FaBroom />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ChambreTable;