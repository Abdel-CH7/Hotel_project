import React from 'react';
import { Table } from 'react-bootstrap';
import { FaEdit, FaBroom } from 'react-icons/fa';

const ChambreTable = ({ filteredChambres, handleEditClick, handleMarkAsClean }) => {
  return (
    <div className="app-table-wrapper">
      <Table bordered hover id="exportTable" className="app-table mb-0">
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
            <tr key={chambre.num_chambre || index}>
              <td>{chambre.num_chambre}</td>

              <td>
                <span
                  className={`badge ${
                    chambre.status === 'nettoyée' ? 'bg-success' : 'bg-warning'
                  }`}
                >
                  {chambre.status}
                </span>
              </td>

              <td>{chambre.date_nettoyage || '-'}</td>
              <td>{chambre.nettoyée_par || '-'}</td>

              <td>
                <span
                  className={`badge ${
                    chambre.maintenance === 'oui' ? 'bg-danger' : 'bg-success'
                  }`}
                >
                  {chambre.maintenance}
                </span>
              </td>

              <td>{chambre.type_maintenance_label || '-'}</td>
              <td>{chambre.date_debut_maintenance || '-'}</td>
              <td>{chambre.date_fin_maintenance || '-'}</td>
              <td>{chambre.commentaire || '-'}</td>

              <td>
                <div className="d-flex justify-content-center gap-2">
                  <FaEdit
                    onClick={() => handleEditClick(chambre)}
                    title="Modifier"
                    className="app-table-action is-edit"
                  />

                  {chambre.status !== 'nettoyée' && (
                    <FaBroom
                      onClick={() => handleMarkAsClean(chambre)}
                      title="Marquer comme nettoyée"
                      className="app-table-action"
                      style={{ color: '#15803d' }}
                    />
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