import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OffresForm.css';
import { MdDeleteOutline } from "react-icons/md";
import Select from "react-dropdown-select";

function OffresForm({ form, handleChange, handleSubmit, handleOffre_detailChange, handleAddOffre_detail, handleRemoveOffre_detail, editing, setShowForm }) {
    const offreDetailsArray = Array.isArray(form.Offre_details) ? form.Offre_details : [];
    const [produits, setProduits] = useState([]);
    const [selectedProduits, setSelectedProduits] = useState([]);

    useEffect(() => {
        fetchProduits();
    }, []);

    const fetchProduits = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/produits");
            setProduits(response.data.produit);
        } catch (error) {
            console.error("Error fetching products data:", error);
            if (error.response && error.response.status === 403) {
                Swal.fire({
                    icon: "error",
                    title: "Accès refusé",
                    text: "Vous n'avez pas l'autorisation de voir la liste des produits.",
                });
            }
        }
    };

    const handleProductSelection = (selected, index) => {
        const produit = produits.find(prod => prod.id === selected[0].value);
        handleOffre_detailChange(index, 'produit_id', produit.id);
        // Update selected product in state
        const updatedSelectedProduits = [...selectedProduits];
        updatedSelectedProduits[index] = produit;
        setSelectedProduits(updatedSelectedProduits);
    };

    const handleDesignationSelection = (selected, index) => {
        const produit = produits.find(prod => prod.id === selected[0].value);
        handleOffre_detailChange(index, 'produit_id', produit.id);
        // Update selected product in state
        const updatedSelectedProduits = [...selectedProduits];
        updatedSelectedProduits[index] = produit;
        setSelectedProduits(updatedSelectedProduits);
    };

    return (
        <div className="offres-form">
            <h3>{editing ? 'Modifier' : 'Ajouter'} Un Offre</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Désignation</label>
                    <input type="text" name="Désignation" value={form.Désignation} onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Offre Prix</label>
                    <input type="number" name="Offre_prix" value={form.Offre_prix} onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Date début</label>
                    <input type="date" name="Date_début" value={form.Date_début} onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Date fin</label>
                    <input type="date" name="Date_fin" value={form.Date_fin} onChange={handleChange} className="form-control" required />
                </div>

                <h4>Details</h4>
                <div className="form-group">
                    <button type="button" className="btn btn-primary" onClick={handleAddOffre_detail}>Ajouter</button>
                </div>

                <table className="form_table">
                    <thead>
                        <tr>
                            <th>Code Produit</th>
                            <th>Désignation</th>
                            <th>Prix</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offreDetailsArray.map((Offre_detail, index) => (
                            <tr key={index}>
                                <td style={{ backgroundColor: "white" }}>
                                    <Select
                                        options={produits.map(produit => ({
                                            value: produit.id,
                                            label: produit.Code_produit,
                                        }))}
                                        onChange={(selected) => handleProductSelection(selected, index)}
                                        values={Offre_detail.produit_id ? [{ value: Offre_detail.produit_id, label: produits.find(p => p.id === Offre_detail.produit_id)?.Code_produit }] : []}
                                        placeholder="Code Produit..."
                                    />
                                </td>
                                <td>
                                    <Select
                                        options={produits.map(produit => ({
                                            value: produit.id,
                                            label: produit.designation,
                                        }))}
                                        onChange={(selected) => handleDesignationSelection(selected, index)}
                                        values={Offre_detail.produit_id ? [{ value: Offre_detail.produit_id, label: produits.find(p => p.id === Offre_detail.produit_id)?.designation }] : []}
                                        placeholder="Désignation..."
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        name="Prix"
                                        value={Offre_detail.Prix || ''}
                                        onChange={(e) => handleOffre_detailChange(index, 'Prix', e.target.value)}
                                        className="form-control prix_input"
                                        placeholder="Prix"
                                    />
                                </td>
                                <td>
                                    <button type="button" className="btn btn-danger" onClick={() => handleRemoveOffre_detail(index)}>
                                        <MdDeleteOutline className='detailsbtn' />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button type="submit" className="btn btn-primary text-center m-2" >{editing ? 'Modifier' : 'Valider'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </form>
        </div>
    );
}

export default OffresForm;

// import React from 'react';
// import './OffresForm.css';
// import { MdDeleteOutline } from "react-icons/md";

// // OffresForm component for adding or editing offers
// function OffresForm({ form, handleChange, handleSubmit, handleOffre_detailChange, handleAddOffre_detail, handleRemoveOffre_detail, editing, setShowForm }) {
//     const offreDetailsArray = Array.isArray(form.Offre_details) ? form.Offre_details : [];

//     // Reusable input field component
//     const InputField = ({ type, name, value, onChange, required = true, placeholder }) => (
//         <input 
//             type={type} 
//             name={name} 
//             value={value} 
//             onChange={onChange} 
//             className={`form-control ${name}_input`} 
//             required={required}
//             placeholder={placeholder}
//         />
//     );

//     return (
//         <div className="offres-form">
//             <h3>{editing ? 'Modifier' : 'Ajouter'} Un Offre</h3>
//             <form onSubmit={handleSubmit}>
//                 {/* Main form fields */}
//                 {['Désignation', 'Offre_prix', 'Date_début', 'Date_fin'].map(field => (
//                     <div key={field} className="form-group">
//                         <label>{field}</label>
//                         <InputField 
//                             type={field.includes('Date') ? 'date' : field === 'Offre_prix' ? 'number' : 'text'}
//                             name={field}
//                             value={form[field]}
//                             onChange={handleChange}
//                         />
//                     </div>
//                 ))}

//                 {/* Offer details section */}
//                 <h4>Details</h4>
//                 <button type="button" className="btn btn-primary" onClick={handleAddOffre_detail}>Ajouter</button>

//                 <table className="form_table">
//                     <thead>
//                         <tr>
//                             <th>Code</th>
//                             <th>Désignation</th>
//                             <th>Prix</th>
//                             <th>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {offreDetailsArray.map((detail, index) => (
//                             <tr key={index}>
//                                 {['Code_details', 'Désignation', 'Prix'].map(field => (
//                                     <td key={field}>
//                                         <InputField 
//                                             type={field === 'Prix' ? 'number' : 'text'}
//                                             name={field}
//                                             value={detail[field]}
//                                             onChange={(e) => handleOffre_detailChange(index, field, e.target.value)}
//                                             placeholder={field}
//                                         />
//                                     </td>
//                                 ))}
//                                 <td>
//                                     <button type="button" className="btn btn-danger" onClick={() => handleRemoveOffre_detail(index)}>
//                                         <MdDeleteOutline className='detailsbtn'/>
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>

//                 {/* Form action buttons */}
//                 <button type="submit" className="btn btn-primary">{editing ? 'Modifier' : 'Valider'}</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
//             </form>
//         </div>
//     );
// }

// export default OffresForm;