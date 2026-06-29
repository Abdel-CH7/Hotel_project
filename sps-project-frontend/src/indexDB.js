// const fetchFactures = async () => {
//     try {
//         const response = await axios.get("http://localhost:8000/api/getAllDataFactureVente");
        
//         const { modpai, factures, categories, clients, ligneFactures, produits } = response.data;

//         // Stocker toutes les données dans IndexedDB
//         await storeDataInIndexedDB(factures.data, 'facturesvante');
//         await storeDataInIndexedDB(categories.data, 'categories');
//         await storeDataInIndexedDB(clients.data, 'clients');
//         await storeDataInIndexedDB(produits.data, 'produits');

//         // Mettre à jour le state React
//         setModePaimant(modpai.data);
//         setFactures(factures.data);
//         setCategories(categories.data);
//         // setClients(clients.data);
//         setLigneFacture(ligneFactures);
//         setProduits(produits.data?.filter((G)=>G.genre!=='achat'));

        
     

//         console.log("Données récupérées :", response.data);

//     } catch (error) {
//         console.error("Erreur lors de la récupération des factures :", error);
//     }
// };
// useEffect(() => {
//   const fetchDataFromIndexedDB = async () => {
//       try {
//           // Récupérer les données depuis IndexedDB
//           const facturesFromDB = await getDataFromIndexedDB('facturesvante');
//           const categoriesFromDB = await getDataFromIndexedDB('categories');
//           const clientsFromDB = await getDataFromIndexedDB('clients');
//           const produitsFromDB = await getDataFromIndexedDB('produits');

//           // Mettre à jour le state avec les données récupérées
//           if (facturesFromDB.length > 0) {
//               setFactures(facturesFromDB);
//           }
//           if (categoriesFromDB.length > 0) {
//               setCategories(categoriesFromDB);
//           }
         
//           if (clientsFromDB.length > 0) {
//               setClients(clientsFromDB);
//           }
//           if (produitsFromDB.length > 0) {
//               setProduits(produitsFromDB?.filter((G)=>G.genre!=='achat'));
//           }

//           // Si aucune donnée, appel API pour mise à jour
          
//               fetchFactures();
          
//       } catch (error) {
//           console.error("Erreur de récupération des données locales :", error);
//           fetchFactures();  // Appel API en fallback
//       }
//   };

//   fetchDataFromIndexedDB();
// }, []);
// indexedDBUtils.js

// Ouvrir la base de données GestionBE avec plusieurs object stores
export const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('sps-project', 1);
        console.log('Opening IndexedDB...');
  
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('onupgradeneeded triggered');
            const stores = ['agents', 'cacheMasquer', 'cache_locks', 'chambres', 'clients', 
              'clients_particulier', 'contact_clients', 'enfants', 'equipements', 'etages', 
              'failed_jobs', 'intervenants', 'interventions', 'jobs', 'job_batches', 'maintenance_records', 
              'migrations', 'mode_paimants', 'personal_access_tokens', 'regions', 'represantants', 
              'secteur_clients', 'sessions', 'site_clients', 'site_clients_particulier', 'suivi_interventions',
               'tarifs_actuel', 'tarifs_chambre', 'tarifs_reduction', 'tarifs_repas', 'tarif_chambre_detail', 
               'tarif_reduction_detail', 'tarif_repas_detail', 'types_chambre',
              'types_reduction', 'types_repas', 'users', 'villes', 'vues', 'zones']
            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    console.log(`Creating object store: ${store}`);
                    db.createObjectStore(store, { keyPath: 'id' });
                }
            });
        };
  
        request.onsuccess = (event) => {
            console.log('Database opened successfully');
            resolve(event.target.result);
        };
  
        request.onerror = (event) => {
            console.error('Error opening IndexedDB:', event);
            reject('Error opening IndexedDB');
        };
    });
  };
  
  
  // Stocker des données dans un object store spécifique
  export const storeDataInIndexedDB = async (data, storeName) => {
    const db = await openDB();
    console.log('Database opened:', db,data);
    console.log('Storing data for:', storeName);
  
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
  
    // Ajouter ou mettre à jour les données dans l'object store
    data.forEach(item => {
        store.put(item);
    });
  
    transaction.oncomplete = () => {
        console.log(`${storeName} data stored successfully.`);
    };
  
    transaction.onerror = (event) => {
        console.error('Error storing data in IndexedDB:', event);
    };
  };
  
  
  // Récupérer des données depuis un object store spécifique
  export const getDataFromIndexedDB = async (storeName) => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
  
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (event) => {
            const data = event.target.result;
            // Tri des données par ordre décroissant en fonction d'un attribut
            const sortedData = data.sort((a, b) => b.id - a.id);  // Remplacez 'id' par le champ que vous souhaitez utiliser
            resolve(sortedData);
        };
  
        request.onerror = (event) => {
            reject('Error fetching data from IndexedDB:', event);
        };
    });
  };
  
  
  
  // Supprimer des données depuis un object store spécifique
  export const deleteDataFromIndexedDB = async (storeName, id) => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
  
    store.delete(id);
  
    transaction.oncomplete = () => {
        console.log(`Data with id ${id} deleted from ${storeName}`);
    };
  
    transaction.onerror = (event) => {
        console.error('Error deleting data from IndexedDB:', event);
    };
  };
