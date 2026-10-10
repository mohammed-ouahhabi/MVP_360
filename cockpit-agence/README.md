# Cockpit de pilotage d'agence — version démonstration

Site statique : aucun serveur, aucune base de données. Toute la logique s'exécute dans le navigateur du visiteur. Les saisies, le profil et le référentiel modifié restent dans ce navigateur ; rien n'est envoyé à Render.

## Arborescence

```
cockpit-agence/
├── render.yaml                    configuration Render (site statique)
├── public/                        seul dossier publié
│   ├── index.html                 structure des écrans
│   ├── css/app.css                styles
│   ├── assets/logo.png            logo de l'en-tête
│   └── js/
│       ├── referentiel.js         indicateurs, cibles, agences (REF_DEFAUT)
│       ├── app.js                 logique : saisie, cockpit, référentiel, aide
│       └── vendor/xlsx.full.min.js  lecture des anciens classeurs Excel
└── README.md
```

## Les pages

Une seule page HTML, quatre écrans adressables par l'ancre :

| Écran       | Adresse          |
|-------------|------------------|
| Saisie      | `/#/saisie`      |
| Cockpit     | `/#/cockpit`     |
| Référentiel | `/#/referentiel` |
| Aide        | `/#/aide`        |

Le bouton retour du navigateur fonctionne. Un lien peut imposer le poste à l'ouverture : `/#/saisie?poste=Manager`.

Le choix d'une page unique est volontaire : avec quatre fichiers HTML séparés, les saisies chargées dans le cockpit seraient perdues à chaque changement d'onglet.

## Tester en local

Depuis le dossier `public` :

```
python -m http.server 8000
```

puis ouvrir `http://localhost:8000`. Ouvrir `index.html` par double-clic fonctionne aussi.

## Déployer sur Render

1. Créer un dépôt GitHub et y pousser ce dossier.
2. Sur Render : **New → Blueprint**, sélectionner le dépôt. Render lit `render.yaml` et crée le site.
3. Choisir la région **Frankfurt**.
4. Chaque `git push` sur la branche principale redéploie le site.

Un site statique Render ne se met pas en veille : pas d'attente au premier affichage.

## Modifier le contenu

- **Une cible, un indicateur, une agence** : `public/js/referentiel.js`, puis pousser. Les visiteurs qui ont déjà enregistré des cibles dans leur navigateur gardent leurs réglages locaux.
- **Seuils de tolérance, escalade, nombre de périodes** : bloc « RÉGLAGES » en tête de `public/js/app.js`.
- **Nouvelle version** : mettre à jour `VERSION`, `DATE_VERSION` et `JOURNAL` dans `app.js`.

## Ce que la démonstration ne fait pas

- Elle ne centralise rien : chaque saisie est un fichier JSON à transmettre au pilote.
- Le code responsable est vérifié dans le navigateur. Son empreinte est lisible dans `referentiel.js` : c'est un garde-fou contre la fausse manœuvre, pas une protection. Ne pas réutiliser un code servant ailleurs.
- L'URL est publique. N'y charger que des données fictives.
