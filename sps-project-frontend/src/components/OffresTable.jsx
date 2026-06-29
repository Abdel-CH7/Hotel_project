import React, { useState, useEffect } from 'react';
import { MdAdd } from "react-icons/md";
import { CiSquareMinus } from "react-icons/ci";
import './OffresTable.css';
import axios from 'axios';
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CustomDropdown from './CustomDropdown';

function OffresTable({ offres, handleEdit, handleDelete, handleSelectOffre, handleSelectAll, selectedOffres, onGroupUpdate }) {
    const [visibleDetails, setVisibleDetails] = useState({});
    const [groupes, setGroupes] = useState([]);
    const [selectedGroupes, setSelectedGroupes] = useState({});
    const [offreDetails, setOffreDetails] = useState({});
    const [loading, setLoading] = useState({});
    const [error, setError] = useState({});
    const [activeDropdown, setActiveDropdown] = useState(null);
    useEffect(() => { 
        fetchGroupes();
    }, []);

    useEffect(() => {
        offres.forEach(offre => {
            if (visibleDetails[offre.id] && !offreDetails[offre.id] && !loading[offre.id]) {
                fetchOffreDetails(offre.id);
            }
        });
    }, [visibleDetails, offres]);

    const fetchGroupes = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/groupes');
            setGroupes(response.data);
        } catch (error) {
            console.error('Error fetching groupes:', error);
        }
    };

    const fetchOffreDetails = async (offreId) => {
        setLoading(prev => ({ ...prev, [offreId]: true }));
        setError(prev => ({ ...prev, [offreId]: null }));
        try {
            const response = await axios.get(`http://localhost:8000/api/offres/${offreId}/offre_details`);
            setOffreDetails(prevDetails => ({
                ...prevDetails,
                [offreId]: Array.isArray(response.data.offreDetails) ? response.data.offreDetails : []
            }));
        } catch (error) {
            console.error('Error fetching offre details:', error);
            setError(prev => ({ ...prev, [offreId]: 'Failed to load details' }));
        } finally {
            setLoading(prev => ({ ...prev, [offreId]: false }));
        }
    };

    const handleToggleDetails = (id) => {
        setVisibleDetails(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    };

    const handleGroupChange = (offreId, newSelectedGroupes) => {
        setSelectedGroupes(prevState => ({
            ...prevState,
            [offreId]: newSelectedGroupes
        }));
    };

    const handleConfirmGroupSelection = async (offreId, selectedGroupeIds) => {
        console.log('Sending data to server:', { offreId, groupe_clients: selectedGroupeIds });
        
        try {
            const response = await axios.put(`http://localhost:8000/api/offres/${offreId}/update-groupes`, { groupe_clients: selectedGroupeIds });
            console.log('Server response:', response.data);
            
            if (response.data.message === 'Groupe clients updated successfully') {
                onGroupUpdate(offreId, selectedGroupeIds);
            }
        } catch (error) {
            console.error('Error updating groups:', error.response ? error.response.data : error.message);
        }
    };

    const ActionButton = ({ onClick, className, icon }) => (
        <button onClick={onClick} className={`btn btn-sm ${className}`}>
            {icon}
        </button>
    );

    return (
        <table className="table table-bordered">
            <thead className="text-center" style={{ backgroundColor: "#adb5bd" }}>
                <tr>
                    <th></th>
                    <th></th>
                    <th>ID</th>
                    <th>Désignation</th>
                    <th>Offre Prix</th>
                    <th>Date début</th>
                    <th>Date fin</th>
                    <th>Groupe Client</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody className="text-center">
                {offres.map(offre => (
                    <React.Fragment key={offre.id}>
                        <tr>
                            <td>
                                <button className="btn btn-sm minibtns" onClick={() => handleToggleDetails(offre.id)}>
                                    {visibleDetails[offre.id] ? <CiSquareMinus className='minibtns'/> : <MdAdd className='minibtns' />}
                                </button>
                            </td>
                            <td>
                                <input 
                                    type="checkbox" 
                                    checked={selectedOffres.includes(offre.id)} 
                                    onChange={() => handleSelectOffre(offre.id)} 
                                />
                            </td>
                            <td>{offre.id}</td>
                            <td>{offre.Désignation}</td>
                            <td>{offre.Offre_prix}</td>
                            <td>{offre.Date_début}</td>
                            <td>{offre.Date_fin}</td>
                            <td>
                            <CustomDropdown
                                groupes={groupes}
                                selectedGroupes={selectedGroupes}
                                onChange={handleGroupChange}
                                onConfirm={handleConfirmGroupSelection}
                                offreId={offre.id}
                                activeDropdown={activeDropdown}
                                setActiveDropdown={setActiveDropdown}
                            />
                            </td>
                            <td>
                                <ActionButton 
                                    onClick={() => handleEdit(offre)}
                                    icon={<FontAwesomeIcon
                                        icon={faEdit}
                                        style={{
                                            color: "#007bff",
                                            cursor: "pointer",
                                        }}
                                    />}
                                />
                                <ActionButton 
                                    onClick={() => handleDelete(offre.id)}
                                    icon={<FontAwesomeIcon
                                        icon={faTrash}
                                        style={{
                                            color: "#ff0000",
                                            cursor: "pointer",
                                        }}
                                    />}
                                />
                            </td>
                        </tr>
                        {visibleDetails[offre.id] && (
                            <tr>
                                <td colSpan="9">
                                    {loading[offre.id] ? (
                                        <p>Loading details...</p>
                                    ) : error[offre.id] ? (
                                        <p>Error: {error[offre.id]}</p>
                                    ) : offreDetails[offre.id] && offreDetails[offre.id].length > 0 ? (
                                        <table className="table" style={{ marginTop:'5px' , marginBottom: '5px'}}>
                                            <thead>
                                                <tr>
                                                    <th>Code</th>
                                                    <th>Désignation</th>
                                                    <th>Prix</th>
                                                </tr>
                                            </thead>
                                            <tbody>    
                                                {offreDetails[offre.id].map(detail => (
                                                    <tr key={detail.id}>
                                                        <td>{detail.produit ? detail.produit.Code_produit : 'N/A'}</td>
                                                        <td>{detail.produit ? detail.produit.designation : 'N/A'}</td>
                                                        <td>{detail.Prix}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No details available</p>
                                    )}
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );
}

export default OffresTable;





// import React , { useState, useEffect } from 'react';
// import { MdAdd } from "react-icons/md";
// import { CiSquareMinus } from "react-icons/ci";
// import './OffresTable.css';
// import {faEdit , faTrash } from "@fortawesome/free-solid-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import axios from 'axios';


// function OffresTable({ offres, handleEdit, handleDelete, handleSelectOffre, handleSelectAll, selectedOffres }) {
//     const [visibleDetails, setVisibleDetails] = useState({});
//     const [groupes, setGroupes] = useState([]);



//     useEffect(() => { fetchGroupes(); }, []);

//     const fetchGroupes = async () => {
//         try {
//             const response = await axios.get('http://localhost:8000/api/groupes');
//             setGroupes(response.data);
//         } catch (error) {
//             console.error('Error fetching groupes:', error);
//         }
//     };

//     // Toggle visibility of offer details
//     const handleToggleDetails = (id) => {
//         setVisibleDetails(prev => ({ ...prev, [id]: !prev[id] }));
//     };

//     // Reusable button component
//     const ActionButton = ({ onClick, className, icon }) => (
//         <button onClick={onClick} className={`btn btn-sm ${className}`}>
//             {icon}
//         </button>
//     );

//     // Render table header
//     const renderHeader = () => (
//         <thead className="text-center" style={{ backgroundColor: "#adb5bd" }}>
//             <tr>
//                 <th></th>
//                 <th>{/* Checkbox for select all */}</th>
//                 <th>ID</th>
//                 <th>Désignation</th>
//                 <th>Offre Prix</th>
//                 <th>Date début</th>
//                 <th>Date fin</th>
//                 <th>Groupe Client</th>
//                 <th>Actions</th>
//             </tr>
//         </thead>
//     );

//     // Render offer details
//     const renderOffreDetails = (offre) => (
//         <tr>
//             <td colSpan="8">
//                 <table className="table table-responsive table-bordered" style={{ backgroundColor: "#adb5bd" }}>
//                     <thead>
//                         <tr>
//                             <th>Code</th>
//                             <th>Désignation</th>
//                             <th>Prix</th>
//                         </tr>
//                     </thead>
//                     <tbody>    
//                         {offre.offre_details.map(detail => (
//                             <tr key={detail.id}>
//                                 <td>{detail.Code_details}</td>
//                                 <td>{detail.Désignation}</td>
//                                 <td>{detail.Prix}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </td>
//         </tr>
//     );

//     return (
//         <table className="table table-bordered">
//             {renderHeader()}
//             <tbody className="text-center">
//                 {offres.map(offre => (
//                     <React.Fragment key={offre.id}>
//                         <tr>
//                             <td>
//                                 <ActionButton 
//                                     onClick={() => handleToggleDetails(offre.id)}
//                                     className="minibtns"
//                                     icon={visibleDetails[offre.id] ? <CiSquareMinus className='minibtns'/> : <MdAdd className='minibtns' />}
//                                 />
//                             </td>
//                             <td>
//                                 <input 
//                                     type="checkbox" 
//                                     checked={selectedOffres.includes(offre.id)} 
//                                     onChange={() => handleSelectOffre(offre.id)} 
//                                 />
//                             </td>
//                             <td>{offre.id}</td>
//                             <td>{offre.Désignation}</td>
//                             <td>{offre.Offre_prix}</td>
//                             <td>{offre.Date_début}</td>
//                             <td>{offre.Date_fin}</td>
//                             <td>
//                             <select
//                                 id="groupeSelect"
//                                 className="form-control offre-control"
//                             >
//                                 <option value="">Select a Groupe</option>
//                                 {groupes.map(groupe => (
//                                     <option key={groupe.Id_groupe} value={groupe.Id_groupe}>
//                                         {groupe.Name}
//                                     </option>
//                                 ))}
//                             </select>
//                             </td>
//                             <td>
//                                 <ActionButton 
//                                     onClick={() => handleEdit(offre)}
//                                     icon={<FontAwesomeIcon
//                                         icon={faEdit}
//                                         style={{
//                                             color: "#007bff",
//                                             cursor: "pointer",
//                                         }}
//                                         />}
//                                 />
//                                 <ActionButton 
//                                     onClick={() => handleDelete(offre.id)}
//                                     icon={<FontAwesomeIcon
//                                         icon={faTrash}
//                                         style={{
//                                             color: "#ff0000",
//                                             cursor: "pointer",
//                                         }}
//                                         />}
//                                 />
//                             </td>
//                         </tr>
//                         {visibleDetails[offre.id] && renderOffreDetails(offre)}
//                     </React.Fragment>
//                 ))}
//             </tbody>
//         </table>
//     );
// }

// export default OffresTable;