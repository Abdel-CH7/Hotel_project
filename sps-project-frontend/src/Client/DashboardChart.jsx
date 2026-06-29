import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Card, CardContent, Typography, Box, CircularProgress, Grid } from '@mui/material';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardChart = () => {
    const [villeData, setVilleData] = useState(null);
    const [secteurData, setSecteurData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Récupération des données par ville et par secteur en parallèle
                const [villeRes, secteurRes] = await Promise.all([
                    axios.all([
                        axios.get('http://localhost:8000/api/stats/clients-particuliers/ville'),
                        axios.get('http://localhost:8000/api/stats/clients/ville')
                    ]),
                    axios.all([
                        axios.get('http://localhost:8000/api/stats/clients-particuliers/secteur'),
                        axios.get('http://localhost:8000/api/stats/clients/secteur')
                    ])
                ]);

                // Traitement des données par ville
                const [particuliersVille, societesVille] = villeRes;
                const villes = [...new Set([
                    ...particuliersVille.data.map(item => item.ville),
                    ...societesVille.data.map(item => item.ville)
                ])].sort();

                setVilleData({
                    labels: villes,
                    datasets: [
                        {
                            label: 'Clients Particuliers',
                            data: villes.map(ville => {
                                const found = particuliersVille.data.find(item => item.ville === ville);
                                return found ? parseInt(found.count) : 0;
                            }),
                            backgroundColor: 'rgba(255, 99, 132, 0.7)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Clients Sociétés',
                            data: villes.map(ville => {
                                const found = societesVille.data.find(item => item.ville === ville);
                                return found ? parseInt(found.count) : 0;
                            }),
                            backgroundColor: 'rgba(0, 175, 169, 0.71)',
                            borderColor: 'rgba(0, 175, 169, 0.71)',
                            borderWidth: 1
                        }
                    ]
                });

                // Traitement des données par secteur
                const [particuliersSecteur, societesSecteur] = secteurRes;
                const secteurs = [...new Set([
                    ...particuliersSecteur.data.map(item => item.secteur),
                    ...societesSecteur.data.map(item => item.secteur)
                ])].sort();

                setSecteurData({
                    labels: secteurs,
                    datasets: [
                        {
                            label: 'Clients par Secteur',
                            data: secteurs.map(secteur => {
                                const part = particuliersSecteur.data.find(item => item.secteur === secteur)?.count || 0;
                                const soc = societesSecteur.data.find(item => item.secteur === secteur)?.count || 0;
                                return part + soc;
                            }),
                            backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                '#9966FF', '#FF9F40', '#8AC24A', '#607D8B'
                            ],
                            borderWidth: 1
                        }
                    ]
                });

                setLoading(false);
            } catch (err) {
                console.error("Erreur:", {
                    message: err.message,
                    stack: err.stack,
                    response: err.response?.data
                });
                setError("Erreur de chargement des données: " + err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calcul des totaux globaux
    const getClientTotals = () => {
        if (!villeData) return { particuliers: 0, societes: 0 };
        
        return {
            particuliers: villeData.datasets[0].data.reduce((a, b) => a + b, 0),
            societes: villeData.datasets[1].data.reduce((a, b) => a + b, 0)
        };
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement des données...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4} color="error.main">
                <Typography variant="h6">Erreur</Typography>
                <Typography>{error}</Typography>
            </Box>
        );
    }

    if (!villeData || !secteurData) {
        return (
            <Box p={4} textAlign="center">
                <Typography variant="body1">Aucune donnée disponible pour les graphiques</Typography>
            </Box>
        );
    }

    const clientTotals = getClientTotals();
    const totalClients = clientTotals.particuliers + clientTotals.societes;

    return (
        <Grid container spacing={3}>
            {/* Graphique à barres - Répartition par ville */}
            <Grid item xs={12} md={5}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Répartition des clients par ville
                        </Typography>
                        <Box sx={{ height: '400px', position: 'relative', width: '100%' }}>
                            <Bar
                                data={villeData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    return `${context.dataset.label}: ${context.raw}`;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Villes',
                                                font: {
                                                    weight: 'bold'
                                                }
                                            },
                                            grid: {
                                                display: false
                                            }
                                        },
                                        y: {
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Nombre de clients',
                                                font: {
                                                    weight: 'bold'
                                                }
                                            },
                                            ticks: {
                                                precision: 0,
                                                stepSize: 1
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Graphique circulaire - Répartition par secteur */}
<Grid item xs={12} md={3.5}>
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Répartition des clients par secteur
            </Typography>
            <Box sx={{ height: '400px', position: 'relative' }}>
                <Pie
                    data={secteurData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    generateLabels: function(chart) {
                                        const data = chart.data;
                                        if (data.labels.length && data.datasets.length) {
                                            return data.labels.map((label, i) => {
                                                const value = data.datasets[0].data[i];
                                                return {
                                                    text: `${label} (${value})`,
                                                    fillStyle: data.datasets[0].backgroundColor[i],
                                                    hidden: false,
                                                    lineCap: 'round',
                                                    lineDash: [],
                                                    lineDashOffset: 0,
                                                    lineJoin: 'round',
                                                    lineWidth: 1,
                                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                                    pointStyle: 'circle',
                                                    rotation: 0
                                                };
                                            });
                                        }
                                        return [];
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const total = context.dataset.data.reduce((a, b) => a + b);
                                        const percentage = Math.round((context.raw / total) * 100);
                                        return `${context.label}: ${context.raw} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }}
                />
            </Box>
        </CardContent>
    </Card>
</Grid>

            {/* Graphique circulaire - Répartition globale */}
            <Grid item xs={12} md={3.5}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Répartition globale
                        </Typography>
                        <Box sx={{ height: '400px', position: 'relative' }}>
                            <Pie
                                data={{
                                    labels: [
                                        `Particuliers (${clientTotals.particuliers})`,
                                        `Sociétés (${clientTotals.societes})`
                                    ],
                                    datasets: [{
                                        data: [clientTotals.particuliers, clientTotals.societes],
                                        backgroundColor: [
                                            'rgba(255, 99, 132, 0.7)',
                                            'rgba(0, 175, 169, 0.71)'
                                        ],
                                        borderColor: [
                                            'rgba(255, 99, 132, 1)',
                                            'rgba(0, 175, 169, 0.71)'
                                        ],
                                        borderWidth: 1
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    const percentage = Math.round((context.raw / totalClients) * 100);
                                                    return `${context.label}: ${percentage}%`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ mt: 2, textAlign: 'center' }}>   
                            <Typography variant="body1">
                                Total clients: <strong>{totalClients}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Particuliers: {clientTotals.particuliers} | Sociétés: {clientTotals.societes}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default DashboardChart;