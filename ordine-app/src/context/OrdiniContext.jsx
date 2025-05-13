import React, { createContext, useContext, useState } from "react";

const OrdiniContext = createContext();

export const OrdiniProvider = ({ children }) => {
  const [ordini, setOrdini] = useState([]);

  const inviaNuovoOrdine = (ordine) => {
    setOrdini((prev) => [...prev, ordine]);
  };

  const rimuoviOrdine = (index) => {
    setOrdini((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <OrdiniContext.Provider value={{ ordini, inviaNuovoOrdine, rimuoviOrdine }}>
      {children}
    </OrdiniContext.Provider>
  );
};

export const useOrdini = () => useContext(OrdiniContext);

