import React, { createContext, useContext, useState, useEffect } from 'react';

// Créer un contexte pour l'état "open"
const OpenContext = createContext();

export const OpenProvider = ({ children }) => {
  const [open, setOpen] = useState(true);
  const [dynamicStyles, setDynamicStyles] = useState({
    position: 'fixed',
    top: '0px',
    left: '290px',
    width: '86.5%',
    transition: 'all 0.2s ease', // Ajout de la transition
  });

  // Fonction pour basculer l'état "open" et mettre à jour les styles
  const toggleOpen = () => {
    setOpen(prevOpen => !prevOpen);
  };

  useEffect(() => {
    setDynamicStyles(prevStyles => ({
      ...prevStyles,
      left: open ? '290px' : '90px',
      width: open ? '86.5%' : '95.5%',
    }));
  }, [open]);

  return (
    <OpenContext.Provider value={{ dynamicStyles, open, toggleOpen }}>
      {children}
    </OpenContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte "open"
export const useOpen = () => useContext(OpenContext);
