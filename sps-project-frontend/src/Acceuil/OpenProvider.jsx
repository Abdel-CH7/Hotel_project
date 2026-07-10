import React, { createContext, useContext, useMemo, useState } from "react";

const OpenContext = createContext();

export const OpenProvider = ({ children }) => {
  const [open, setOpen] = useState(true);

  const drawerOpenWidth = 290;
  const drawerClosedWidth = 72;

  const toggleOpen = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const dynamicStyles = useMemo(() => {
    const drawerWidth = open ? drawerOpenWidth : drawerClosedWidth;

    return {
      marginLeft: `${drawerWidth}px`,
      marginRight: 0,
      width: "auto",
      maxWidth: "none",
      minWidth: 0,
      minHeight: "100vh",
      paddingTop: "64px",
      overflowX: "hidden",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
    };
  }, [open]);

  return (
    <OpenContext.Provider value={{ dynamicStyles, open, toggleOpen }}>
      {children}
    </OpenContext.Provider>
  );
};

export const useOpen = () => useContext(OpenContext);
