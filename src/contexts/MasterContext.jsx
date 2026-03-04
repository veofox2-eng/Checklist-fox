import React, { createContext, useContext, useState } from 'react';

const MasterContext = createContext();

export const MasterProvider = ({ children }) => {
    const [isMaster, setIsMaster] = useState(false);

    return (
        <MasterContext.Provider value={{ isMaster, setIsMaster }}>
            {children}
        </MasterContext.Provider>
    );
};

export const useMaster = () => useContext(MasterContext);
