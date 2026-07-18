# Inventaire technique vérifié

## Acteurs et autorisation

- **Visiteur non authentifié** : accès public au seul endpoint `POST /api/login`.
- **Employé (`staff`)** : accès aux modules opérationnels protégés, à son profil, à son mot de passe et à sa photo.
- **Administrateur (`admin`)** : mêmes opérations que l’employé, plus la gestion des utilisateurs.
- Toutes les routes opérationnelles sont dans le groupe `auth:sanctum` + `active`; les routes `/api/users` ajoutent `admin`.
- Un compte inactif ne reçoit pas de jeton et l’ancien jeton est bloqué par `EnsureUserIsActive`.
- La désactivation révoque tous les jetons. Le dernier administrateur actif et l’auto-désactivation/rétrogradation sont protégés transactionnellement.

## Domaines actifs retenus dans les diagrammes

- **Utilisateurs** : `users`, `personal_access_tokens`.
- **Clients** : `clients` (modèle `Client`, société), `clients_particulier`, `contact_clients`, `enfants`.
- **Chambres** : `chambres`, `types_chambre`, `etages`, `vues`, `etat_chambre`, `employes`, `types_maintenance`.
- **Tarifs** : plans chambre/repas/réduction, détails normalisés, types de repas/réduction et `tarifs_actuel`.
- **Réservations** : `reservations`, `details_reservation`, segments de prix, repas, réduction et paiements.
- **Réclamations** : `reclamations`, types, canaux, départements et historique.
- **Équipements** : équipements, catégories et emplacements.

Les anciens modules Site Client, représentants et interventions restent présents côté backend mais ne sont pas exposés par le frontend final actif; ils ne sont donc pas présentés comme domaines fonctionnels du rapport final.

## Relations et contraintes importantes

- `reservations.client_id` et `reclamations.client_id` sont résolus par `client_type` (`societe` ou `particulier`) via le morph map Laravel.
- Une réservation possède plusieurs affectations `details_reservation`; `(reservation_id, chambre_id)` est unique.
- Les affectations conservent occupation et snapshots; les prix sont détaillés par `reservation_room_price_segments`.
- Les repas et réductions de réservation conservent également des snapshots tarifaires.
- `reservation_paiements.user_id` et `annule_par_id` sont nullable et `ON DELETE SET NULL`; les comptes inactifs restent lisibles dans l’audit.
- Une réclamation peut référencer une réservation, une chambre et un client polymorphe; chaque transition est journalisée.
- Les équipements peuvent être localisés dans une chambre ou un emplacement, sans influencer automatiquement la disponibilité.

## Règles de workflow confirmées

- Disponibilité : chevauchement demi-ouvert contre les réservations `en attente`/`confirmé`, plus maintenance de chambre active sur la période.
- Une réclamation ou un équipement en maintenance ne bloque pas une chambre tant que `etat_chambre.maintenance` reste faux.
- Création de réservation : validation, verrouillage des chambres, recalcul tarifaire serveur et persistance transactionnelle des snapshots.
- Paiement : auteur et annuleur issus de l’utilisateur authentifié; annulation logique conservée dans l’historique.
- Réclamation : `En attente → En cours → Traité → Résolu`, retour `Traité → En cours` avec note, annulation avant clôture; réponse obligatoire avant traitement puis résolution.
- Codes générés immuables confirmés dans les contrôleurs/tests : `CP-######`, `CS-######` et `TC-######` pour les nouvelles lignes.
