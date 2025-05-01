import React, { createContext, useState, useContext } from "react";

const FormSyncContext = createContext();

export const FormSyncProvider = ({ children }) => {
  const [sharedData, setSharedData] = useState({
    residentFullName: "",
    residentPhone: "",
    dormNumber: "",
    roomNumber: "",
    address: "",
  });

  const updateSharedData = (newData) => {
    setSharedData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <FormSyncContext.Provider value={{ sharedData, updateSharedData }}>
      {children}
    </FormSyncContext.Provider>
  );
};

export const useFormSync = () => useContext(FormSyncContext);