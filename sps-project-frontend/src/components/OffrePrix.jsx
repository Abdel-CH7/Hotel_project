// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import OffresForm from './OffresForm';
// import OffresTable from './OffresTable';
// import Pagination from './Pagination';
// import { MdOutlinePostAdd } from "react-icons/md";
// import './OffrePrix.css';

// function OffrePrix() {
//     const [offres, setOffres] = useState([]);
//     const [form, setForm] = useState({
//         Désignation: '',
//         Offre_prix: '',
//         Date_début: '',
//         Date_fin: '',
//         Offre_details: []  
//     });
//     const [editing, setEditing] = useState(false);
//     const [currentOffre, setCurrentOffre] = useState(null);
//     const [showForm, setShowForm] = useState(false);
//     const [error, setError] = useState(null);
//     const [successMessage, setSuccessMessage] = useState(null);
//     const [search, setSearch] = useState("");
//     const [selectedOffres, setSelectedOffres] = useState([]);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage] = useState(10);
    
//     useEffect(() => {
//         fetchOffres();
//     }, []);

//     const fetchOffres = async () => {
//         try {
//             const response = await axios.get('http://localhost:8000/api/offres');
//             console.log('Response data:', response.data); 
//             const offresData = Array.isArray(response.data.offres) ? response.data.offres : [];
//             const offresWithDetails = await Promise.all(offresData.map(async offre => {
//                 try {
//                     const detailsResponse = await axios.get(`http://localhost:8000/api/offres/${offre.id}/offre_details`);
//                     return { ...offre, Offre_details: detailsResponse.data };
//                 } catch (error) {
//                     console.error(`Error fetching details for offre ${offre.id}:`, error);
//                     return { ...offre, Offre_details: [] }; 
//                 }
//             }));
    
