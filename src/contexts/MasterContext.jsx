import React, { createContext, useContext, useState, useEffect } from 'react';

const MasterContext = createContext();

export const MasterProvider = ({ children }) => {
    const [isMaster, setIsMaster] = useState(() => {
        return sessionStorage.getItem('isMaster') === 'true';
    });

    useEffect(() => {
        sessionStorage.setItem('isMaster', isMaster);
    }, [isMaster]);

    return (
        <MasterContext.Provider value={{ isMaster, setIsMaster }}>
            {children}
        </MasterContext.Provider>
    );
};

export const useMaster = () => useContext(MasterContext);
