const REF_DEFAUT = {
 "version": 1,
 "revision": "2026-09-24",
 "codeResponsable": "s2:50fdccf8fbf222fa6cb0994acfde431f8bfae9eebacbe255a09e1edee99bab5c",
 "agences": [
  "Agence 1 (à nommer)",
  "Agence 2 (à nommer)",
  "Agence 3 (à nommer)",
  "Agence 4 (à nommer)",
  "Agence 5 (à nommer)"
 ],
 "postes": [
  "Manager",
  "Assistante",
  "Préventeur",
  "Responsable RH",
  "Responsable commerce",
  "Responsable gestion",
  "Correspondant méthodes",
  "Responsable de périmètre",
  "Responsable démarrage et expertises",
  "Responsable travaux",
  "Responsable achats"
 ],
 "domaines": [
  {
   "nom": "SÉCURITÉ",
   "code": "SECURITE",
   "responsable": "Assistante"
  },
  {
   "nom": "RH",
   "code": "RH",
   "responsable": "Manager"
  },
  {
   "nom": "EXPLOITATION",
   "code": "EXPLOITATION",
   "responsable": "Manager"
  },
  {
   "nom": "COMMERCE",
   "code": "COMMERCE",
   "responsable": "Responsable commerce"
  },
  {
   "nom": "GESTION",
   "code": "GESTION",
   "responsable": "Manager"
  },
  {
   "nom": "CULTURE DE SERVICES",
   "code": "CULTURE",
   "responsable": "Manager"
  },
  {
   "nom": "TRAVAUX",
   "code": "TRAVAUX",
   "responsable": "Responsable travaux"
  },
  {
   "nom": "DÉMARRAGE ET EXPERTISES",
   "code": "DEMARRAGE",
   "responsable": "Responsable démarrage et expertises"
  },
  {
   "nom": "ACHATS",
   "code": "ACHATS",
   "responsable": "Responsable achats"
  }
 ],
 "indicateurs": [
  {
   "code": "SEC-H01",
   "poste": "Assistante",
   "cadence": "Hebdo",
   "domaine": "SÉCURITÉ",
   "libelle": "HE/AC périmées",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "proposee"
  },
  {
   "code": "SEC-H02",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "SÉCURITÉ",
   "libelle": "PSM réalisés",
   "unite": "nb",
   "sens": "≥",
   "cibleH": 5,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "SEC-H03",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "SÉCURITÉ",
   "libelle": "Écarts sécurité",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "SEC-H04",
   "poste": "Préventeur",
   "cadence": "Hebdo",
   "domaine": "SÉCURITÉ",
   "libelle": "VMS non qualitatives",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "SEC-M01",
   "poste": "Préventeur",
   "cadence": "Mensuel",
   "domaine": "SÉCURITÉ",
   "libelle": "Taux de fréquence (TF)",
   "unite": "taux",
   "sens": "≤",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "SEC-M02",
   "poste": "Manager",
   "cadence": "Mensuel",
   "domaine": "SÉCURITÉ",
   "libelle": "PDP manquants ou périmés",
   "unite": "nb",
   "sens": "≤",
   "cibleH": null,
   "cibleM": 0,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "proposee"
  },
  {
   "code": "RH-H01",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "RH",
   "libelle": "Insatisfactions collaborateur",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "RH-H02",
   "poste": "Assistante",
   "cadence": "Hebdo",
   "domaine": "RH",
   "libelle": "Postes ouverts",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 2,
   "cibleM": null,
   "type": "Stock",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "RH-H03",
   "poste": "Responsable RH",
   "cadence": "Hebdo",
   "domaine": "RH",
   "libelle": "Mobilités",
   "unite": "nb",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "RH-H04",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "RH",
   "libelle": "Écarts d'engagement",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "RH-M01",
   "poste": "Responsable RH",
   "cadence": "Mensuel",
   "domaine": "RH",
   "libelle": "Modulation",
   "unite": "h",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "RH-M02",
   "poste": "Responsable RH",
   "cadence": "Mensuel",
   "domaine": "RH",
   "libelle": "Turnover",
   "unite": "%",
   "sens": "≤",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "RH-M03",
   "poste": "Responsable RH",
   "cadence": "Mensuel",
   "domaine": "RH",
   "libelle": "Absentéisme",
   "unite": "%",
   "sens": "≤",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "RH-M04",
   "poste": "Responsable RH",
   "cadence": "Mensuel",
   "domaine": "RH",
   "libelle": "Délai moyen pour pourvoir un poste",
   "unite": "j",
   "sens": "≤",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "RH-M05",
   "poste": "Responsable RH",
   "cadence": "Mensuel",
   "domaine": "RH",
   "libelle": "Alternants transformés",
   "unite": "nb",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "RH-M06",
   "poste": "Responsable RH",
   "cadence": "Mensuel",
   "domaine": "RH",
   "libelle": "EAE réalisés",
   "unite": "%",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "EXP-H01",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "EXPLOITATION",
   "libelle": "Réclamations client",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "EXP-H02",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "EXPLOITATION",
   "libelle": "Escalades",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 2,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "EXP-H03",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "EXPLOITATION",
   "libelle": "Points équipe réalisés, MVP hebdo compris",
   "unite": "nb",
   "sens": "≥",
   "cibleH": 4,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "EXP-H04",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "EXPLOITATION",
   "libelle": "Économies détectées",
   "unite": "nb",
   "sens": "≥",
   "cibleH": 1,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "EXP-H05",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "EXPLOITATION",
   "libelle": "NC astreinte",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "EXP-M01",
   "poste": "Correspondant méthodes",
   "cadence": "Mensuel",
   "domaine": "EXPLOITATION",
   "libelle": "Synthèse contrat",
   "unite": "%",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "EXP-M02",
   "poste": "Responsable de périmètre",
   "cadence": "Mensuel",
   "domaine": "EXPLOITATION",
   "libelle": "Démarrages de contrat",
   "unite": "nb",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "EXP-M03",
   "poste": "Responsable de périmètre",
   "cadence": "Mensuel",
   "domaine": "EXPLOITATION",
   "libelle": "Clôtures de contrat",
   "unite": "nb",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "EXP-M04",
   "poste": "Correspondant méthodes",
   "cadence": "Mensuel",
   "domaine": "EXPLOITATION",
   "libelle": "Carnet d'astreinte à jour",
   "unite": "O/N",
   "sens": "≥",
   "cibleH": null,
   "cibleM": 1,
   "type": "Binaire",
   "agregation": "Part de Oui",
   "origineCible": "proposee"
  },
  {
   "code": "COM-H01",
   "poste": "Responsable commerce",
   "cadence": "Hebdo",
   "domaine": "COMMERCE",
   "libelle": "Soutenances",
   "unite": "nb",
   "sens": "≥",
   "cibleH": 1,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "COM-H02",
   "poste": "Responsable commerce",
   "cadence": "Hebdo",
   "domaine": "COMMERCE",
   "libelle": "Pistes de développement identifiées",
   "unite": "nb",
   "sens": "≥",
   "cibleH": 2,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "COM-H03",
   "poste": "Responsable commerce",
   "cadence": "Hebdo",
   "domaine": "COMMERCE",
   "libelle": "Bouclages",
   "unite": "nb",
   "sens": "≥",
   "cibleH": 1,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "COM-M01",
   "poste": "Responsable commerce",
   "cadence": "Mensuel",
   "domaine": "COMMERCE",
   "libelle": "Contrats signés",
   "unite": "nb",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "COM-M02",
   "poste": "Responsable commerce",
   "cadence": "Mensuel",
   "domaine": "COMMERCE",
   "libelle": "AO en cours",
   "unite": "nb",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "COM-M03",
   "poste": "Responsable commerce",
   "cadence": "Mensuel",
   "domaine": "COMMERCE",
   "libelle": "Développement net",
   "unite": "€",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "COM-M04",
   "poste": "Responsable commerce",
   "cadence": "Mensuel",
   "domaine": "COMMERCE",
   "libelle": "Avenants de développement",
   "unite": "nb",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "COM-M05",
   "poste": "Responsable commerce",
   "cadence": "Mensuel",
   "domaine": "COMMERCE",
   "libelle": "MN entrante",
   "unite": "€",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "COM-M06",
   "poste": "Responsable commerce",
   "cadence": "Mensuel",
   "domaine": "COMMERCE",
   "libelle": "Respect du PAC",
   "unite": "%",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "GES-H01",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "GESTION",
   "libelle": "Écarts process sous-traitance",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "GES-M01",
   "poste": "Responsable gestion",
   "cadence": "Mensuel",
   "domaine": "GESTION",
   "libelle": "Pénalités",
   "unite": "€",
   "sens": "≤",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "GES-M02",
   "poste": "Responsable gestion",
   "cadence": "Mensuel",
   "domaine": "GESTION",
   "libelle": "Activité, avancement linéaire",
   "unite": "%",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "GES-M03",
   "poste": "Responsable gestion",
   "cadence": "Mensuel",
   "domaine": "GESTION",
   "libelle": "ROC",
   "unite": "€",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "CUL-H01",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "CULTURE DE SERVICES",
   "libelle": "Tenue de travail et site conformes",
   "unite": "O/N",
   "sens": "≥",
   "cibleH": 1,
   "cibleM": null,
   "type": "Binaire",
   "agregation": "Part de Oui",
   "origineCible": "reprise"
  },
  {
   "code": "CUL-H02",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "CULTURE DE SERVICES",
   "libelle": "3S pro réalisé",
   "unite": "O/N",
   "sens": "≥",
   "cibleH": 1,
   "cibleM": null,
   "type": "Binaire",
   "agregation": "Part de Oui",
   "origineCible": "reprise"
  },
  {
   "code": "CUL-H03",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "CULTURE DE SERVICES",
   "libelle": "Écarts de savoir-être",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "CUL-H04",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "CULTURE DE SERVICES",
   "libelle": "Retours positifs client",
   "unite": "nb",
   "sens": "≥",
   "cibleH": 1,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "CUL-H05",
   "poste": "Manager",
   "cadence": "Hebdo",
   "domaine": "CULTURE DE SERVICES",
   "libelle": "Bonnes pratiques terrain",
   "unite": "nb",
   "sens": "≥",
   "cibleH": 1,
   "cibleM": null,
   "type": "Cumul",
   "agregation": "Somme",
   "origineCible": "reprise"
  },
  {
   "code": "TRV-H01",
   "poste": "Responsable travaux",
   "cadence": "Hebdo",
   "domaine": "TRAVAUX",
   "libelle": "Écarts sécurité travaux",
   "unite": "nb",
   "sens": "≤",
   "cibleH": 0,
   "cibleM": null,
   "type": "Tolerance zero",
   "agregation": "Somme",
   "origineCible": "proposee"
  },
  {
   "code": "DEM-H01",
   "poste": "Responsable démarrage et expertises",
   "cadence": "Hebdo",
   "domaine": "DÉMARRAGE ET EXPERTISES",
   "libelle": "Demandes d'expertise",
   "unite": "nb",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "DEM-M01",
   "poste": "Responsable démarrage et expertises",
   "cadence": "Mensuel",
   "domaine": "DÉMARRAGE ET EXPERTISES",
   "libelle": "Taux de sollicitation, démarrage et analyse spécifique",
   "unite": "%",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "ACH-M01",
   "poste": "Responsable achats",
   "cadence": "Mensuel",
   "domaine": "ACHATS",
   "libelle": "Taux de couverture sous-traitance",
   "unite": "%",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  },
  {
   "code": "ACH-M02",
   "poste": "Responsable achats",
   "cadence": "Mensuel",
   "domaine": "ACHATS",
   "libelle": "Gains de renégociation achat",
   "unite": "€",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Somme",
   "origineCible": ""
  },
  {
   "code": "ACH-M03",
   "poste": "Responsable achats",
   "cadence": "Mensuel",
   "domaine": "ACHATS",
   "libelle": "Taux de couverture fourniture",
   "unite": "%",
   "sens": "≥",
   "cibleH": null,
   "cibleM": null,
   "type": "A definir",
   "agregation": "Valeur unique",
   "origineCible": ""
  }
 ],
 "automatisables": [
  {
   "domaine": "SÉCURITÉ",
   "libelle": "Sensibilisation (Tx) (hebdo)",
   "source": "Power BI Sécurité, sous réserve d'accès"
  },
  {
   "domaine": "SÉCURITÉ",
   "libelle": "Clôture d'action (Tx) (hebdo)",
   "source": "Power BI Sécurité, sous réserve d'accès"
  },
  {
   "domaine": "SÉCURITÉ",
   "libelle": "VMS (mensuel)",
   "source": "Power BI Sécurité"
  },
  {
   "domaine": "SÉCURITÉ",
   "libelle": "STOP / remontées terrain (mensuel)",
   "source": "Power BI Sécurité"
  },
  {
   "domaine": "EXPLOITATION",
   "libelle": "Nb OE en retard (hebdo)",
   "source": "One360"
  },
  {
   "domaine": "EXPLOITATION",
   "libelle": "RMA (mensuel)",
   "source": "One360"
  },
  {
   "domaine": "EXPLOITATION",
   "libelle": "Cockpit agence (mensuel)",
   "source": "Power BI Equans Service"
  },
  {
   "domaine": "EXPLOITATION",
   "libelle": "H passé vs H dispo (mensuel)",
   "source": "One360, heures dispo en attente"
  },
  {
   "domaine": "EXPLOITATION",
   "libelle": "Volume devis réalisé (mensuel)",
   "source": "One360"
  },
  {
   "domaine": "EXPLOITATION",
   "libelle": "Tx de transformation (mensuel)",
   "source": "One360"
  },
  {
   "domaine": "EXPLOITATION",
   "libelle": "Tx disponibilité AS / Tx utilisation AS (mensuel)",
   "source": "Oui et non automatisable, source à voir avec Catherine"
  },
  {
   "domaine": "GESTION",
   "libelle": "FAE RDU (hebdo)",
   "source": "Power BI Finance, accès Palantir demandé"
  },
  {
   "domaine": "GESTION",
   "libelle": "Nb devis facturé (hebdo)",
   "source": "One360"
  },
  {
   "domaine": "GESTION",
   "libelle": "Devis % MN entrante (hebdo)",
   "source": "One360"
  },
  {
   "domaine": "GESTION",
   "libelle": "Nb devis sans débours (hebdo)",
   "source": "One360"
  },
  {
   "domaine": "CULTURE DE SERVICES",
   "libelle": "Conformité documentaire ESBI (hebdo)",
   "source": "Forms du challenge serviciel. Attention : la colonne Sourcing dit aussi « à remplir manuellement »"
  },
  {
   "domaine": "CULTURE DE SERVICES",
   "libelle": "Avancement challenge (mensuel)",
   "source": "Export du Forms challenge serviciel"
  },
  {
   "domaine": "CULTURE DE SERVICES",
   "libelle": "Tx de conformité challenge (mensuel)",
   "source": "Export du Forms challenge serviciel"
  },
  {
   "domaine": "CULTURE DE SERVICES",
   "libelle": "GTB (Tx conformité challenge) (mensuel)",
   "source": "Export du Forms challenge serviciel"
  },
  {
   "domaine": "CULTURE DE SERVICES",
   "libelle": "RME (Tx conformité challenge) (mensuel)",
   "source": "Export du Forms challenge serviciel"
  },
  {
   "domaine": "TRAVAUX",
   "libelle": "Nb de chiffrages réalisés / Nb de sollicitations (hebdo)",
   "source": "One360"
  },
  {
   "domaine": "TRAVAUX",
   "libelle": "Temps d'attente moyen de validation devis / offre (hebdo)",
   "source": "One360"
  },
  {
   "domaine": "TRAVAUX",
   "libelle": "Nb de chiffrages réalisés / Nb de sollicitations (mensuel)",
   "source": "One360"
  },
  {
   "domaine": "TRAVAUX",
   "libelle": "Temps de réponse (mensuel)",
   "source": "One360"
  },
  {
   "domaine": "TRAVAUX",
   "libelle": "Tx de transformation (mensuel)",
   "source": "One360"
  },
  {
   "domaine": "TRAVAUX",
   "libelle": "Somme du CA prévisionnel pondérée par devis transmis (mensuel)",
   "source": "Ni source ni responsable dans le tableau"
  },
  {
   "domaine": "TRAVAUX",
   "libelle": "VMS (mensuel)",
   "source": "Power BI Sécurité"
  }
 ],
 "contributeurs": {
  "Manager": [],
  "Assistante": [],
  "Préventeur": [],
  "Responsable RH": [],
  "Responsable commerce": [],
  "Responsable gestion": [],
  "Correspondant méthodes": [],
  "Responsable de périmètre": [],
  "Responsable démarrage et expertises": [],
  "Responsable travaux": [],
  "Responsable achats": []
 }
};
