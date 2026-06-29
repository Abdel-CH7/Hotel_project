<div className="table-responsive" style={{
  marginTop: "10px",
  maxHeight: "400px", /* Reduced max-height so it doesn't push buttons off screen */
  overflowY: "auto",  /* Allow vertical scrolling if too many rooms */
  overflowX: "hidden", /* Prevent horizontal scrolling */
  width: "100%",       
}}>
  <table className="table table-bordered table-sm table-fixed-layout" style={{ marginTop: "-5px" }}>
    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
      <tr>
        <th colSpan={5}>Liste des Chambres</th>
      </tr>
      <tr>
        <th className="ColoretableForm" style={{ width: "25%" }}>Type</th>
        <th className="ColoretableForm" style={{ width: "22%" }}>Étage</th>
        <th className="ColoretableForm" style={{ width: "22%" }}>Vue</th>
        <th className="ColoretableForm" style={{ width: "23%" }}>Numéro</th>
        <th className="ColoretableForm" style={{ width: "8%", textAlign: "center" }}>Act.</th>
      </tr>
    </thead>
    <tbody>
      {selectedRooms.length > 0 ? (
        selectedRooms.map((room, rowIndex) => (
          <tr key={rowIndex}>
            <td>
              <Form.Control
                as="select"
                value={room.type || ''}
                onChange={(e) => handleRoomChange(rowIndex, "type", e.target.value)}
                style={{ fontSize: "15px", padding: "5px" }} /* <-- Texte agrandi ici */
              >
                <option value="">Sélectionner un type</option>
                {getFilteredOptions("type", rowIndex).map((type_chambre) => (
                  <option key={type_chambre} value={type_chambre}>
                    {type_chambre}
                  </option>
                ))}
              </Form.Control>
            </td>

            <td>
              <Form.Control
                as="select"
                value={room.etage || ''}
                onChange={(e) => handleRoomChange(rowIndex, "etage", e.target.value)}
                style={{ fontSize: "15px", padding: "5px" }} /* <-- Texte agrandi ici */
              >
                <option value="">Sélectionner un étage</option>
                {getFilteredOptions("etage", rowIndex).map((etage) => (
                  <option key={etage} value={etage}>
                    {etage}
                  </option>
                ))}
              </Form.Control>
            </td>

            <td>
              <Form.Control
                as="select"
                value={room.vue || ''}
                onChange={(e) => handleRoomChange(rowIndex, "vue", e.target.value)}
                style={{ fontSize: "15px", padding: "5px" }} /* <-- Texte agrandi ici */
              >
                <option value="">Sélectionner une vue</option>
                {getFilteredOptions("vue", rowIndex).map((vue) => (
                  <option key={vue} value={vue}>
                    {vue}
                  </option>
                ))}
              </Form.Control>
            </td>

            <td>
              <Form.Control
                as="select"
                value={room.num_chambre || ''}
                onChange={(e) => handleRoomChange(rowIndex, "num_chambre", e.target.value)}
                style={{ fontSize: "15px", padding: "5px" }} /* <-- Texte agrandi ici */
              >
                <option value="">Sélectionner une chambre</option>
                {getFilteredOptions("num_chambre", rowIndex).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </Form.Control>
            </td>

            <td style={{ textAlign: "center", verticalAlign: "middle" }}>
              <FontAwesomeIcon
                color="red"
                onClick={() => handleDeleteRoom(rowIndex)} /* <-- BUG RÉPARÉ ICI */
                icon={faTrash}
                style={{ cursor: "pointer", fontSize: "11px" }} /* <-- Icône toute petite ici */
              />
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="5" className="text-center">Aucune chambre ajoutée</td>
        </tr>
      )}
    </tbody>
  </table>
</div>