//             setOffres(offresWithDetails);
//             setError(null);
//         } catch (error) {
//             console.error('Error fetching Offres:', error); 
//             setError('Error fetching Offres. Please try again.');
//         }
//     };

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     const handleOffre_detailChange = (index, field, value) => {
//         const updatedOffre_details = [...form.Offre_details];
//         updatedOffre_details[index][field] = value;
//         setForm({ ...form, Offre_details: updatedOffre_details });
//     };

//     const handleAddOffre_detail = () => {
//         if (Array.isArray(form.Offre_details)) {
//             setForm({
//                 ...form,
//                 Offre_details: [
//                     ...form.Offre_details,
//                     { Code_details: '', Désignation: '', Prix: '' }
//                 ]
//             });
//         } else {
//             console.error("form.Offre_details is not an array");
//         }
//     };

//     const handleRemoveOffre_detail = (index) => {
//         const updatedOffre_details = form.Offre_details.filter((_, i) => i !== index);
//         setForm({ ...form, Offre_details: updatedOffre_details });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         const { Offre_details, ...offreData } = form;
        
//         try {
//             let response;
//             if (editing) {
//                 response = await axios.put(`http://localhost:8000/api/offres/${currentOffre.id}`, offreData);
//             } else {
//                 response = await axios.post('http://localhost:8000/api/offres', offreData);
//             }     
//             const offreId = editing ? currentOffre.id : response.data.offre.id;       
//             const detailPromises = Offre_details.map(detail => {
//                 const payload = { ...detail, id_offre: offreId };
//                 console.log('Detail payload:', payload); 
        
//                 if (detail.id) {
//                     return axios.put(`http://localhost:8000/api/offre_details/${detail.id}`, payload);
//                 } else {
//                     return axios.post('http://localhost:8000/api/offre_details', payload);
//                 }
//             });
//             await Promise.all(detailPromises);
        
//             setForm({ Désignation: '', Offre_prix: '', Date_début: '', Date_fin: '', Offre_details: [] });
//             setEditing(false);
//             setShowForm(false);
//             fetchOffres();
//             setError(null);
//             setSuccessMessage('Offre submitted successfully');
//         } catch (error) {
//             console.error('Error submitting form:', error.response ? error.response.data : error.message); 
//             setError(error.response ? error.response.data.message : 'Error submitting form. Please try again.');
//         }
//     };

//     const handleEdit = (offre) => {
//         setForm({
//             Désignation: offre.Désignation,
//             Offre_prix: offre.Offre_prix,
//             Date_début: offre.Date_début,
//             Date_fin: offre.Date_fin,
//             Offre_details: Array.isArray(offre.Offre_details) ? offre.Offre_details : []  
//         });
//         setEditing(true);
//         setCurrentOffre(offre);
//         setShowForm(true);
//     };

//     const handleAdd = () => {
//         setForm({ Désignation: '', Offre_prix: '', Date_début: '', Date_fin: '', Offre_details: [] });
//         setEditing(false);
//         setShowForm(true);
//     };

//     const handleDelete = async (id) => {
//         try {
//             const detailsResponse = await axios.get(`http://localhost:8000/api/offres/${id}/offre_details`);
//             const details = detailsResponse.data.offreDetails; 
            
//             if (Array.isArray(details)) {
//                 await Promise.all(details.map(detail => axios.delete(`http://localhost:8000/api/offre_details/${detail.id}`)));
//             } else {
//                 console.error('Expected details to be an array but got:', details);
//                 setError('Error: Details format is incorrect.');
//                 return;
//             }
            
//             await axios.delete(`http://localhost:8000/api/offres/${id}`);
//             fetchOffres();
//             setError(null);
//             setSuccessMessage('Offre deleted successfully');
//         } catch (error) {
//             console.error('Error deleting offre:', error.response ? error.response.data : error.message);
//             setError('Error deleting offre. Please try again.');
//         }
//     };
    
    

//     const handleMultipleDelete = async () => {
//         try {
//             if (selectedOffres.length === 0) {
//                 setError('No offers selected for deletion.');
//                 return;
//             }
    
//             await Promise.all(selectedOffres.map(async (id) => {
//                 try {
//                     const detailsResponse = await axios.get(`http://localhost:8000/api/offres/${id}/offre_details`);
//                     const details = detailsResponse.data.offreDetails; 
    
//                     if (Array.isArray(details)) {
//                         await Promise.all(details.map(detail => axios.delete(`http://localhost:8000/api/offre_details/${detail.id}`)));
//                     } else {
//                         console.error('Expected details to be an array but got:', details);
//                         throw new Error('Error: Details format is incorrect.');
//                     }
    
//                     await axios.delete(`http://localhost:8000/api/offres/${id}`);
//                 } catch (error) {
//                     console.error(`Error deleting offer with id ${id}:`, error.response ? error.response.data : error.message);
//                     throw error; 
//                 }
//             }));
    
//             setSelectedOffres([]);
//             fetchOffres(); 
//             setError(null);
//             setSuccessMessage('Selected offres deleted successfully');
//         } catch (error) {
//             console.error('Error deleting selected offres:', error.response ? error.response.data : error.message); 
//             setError('Error deleting selected offres. Please try again.');
//         }
//     };
    


//     const handleSelectOffre = (id) => {
//         setSelectedOffres(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
//     };

//     const handleSelectAll = () => {
//         if (selectedOffres.length === offres.length) {
//             setSelectedOffres([]);
//         } else {
//             setSelectedOffres(offres.map(offre => offre.id));
//         }
//     };

//     const handleSearch = (e) => {
//         setSearch(e.target.value);
//     };

//     const filteredOffres = offres.filter(offre => offre.Désignation.toLowerCase().includes(search.toLowerCase()));

//     const indexOfLastOffre = currentPage * itemsPerPage;
//     const indexOfFirstOffre = indexOfLastOffre - itemsPerPage;
//     const currentOffres = filteredOffres.slice(indexOfFirstOffre, indexOfLastOffre);

//     const paginate = pageNumber => setCurrentPage(pageNumber);

//     return (
//         <div className="container-fluid">
//             <div className="row">
//                 <div className={`col-md-${showForm ? 9 : 12}`}>
//                     <div className="d-flex justify-content-between align-items-center mb-3">
//                         <h1 className="mt-0">Offre Prix</h1>
//                         <input type="text" className="form-control search-bar" placeholder="Chercher" value={search} onChange={handleSearch} />
//                     </div>
//                     <button onClick={handleAdd} className="btn-ajouter"><MdOutlinePostAdd className='ajouter_icon' /> Ajouter offre</button>
//                     {error && <div className="alert alert-danger">{error}</div>}
//                     {successMessage && <div className="alert alert-success">{successMessage}</div>}
//                     <OffresTable
//                         offres={currentOffres}
//                         handleEdit={handleEdit}
//                         handleDelete={handleDelete}
//                         handleSelectOffre={handleSelectOffre}
//                         handleSelectAll={handleSelectAll}
//                         selectedOffres={selectedOffres}
//                     />
//                     <div className="d-flex justify-content-between align-items-center mt-3">
//                         <button onClick={handleMultipleDelete} className="btn btn-danger">Supprimer sélectionnées</button>
//                         <Pagination
//                             itemsPerPage={itemsPerPage}
//                             totalItems={filteredOffres.length}
//                             paginate={paginate}
//                             currentPage={currentPage}
//                         />
//                     </div>
//                 </div>
//                 {showForm && (
//                     <div className="col-md-3">
//                         <OffresForm 
//                             form={form} 
//                             handleChange={handleChange} 
//                             handleSubmit={handleSubmit} 
//                             handleOffre_detailChange={handleOffre_detailChange} 
//                             handleAddOffre_detail={handleAddOffre_detail} 
//                             handleRemoveOffre_detail={handleRemoveOffre_detail} 
//                             editing={editing} 
//                             setShowForm={setShowForm} 
//                         />
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default OffrePrix;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import OffresForm from './OffresForm';
import OffresTable from './OffresTable';
import Pagination from './Pagination';
import { MdOutlinePostAdd } from "react-icons/md";
import './OffrePrix.css';
import Swal from 'sweetalert2';


function OffrePrix() {
    const [offres, setOffres] = useState([]);
    const [form, setForm] = useState({ 
        Désignation: '', 
        Offre_prix: '', 
        Date_début: '', 
        Date_fin: '', 
        Offre_details: [] 
    });
    const [editing, setEditing] = useState(false);
    const [currentOffre, setCurrentOffre] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedOffres, setSelectedOffres] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    const fetchOffres = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/offres?includeDetails=true');
            setOffres(response.data.offres);
            localStorage.setItem('offres', JSON.stringify(response.data.offres));
            setError(null);
        } catch (error) {
            console.error('Error fetching Offres:', error);
            if (error.response && error.response.status === 403) {
                Swal.fire({
                    icon: "error",
                    title: "Accès refusé",
                    text: "Vous n'avez pas l'autorisation de voir la liste des offres.",
                });
            } else {
                setError('Error fetching Offres. Please try again.');
            }
        }
    };

    useEffect(() => {
        const offresFromStorage = localStorage.getItem('offres');
        if (offresFromStorage) {
            setOffres(JSON.parse(offresFromStorage));
        } else {
            fetchOffres();
        }
    }, []);


    // Handle form input changes
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Handle changes in Offre_detail fields
    const handleOffre_detailChange = (index, field, value) => {
        setForm(prevForm => {
            const updatedOffre_details = [...prevForm.Offre_details];
            updatedOffre_details[index] = {
                ...updatedOffre_details[index],
                [field]: value
            };
            return { ...prevForm, Offre_details: updatedOffre_details };
        });
    };

    // Add a new Offre_detail
    const handleAddOffre_detail = () => {
        setForm({
            ...form,
            Offre_details: [...form.Offre_details, { produit_id: '', Prix: '' }]
        });
    };

    // Remove an Offre_detail
    const handleRemoveOffre_detail = (index) => {
        setForm({ ...form, Offre_details: form.Offre_details.filter((_, i) => i !== index) });
    };

    // Submit form data
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { Offre_details, ...offreData } = form;
        if (!offreData.Désignation || !offreData.Offre_prix || !offreData.Date_début || !offreData.Date_fin) {
            setError('Please fill all fields for the offre.');
            return;
        }
        if (Offre_details.some(detail => !detail.produit_id || !detail.Prix)) {
        setError('Please fill all fields for each offre detail.');
        return;
    }
        try {
            const response = editing
                ? await axios.put(`http://localhost:8000/api/offres/${currentOffre.id}`, offreData)
                : await axios.post('http://localhost:8000/api/offres', offreData);
            
            const offreId = editing ? currentOffre.id : response.data.offre.id;
            await Promise.all(Offre_details.map(detail => {
                const payload = { 
                    produit_id: detail.produit_id,
                    Prix: detail.Prix,
                    id_offre: offreId 
                };
                return detail.id
                    ? axios.put(`http://localhost:8000/api/offre_details/${detail.id}`, payload)
                    : axios.post('http://localhost:8000/api/offre_details', payload);
            }));

            setForm({ Désignation: '', Offre_prix: '', Date_début: '', Date_fin: '', Offre_details: [] });
            setEditing(false);
            setShowForm(false);
            fetchOffres();
            setSuccessMessage('Offre submitted successfully');
        } catch (error) {
            console.error('Error submitting form:', error);
            setError('Error submitting form. Please try again.');
        }
    };

    // Edit an existing offre
    const handleEdit = (offre) => {
        setForm({
            Désignation: offre.Désignation,
            Offre_prix: offre.Offre_prix,
            Date_début: offre.Date_début,
            Date_fin: offre.Date_fin,
            Offre_details: Array.isArray(offre.Offre_details) ? offre.Offre_details : []
        });
        setEditing(true);
        setCurrentOffre(offre);
        setShowForm(true);
    };

    // Prepare form for adding a new offre
    const handleAdd = () => {
        setForm({ Désignation: '', Offre_prix: '', Date_début: '', Date_fin: '', Offre_details: [] });
        setEditing(false);
        setShowForm(true);
    };

    // Delete an offre and its details
    const handleDelete = async (id) => {
        try {
            const detailsResponse = await axios.get(`http://localhost:8000/api/offres/${id}/offre_details`);
            await Promise.all(detailsResponse.data.offreDetails.map(detail => 
                axios.delete(`http://localhost:8000/api/offre_details/${detail.id}`)
            ));
            await axios.delete(`http://localhost:8000/api/offres/${id}`);
            fetchOffres();
            setSuccessMessage('Offre deleted successfully');
        } catch (error) {
            setError('Error deleting offre. Please try again.');
        }
    };

    // Delete multiple selected offres
    const handleMultipleDelete = async () => {
        if (selectedOffres.length === 0) {
            setError('No offers selected for deletion.');
            return;
        }
        try {
            await Promise.all(selectedOffres.map(async (id) => {
                const detailsResponse = await axios.get(`http://localhost:8000/api/offres/${id}/offre_details`);
                await Promise.all(detailsResponse.data.offreDetails.map(detail => 
                    axios.delete(`http://localhost:8000/api/offre_details/${detail.id}`)
                ));
                await axios.delete(`http://localhost:8000/api/offres/${id}`);
            }));
            setSelectedOffres([]);
            fetchOffres();
            setSuccessMessage('Selected offres deleted successfully');
        } catch (error) {
            setError('Error deleting selected offres. Please try again.');
        }
    };

    // Toggle selection of an offre
    const handleSelectOffre = (id) => {
        setSelectedOffres(prev => 
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    // Toggle selection of all offres
    const handleSelectAll = () => {
        setSelectedOffres(selectedOffres.length === offres.length ? [] : offres.map(offre => offre.id));
    };

    // Filter offres based on search input
    const filteredOffres = offres.filter(offre => 
        offre.Désignation.toLowerCase().includes(search.toLowerCase())
    );

    // Paginate offres
    const indexOfLastOffre = currentPage * itemsPerPage;
    const indexOfFirstOffre = indexOfLastOffre - itemsPerPage;
    const currentOffres = filteredOffres.slice(indexOfFirstOffre, indexOfLastOffre);

    const handleUpdateOffreGroup = async (offreId, groupeId) => {
        try {
            await axios.put(`http://localhost:8000/api/offres/${offreId}`, { groupe_client_id: groupeId });
            fetchOffres(); // Refresh offres list to reflect the changes
            setSuccessMessage('Offre updated with new groupe client successfully.');
        } catch (error) {
            console.error('Error updating offre group:', error);
            setError('Error updating offre group. Please try again.');
        }
    };
    const handleGroupUpdate = async (offreId, groupeIds) => {
        try {
            // Refresh the specific offre
            const response = await axios.get(`http://localhost:8000/api/offres/${offreId}?includeDetails=true`);
            const updatedOffre = response.data.offre;

            setOffres(prevOffres => prevOffres.map(offre => 
                offre.id === offreId ? updatedOffre : offre
            ));

            setSuccessMessage(`Offre ${offreId} updated with new groupe(s) successfully.`);

            // Clear the success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error refreshing offre:', error);
            setError('Error refreshing offre. Please try again.');
        }
    };

    return (
        <div className="container-offre-fluid">
            <div className="row">
                <div className={`col-md-${showForm ? 9 : 12}`}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h1 className="mt-0">Offre Prix</h1>
                        <input 
                            type="text" 
                            className="form-control search-bar" 
                            placeholder="Chercher" 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>
                    <button onClick={handleAdd} className="btn-ajouter">
                        <MdOutlinePostAdd className='ajouter_icon' /> Ajouter offre
                    </button>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {successMessage && <div className="alert alert-success">{successMessage}</div>}
                    <OffresTable
                        offres={currentOffres}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        handleSelectOffre={handleSelectOffre}
                        handleSelectAll={handleSelectAll}
                        selectedOffres={selectedOffres}
                        onGroupUpdate={handleGroupUpdate}  // Make sure this line is present
                    />
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <button onClick={handleMultipleDelete} className="btn btn-danger">Supprimer sélectionnées</button>
                        <Pagination
                            itemsPerPage={itemsPerPage}
                            totalItems={filteredOffres.length}
                            paginate={setCurrentPage}
                            currentPage={currentPage}
                        />
                    </div>
                </div>
                {showForm && (
                    <div className="col-md-3">
                        <OffresForm 
                            form={form} 
                            handleChange={handleChange} 
                            handleSubmit={handleSubmit} 
                            handleOffre_detailChange={handleOffre_detailChange} 
                            handleAddOffre_detail={handleAddOffre_detail} 
                            handleRemoveOffre_detail={handleRemoveOffre_detail} 
                            editing={editing} 
                            setShowForm={setShowForm} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default OffrePrix;