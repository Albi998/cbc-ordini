// components/RequireStaff.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const RequireStaff = ({ children }) => {
  const isStaff = localStorage.getItem("isStaff") === "true";

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireStaff;
