// import React, { useState, useEffect, useRef } from 'react';

// function CustomDropdown({ groupes, selectedGroupes, onChange, onConfirm, offreId, activeDropdown, setActiveDropdown }) {
//     const [localSelectedGroupes, setLocalSelectedGroupes] = useState({});
//     const dropdownRef = useRef(null);

//     useEffect(() => {
//         setLocalSelectedGroupes(selectedGroupes[offreId] || {});
//     }, [selectedGroupes, offreId]);

//     useEffect(() => {
//         function handleClickOutside(event) {
//             if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//                 setActiveDropdown(null);
//             }
//         }

//         if (activeDropdown === offreId) {
//             document.addEventListener('mousedown', handleClickOutside);
//         }

//         return () => {
//             document.removeEventListener('mousedown', handleClickOutside);
//         };
//     }, [setActiveDropdown, activeDropdown, offreId]);

//     const handleCheckboxChange = (groupeId, event) => {
//         event.stopPropagation();
//         setLocalSelectedGroupes(prev => ({
//             ...prev,
//             [groupeId]: !prev[groupeId]
//         }));
//     };

//     const handleToggle = (event) => {
//         event.stopPropagation();
//         setActiveDropdown(prevActive => prevActive === offreId ? null : offreId);
//     };

//     const handleConfirm = (event) => {
//         event.stopPropagation();
        
//         // Use the most up-to-date localSelectedGroupes
//         const selectedGroupeIds = Object.keys(localSelectedGroupes)
//             .filter(key => localSelectedGroupes[key])
//             .map(Number);

//         // Update parent component state
//         onChange(offreId, localSelectedGroupes);

//         // Send data to server immediately
//         onConfirm(offreId, selectedGroupeIds);

//         setActiveDropdown(null);
//     };

//     const isOpen = activeDropdown === offreId;

