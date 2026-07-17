import React from "react";

const RequiredLabel = ({ children, required = false }) => (
  <>
    {children}
    {required && (
      <>
        <span className="app-required-mark" aria-hidden="true"> *</span>
        <span className="visually-hidden"> champ obligatoire</span>
      </>
    )}
  </>
);

export default RequiredLabel;
