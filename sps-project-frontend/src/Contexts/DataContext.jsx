import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const DataContext = createContext();

export const useData = () => {
    return useContext(DataContext);
};

const CACHE_EXPIRATION_TIME = 600000;

export const DataProvider = ({ children }) => {
    const [data, setData] = useState({
        chambres: [],
        clients: [],
        tarifRepas: [],
        tarifsRepas: [],
        typesRepas: [],
        vues: [],
        etages: [],
        types: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const [tarifsChambreResponse, tarifsReductionResponse, tarifsRepasResponse] = await Promise.all([
                axios.get("http://localhost:8000/api/tarifs-chambre"),
                axios.get("http://localhost:8000/api/tarifs-reduction"),
                axios.get("http://localhost:8000/api/tarifs-repas")
            ]);

            const tarifsChambreData = tarifsChambreResponse.data;
            const tarifsReductionData = tarifsReductionResponse.data;
            const tarifsRepasData = tarifsRepasResponse.data;

            setData({
                // chambres: chambresData.chambres,
                // clients: clientsData.clients,
                tarifRepas: tarifsRepasData.tarifsRepasDetail,
                tarifsRepas: tarifsRepasData.tarifsRepas,
                typesRepas: tarifsRepasData.typesRepas,
                tarifChambre: tarifsChambreData.tarifsChambreDetail,
                tarifsChambre: tarifsChambreData.tarifsChambre,
                typesChambre: tarifsChambreData.typesChambre,
                tarifReduction: tarifsReductionData.tarifsReductionDetail,
                tarifsReduction: tarifsReductionData.tarifsReduction,
                typesReduction: tarifsReductionData.typesReduction,
                // vues: chambresData.vues,
                // etages: chambresData.etages,
                // types: chambresData.types
            });
            localStorage.setItem("typesRepas", JSON.stringify(tarifsRepasData.typesRepas));
            localStorage.setItem("tarifsRepasDetail", JSON.stringify(tarifsRepasData.tarifsRepasDetail));
            localStorage.setItem("tarifsRepas", JSON.stringify(tarifsRepasData.tarifsRepas));
            localStorage.setItem("typesChambre", JSON.stringify(tarifsChambreData.typesChambre));
            localStorage.setItem("tarifsChambreDetail", JSON.stringify(tarifsChambreData.tarifsChambreDetail));
            localStorage.setItem("tarifsChambre", JSON.stringify(tarifsChambreData.tarifsChambre));
            localStorage.setItem("typesReduction", JSON.stringify(tarifsReductionData.typesReduction));
            localStorage.setItem("tarifsReductionDetail", JSON.stringify(tarifsReductionData.tarifsReductionDetail));
            localStorage.setItem("tarifsReduction", JSON.stringify(tarifsReductionData.tarifsReduction));
            // localStorage.setItem("chambres", JSON.stringify(chambresData.chambres));
            // localStorage.setItem("clients", JSON.stringify(clientsData.clients));
            // localStorage.setItem("vues", JSON.stringify(chambresData.vues));
            // localStorage.setItem("etages", JSON.stringify(chambresData.etages));
            // localStorage.setItem("types", JSON.stringify(chambresData.types));
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check localStorage first
        const storedTarifRepas = localStorage.getItem("tarifsRepasDetail");
        const storedTarifsRepas = localStorage.getItem("tarifsRepas");
        const storedTypesRepas = localStorage.getItem("typesRepas");
        const storedTarifChambre = localStorage.getItem("tarifsChambreDetail");
        const storedTarifsChambre = localStorage.getItem("tarifsChambre");
        const storedTypesChambre = localStorage.getItem("typesChambre");
        const storedTarifReduction = localStorage.getItem("tarifsReductionDetail");
        const storedTarifsReduction = localStorage.getItem("tarifsReduction");
        const storedTypesReduction = localStorage.getItem("typesReduction");
        // const storedChambres = localStorage.getItem("chambres");
        // const storedClients = localStorage.getItem("clients");
        // const storedVues = localStorage.getItem("vues");
        // const storedEtages = localStorage.getItem("etages");
        // const storedTypes = localStorage.getItem("types");
        if (storedTypesRepas && storedTarifRepas && storedTarifsRepas && storedTarifChambre && storedTarifsChambre && storedTypesChambre && storedTarifReduction && storedTarifsReduction && storedTypesReduction) {
        // if (storedChambres && storedClients && storedTarifs && storedVues && storedEtages && storedTypes) {
            setData({
                // chambres: JSON.parse(storedChambres),
                // clients: JSON.parse(storedClients),
                tarifsRepasDetail: JSON.parse(storedTarifRepas),
                tarifsRepas: JSON.parse(storedTarifsRepas),
                typesRepas: JSON.parse(storedTypesRepas),
                tarifsChambreDetail: JSON.parse(storedTarifChambre),
                tarifsChambre: JSON.parse(storedTarifsChambre),
                typesChambre: JSON.parse(storedTypesChambre),
                tarifsReductionDetail: JSON.parse(storedTarifReduction),
                tarifsReduction: JSON.parse(storedTarifsReduction),
                typesReduction: JSON.parse(storedTypesReduction),
                // vues: JSON.parse(storedVues),
                // etages: JSON.parse(storedEtages),
                // types: JSON.parse(storedTypes)
            });
            setLoading(false); 
        } else {
            fetchData();
        }
    }, []);

    return (
        <DataContext.Provider value={{ data, loading, error }}>
            {children}
        </DataContext.Provider>
    );
};
