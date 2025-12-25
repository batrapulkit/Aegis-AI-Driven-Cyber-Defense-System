import React, { createContext, useContext, useState, useEffect } from "react";

interface TacticalContextType {
    isTacticalMode: boolean;
    toggleTacticalMode: () => void;
}

const TacticalContext = createContext<TacticalContextType | undefined>(undefined);

export const TacticalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isTacticalMode, setIsTacticalMode] = useState(false);

    const toggleTacticalMode = () => {
        setIsTacticalMode((prev) => !prev);
    };

    // Apply class to body for global CSS overrides
    useEffect(() => {
        if (isTacticalMode) {
            document.body.classList.add("tactical-mode");
            document.body.classList.remove("cyber-mode");
        } else {
            document.body.classList.remove("tactical-mode");
            document.body.classList.add("cyber-mode");
        }
    }, [isTacticalMode]);

    return (
        <TacticalContext.Provider value={{ isTacticalMode, toggleTacticalMode }}>
            {children}
        </TacticalContext.Provider>
    );
};

export const useTacticalMode = () => {
    const context = useContext(TacticalContext);
    if (context === undefined) {
        throw new Error("useTacticalMode must be used within a TacticalProvider");
    }
    return context;
};