//     return (
//         <div className="dropdown" ref={dropdownRef}>
//             <button 
//                 className="dropdown-toggle"
//                 type="button"
//                 onClick={handleToggle}
//                 style={{backgroundColor: 'white', border: 'none' }}
//             >
//                 Select Groupes
//             </button>
//             <div className="dropdown-item">
//                 <button 
//                     onClick={handleConfirm}
//                     className="btn btn-primary"
//                     style={{ fontSize:'80%'}}
//                 >
//                     Confirm
//                 </button>
//             </div>
//             {isOpen && (
//                 <div 
//                     className="dropdown-menu" 
//                     style={{ display: 'block', maxHeight: '110px', overflowY: 'auto' }}
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     {groupes.map(groupe => (
//                         <div key={groupe.Id_groupe} className="dropdown-item form-check">
//                             <input
//                                 type="checkbox"
//                                 id={`groupe-${groupe.Id_groupe}-${offreId}`}
//                                 checked={!!localSelectedGroupes[groupe.Id_groupe]}
//                                 onChange={(e) => handleCheckboxChange(groupe.Id_groupe, e)}
//                                 className="form-check-input"
//                                 style={{marginLeft:'0px'}}
//                             />
//                             <label 
//                                 htmlFor={`groupe-${groupe.Id_groupe}-${offreId}`} 
//                                 className="form-check-label"
//                                 onClick={(e) => e.stopPropagation()}
//                             >
//                                 {groupe.Name}
//                             </label>
//                         </div>
//                     ))}
//                     {/* <div style={{ position:'relative',}}>
//                     <button 
//                         onClick={handleConfirm}
//                         className="btn btn-primary"
//                         style={{ fontSize:'80%'}}
//                     >
//                         Confirm
//                     </button>
//                 </div> */}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default CustomDropdown;










// import React, { useState, useEffect, useRef } from 'react';

// function CustomDropdown({ groupes, selectedGroupes, onChange, onConfirm, offreId, activeDropdown, setActiveDropdown }) {
//     const [localSelectedGroupes, setLocalSelectedGroupes] = useState({});
//     const dropdownRef = useRef(null);

//     useEffect(() => {
//         setLocalSelectedGroupes(selectedGroupes[offreId] || {});
//     }, [selectedGroupes, offreId]);

//     useEffect(() => {
//         function handleClickOutside(event) {
//             if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//                 setActiveDropdown(null);
//             }
//         }

//         if (activeDropdown === offreId) {
//             document.addEventListener('mousedown', handleClickOutside);
//         }

//         return () => {
//             document.removeEventListener('mousedown', handleClickOutside);
//         };
//     }, [setActiveDropdown, activeDropdown, offreId]);

//     const handleCheckboxChange = (groupeId, event) => {
//         event.stopPropagation();
//         setLocalSelectedGroupes(prev => ({
//             ...prev,
//             [groupeId]: !prev[groupeId]
//         }));
//     };

//     const handleToggle = (event) => {
//         event.stopPropagation();
//         setActiveDropdown(prevActive => prevActive === offreId ? null : offreId);
//     };

//     const handleConfirm = (event) => {
//         event.stopPropagation();
        
//         const selectedGroupeIds = Object.keys(localSelectedGroupes)
//             .filter(key => localSelectedGroupes[key])
//             .map(Number);

//         onChange(offreId, localSelectedGroupes);
//         onConfirm(offreId, selectedGroupeIds);
//         setActiveDropdown(null);
//     };

//     const isOpen = activeDropdown === offreId;

//     return (
//         <div className="dropdown" ref={dropdownRef}>
//             <div className="button-container" style={{ display: 'flex', alignItems: 'center' }}>
//                 <button 
//                     className="dropdown-toggle"
//                     type="button"
//                     onClick={handleToggle}
//                     style={{backgroundColor: 'white', border: 'none', marginRight: '10px' }}
//                 >
//                     Select Groupes
//                 </button>
//                 <button 
//                     onClick={handleConfirm}
//                     className="btn btn-primary"
//                     style={{ fontSize: '80%' }}
//                 >
//                     Confirm
//                 </button>
//             </div>
//             {isOpen && (
//                 <div 
//                     className="dropdown-menu" 
//                     style={{ display: 'block', maxHeight: '110px', overflowY: 'auto', marginTop: '10px' }}
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     {groupes.map(groupe => (
//                         <div key={groupe.Id_groupe} className="dropdown-item form-check">
//                             <input
//                                 type="checkbox"
//                                 id={`groupe-${groupe.Id_groupe}-${offreId}`}
//                                 checked={!!localSelectedGroupes[groupe.Id_groupe]}
//                                 onChange={(e) => handleCheckboxChange(groupe.Id_groupe, e)}
//                                 className="form-check-input"
//                                 style={{marginLeft:'0px'}}
//                             />
//                             <label 
//                                 htmlFor={`groupe-${groupe.Id_groupe}-${offreId}`} 
//                                 className="form-check-label"
//                                 onClick={(e) => e.stopPropagation()}
//                             >
//                                 {groupe.Name}
//                             </label>
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default CustomDropdown;






import React, { useState, useEffect, useRef } from 'react';

function CustomDropdown({ groupes, selectedGroupes, onChange, onConfirm, offreId, activeDropdown, setActiveDropdown }) {
    const [localSelectedGroupes, setLocalSelectedGroupes] = useState({});
    const dropdownRef = useRef(null);

    useEffect(() => {
        setLocalSelectedGroupes(selectedGroupes[offreId] || {});
    }, [selectedGroupes, offreId]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        }

        if (activeDropdown === offreId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setActiveDropdown, activeDropdown, offreId]);

    const handleCheckboxChange = (groupeId, event) => {
        event.stopPropagation();
        setLocalSelectedGroupes(prev => ({
            ...prev,
            [groupeId]: !prev[groupeId]
        }));
    };

    const handleToggle = (event) => {
        event.stopPropagation();
        setActiveDropdown(prevActive => prevActive === offreId ? null : offreId);
    };

    const handleConfirm = (event) => {
        event.stopPropagation();
        
        const selectedGroupeIds = Object.keys(localSelectedGroupes)
            .filter(key => localSelectedGroupes[key])
            .map(Number);

        onChange(offreId, localSelectedGroupes);
        onConfirm(offreId, selectedGroupeIds);
        setActiveDropdown(null);
    };

    const isOpen = activeDropdown === offreId;

    // Sort groupes to put selected ones at the top
    const sortedGroupes = [...groupes].sort((a, b) => {
        const aSelected = localSelectedGroupes[a.Id_groupe];
        const bSelected = localSelectedGroupes[b.Id_groupe];
        if (aSelected === bSelected) return 0;
        if (aSelected) return -1;
        return 1;
    });

    return (
        <div className="dropdown" ref={dropdownRef}>
            <div className="button-container" style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                    className="dropdown-toggle"
                    type="button"
                    onClick={handleToggle}
                    style={{backgroundColor: 'white', border: 'none', marginRight: '10px' }}
                >
                    Select Groupes
                    
                </button>
                <button 
                    onClick={handleConfirm}
                    className="btn btn-primary"
                    style={{ fontSize: '80%' }}
                >
                    Confirm
                </button>
            </div>
            {isOpen && (
                <div 
                    className="dropdown-menu" 
                    style={{ display: 'block', maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {sortedGroupes.map(groupe => (
                        <div key={groupe.Id_groupe} className="dropdown-item form-check">
                            <input
                                type="checkbox"
                                id={`groupe-${groupe.Id_groupe}-${offreId}`}
                                checked={!!localSelectedGroupes[groupe.Id_groupe]}
                                onChange={(e) => handleCheckboxChange(groupe.Id_groupe, e)}
                                className="form-check-input"
                                style={{marginLeft:'0px'}}
                            />
                            <label 
                                htmlFor={`groupe-${groupe.Id_groupe}-${offreId}`} 
                                className="form-check-label"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {groupe.Name}
                            </label>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CustomDropdown;