# Diagrammes techniques du rapport PFF

Les dix fichiers PlantUML numérotés correspondent aux Figures 1 à 10 du rapport final.
Ils ont été construits à partir du projet Laravel/React final, en particulier des modèles,
migrations, routes, middleware, Form Requests, Resources, services et tests automatisés.

## Contenu

- `01-use-cases.puml` : cas d’utilisation de l’application interne.
- `02-architecture.puml` : couches et flux techniques.
- `03-domain-classes.puml` : modèle conceptuel regroupé par domaine.
- `04-database-erd.puml` : tables actives, clés et relations importantes.
- `05-auth-flow.puml` : authentification Sanctum, compte actif et autorisation.
- `06-reservation-workflow.puml` : workflow fonctionnel de réservation.
- `07-reservation-sequence.puml` : séquence de création d’une réservation.
- `08-payment-sequence.puml` : séquence de paiement et d’annulation.
- `09-complaint-sequence.puml` : séquence de traitement d’une réclamation.
- `10-equipment-impact-sequence.puml` : impact contrôlé d’un équipement sur une chambre.
- `theme.puml` : identité visuelle commune.

Les exports prêts à insérer se trouvent dans `png/` et `svg/`. Les PNG ont été rendus
à l’échelle 2 pour conserver une bonne définition dans Word et PDF.

## Rendu

Depuis la racine du dossier de travail :

```powershell
java -jar tools\plantuml.jar -checkonly documentation\diagrams\01-*.puml documentation\diagrams\02-*.puml documentation\diagrams\03-*.puml documentation\diagrams\04-*.puml documentation\diagrams\05-*.puml documentation\diagrams\06-*.puml documentation\diagrams\07-*.puml documentation\diagrams\08-*.puml documentation\diagrams\09-*.puml documentation\diagrams\10-*.puml
java -jar tools\plantuml.jar -tpng -scale 2 -o png documentation\diagrams\01-*.puml documentation\diagrams\02-*.puml documentation\diagrams\03-*.puml documentation\diagrams\04-*.puml documentation\diagrams\05-*.puml documentation\diagrams\06-*.puml documentation\diagrams\07-*.puml documentation\diagrams\08-*.puml documentation\diagrams\09-*.puml documentation\diagrams\10-*.puml
java -jar tools\plantuml.jar -tsvg -o svg documentation\diagrams\01-*.puml documentation\diagrams\02-*.puml documentation\diagrams\03-*.puml documentation\diagrams\04-*.puml documentation\diagrams\05-*.puml documentation\diagrams\06-*.puml documentation\diagrams\07-*.puml documentation\diagrams\08-*.puml documentation\diagrams\09-*.puml documentation\diagrams\10-*.puml
```

Les modules historiques Site Client, représentants et interventions existent encore côté
backend, mais ils ne sont pas exposés par le frontend final actif. Ils ne sont donc pas
présentés comme domaines fonctionnels de la solution finale.
