/* Cockpit de pilotage d'agence.
   Le referentiel pilote la saisie et la restitution.
   Aucune requete reseau : tout s'execute dans le navigateur. */

/* ======================================================================
   REGLAGES
   Tout ce qui se modifie sans toucher au reste du programme.
   Apres modification : enregistrer le fichier, puis rouvrir l'outil.
   ====================================================================== */

const VERSION      = "2.3";          // numero affiche en pied de page
const DATE_VERSION = "2026-09-24";   // date de cette version, AAAA-MM-JJ

/* Escalade automatique : nombre de periodes hors cible consecutives
   au bout desquelles un indicateur remonte de lui-meme. */
const N_ESCALADE = 3;

/* Paliers de tolerance, pour les types Cumul et Stock uniquement.
   Les types Tolerance zero et Binaire n'ont aucun palier intermediaire.
   TOL_MIN : cible "au moins". 0.80 = limite jusqu'a 20 % sous la cible.
   TOL_MAX : cible "au plus".  1.25 = limite jusqu'a 25 % au-dessus.
   TOL_ABS : cible "au plus" valant zero. 1 = un seul ecart reste en limite. */
const TOL_MIN = 0.80;
const TOL_MAX = 1.25;
const TOL_ABS = 1;

/* Nombre de periodes affichees dans les courbes de tendance. */
const N_TENDANCE = 8;

/* Nombre de periodes affichees dans les graphes d'evolution (vue agrandie). */
const N_GRAPHE = 12;

/* Code responsable : essais permis avant blocage, et duree du blocage. */
const ESSAIS_MAX = 5;
const BLOCAGE_S  = 60;

/* ====================== fin des reglages ============================= */

const JOURNAL = [
  ["2.3","2026-09-24","Nouveau référentiel : 49 indicateurs repris du tableau récap MVP du 22/09/2026, chacun rattaché à un poste et à une cadence. L'accès contributeur se fait par poste et non plus par domaine. Plusieurs personnes d'un même poste dans une agence : leurs saisies sont additionnées, ou combinées pour les Oui / Non. Saisie limitée aux indicateurs de la cadence choisie."],
  ["2.2","2026-09-22","Vue d'ensemble du cockpit : jauges de conformité et de remplissage, verdict de la période, historique par domaine, alertes classées par gravité, mouvements depuis la période précédente, comparaison des agences. Bouton « Changer d'accès » toujours visible. Numéro de version affiché à l'ouverture. Prénom et nom exigés, noms « à nommer » refusés."],
  ["2.1","2026-09-21","Écran d'accueil à chaque ouverture : contributeur ou responsable d'agence. Nom obligatoire. Code responsable fixé à l'avance, protégé par une empreinte renforcée et un blocage après cinq essais. Graphes d'évolution par indicateur, pour la conformité et pour le remplissage. Le taux de remplissage compte désormais les domaines qui n'ont rien rendu. Mise à niveau automatique d'un référentiel enregistré par une version antérieure."],
  ["2.0","2026-09-18","Travaux et expertise séparés en deux domaines. Liste fermée de contributeurs pour les domaines tenus par plusieurs personnes, gérée dans le référentiel."],
  ["1.9","2026-09-18","Chaque poste est verrouillé sur un domaine : le contributeur ne voit et ne renseigne que ses propres indicateurs. Le mode responsable donne accès à tous les domaines."],
  ["1.8","2026-09-18","Un indicateur saisi sans cible compte désormais comme renseigné et non comme manquant. Les combinaisons hors de la vue sont cliquables."],
  ["1.7","2026-09-18","Un fichier ajouté replace la vue sur sa période : il n'est plus chargé sans être visible. Signalement des enregistrements hors de la vue courante."],
  ["1.6","2026-09-18","Choix de la période par calendrier, sans liste ni borne d'années. Bouton Aujourd'hui. Navigation d'une période à l'autre dans le cockpit."],
  ["1.5","2026-09-18","Réglages regroupés en tête du fichier : seuils de tolérance, déclenchement de l'escalade, étendue des périodes, longueur des courbes."],
  ["1.4","2026-09-18","Règle de statut adaptée au type d'indicateur : les tolérances zéro et les indicateurs binaires n'ont plus de palier intermédiaire. Règle publiée dans l'aide. Validation des fichiers au chargement. Affichage adapté aux écrans étroits."],
  ["1.3","2026-09-14","Statuts recalculés au chargement à partir du référentiel, jamais repris des fichiers. Signature des saisies. Écran de contrôle des écarts. Cartes d'indicateurs cliquables et taux de remplissage."],
  ["1.2","2026-09-14","Deux modes d'accès. Périodes calculées autour de la date du jour, sans échéance. Aide intégrée et journal des versions."],
  ["1.1","2026-09-07","Saisie intégrée pilotée par le référentiel. Escalade automatique après trois périodes hors cible. Cibles figées au moment de la saisie."],
  ["1.0","2026-08-31","Première version : lecture des classeurs de saisie, restitution en deux écrans."]
];

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uniq = a => [...new Set(a)].filter(v => v !== null && v !== undefined && v !== "");
const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août",
              "septembre","octobre","novembre","décembre"];

let REF = JSON.parse(JSON.stringify(REF_DEFAUT));
let SAISIES = [];        // enregistrements consolides
let SOURCES = [];        // {nom, err, n}
let BROUILLON = {};      // saisie en cours
let VUE = {};            // filtres du cockpit
let ANOMALIES = [];      // controles de coherence du chargement
let IDX = {};            // index par code, pour les series longues
let RESPONSABLE = false; // mode d'acces courant
let PROFIL = null;       // {agence, domaine, nom} : domaine sur lequel ce poste est verrouille

/* Empreinte non reversible du code d'acces.
   Garde-fou contre une modification par inadvertance.
   Ce n'est pas un controle d'acces : le fichier reste lisible sur le poste. */
function empreinte(txt){
  let h = 0x811c9dc5;
  for (let i = 0; i < txt.length; i++){
    h ^= txt.charCodeAt(i);
    h = (h + ((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24))) >>> 0;
  }
  return h.toString(16);
}
/* Empreinte du code responsable : SHA-256 repete, avec un sel.
   Le code n'est jamais stocke en clair. Retrouver le code a partir de
   l'empreinte demande de tester les combinaisons une a une, et chaque
   essai coute dix mille calculs. */
const K256 = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256(txt){
  const b = new TextEncoder().encode(txt), l = b.length;
  const n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
  m.set(b); m[l] = 0x80;
  const dv = new DataView(m.buffer);
  dv.setUint32(n - 8, Math.floor(l / 0x20000000)); dv.setUint32(n - 4, (l << 3) >>> 0);
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const w = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64){
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i*4);
    for (let i = 16; i < 64; i++){
      const s0 = r(w[i-15],7) ^ r(w[i-15],18) ^ (w[i-15] >>> 3);
      const s1 = r(w[i-2],17) ^ r(w[i-2],19) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
    }
    let [a,b2,c,d,e,f,g,h] = H;
    for (let i = 0; i < 64; i++){
      const t1 = (h + (r(e,6) ^ r(e,11) ^ r(e,25)) + ((e & f) ^ (~e & g)) + K256[i] + w[i]) >>> 0;
      const t2 = ((r(a,2) ^ r(a,13) ^ r(a,22)) + ((a & b2) ^ (a & c) ^ (b2 & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b2; b2 = a; a = (t1 + t2) >>> 0;
    }
    H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b2)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
  }
  return H.map(x => x.toString(16).padStart(8,"0")).join("");
}
const normCode = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
function empreinteCode(c){
  const n = normCode(c);
  let x = sha256("cockpit-agence/esbi" + n);
  for (let i = 0; i < 10000; i++) x = sha256(x + n);
  return "s2:" + x;
}

/* Signature des valeurs saisies. Recalculee au chargement : un fichier
   retouche apres coup arrive avec une empreinte qui ne correspond plus. */
function signerLignes(lignes){
  return empreinte(lignes.map(l =>
    l.code+"="+(l.valeur ?? "")+"@"+(l.cible ?? "")).sort().join(";"));
}

/* Le poste est verrouille sur un domaine. Un contributeur ne voit ni ne
   renseigne les indicateurs des autres : c'est ce qui evite qu'une valeur
   soit saisie par quelqu'un qui n'en a pas la connaissance. */
function chargerProfil(){
  try{ const p = localStorage.getItem("cockpit.profil"); if (p) PROFIL = JSON.parse(p); }catch(e){}
  if (PROFIL && !postes().includes(PROFIL.poste)) PROFIL = null;
  const dep = new URLSearchParams(location.hash.replace(/^#\/?[a-z]*\??/, "")).get("poste");
  if (dep){
    const p = postes().find(x => sansAccent(x) === sansAccent(dep));
    if (p) DOMAINE_LIEN = p;
  }
}
let DOMAINE_LIEN = null;   // poste impose par le lien d'ouverture (#poste=Manager)

/* Ecran d'accueil, affiche a chaque ouverture. Deux entrees :
   contributeur (agence, domaine et nom obligatoires) ou responsable (code).
   Personne n'arrive dans l'outil sans avoir choisi l'une des deux. */
function demanderProfil(onglet, annulable){
  const p = PROFIL || {};
  opt($("pAg"), REF.agences, p.agence);
  opt($("pDo"), postes(), DOMAINE_LIEN || p.poste);
  majChampNom("pNomSel","pNom",$("pDo").value, $("pDo").value === p.poste ? (p.nom || "") : "");
  $("pDo").onchange = () => { majChampNom("pNomSel","pNom",$("pDo").value, ""); effacerErreurs(); };
  $("pNom").oninput = effacerErreurs;
  $("pCode").value = "";
  effacerErreurs();
  $("pAnnul").classList.toggle("hide", !annulable);
  $("pVer").textContent = "Version "+VERSION+" du "+dFR(DATE_VERSION);
  accueilOnglet(onglet || "c");
  $("profil").classList.remove("hide");
}
function fermerAccueil(){ $("profil").classList.add("hide"); }
function changerAcces(){ demanderProfil(RESPONSABLE ? "r" : "c", RESPONSABLE || !!PROFIL); }
function accueilOnglet(k){
  $("fC").classList.toggle("hide", k !== "c");
  $("fR").classList.toggle("hide", k !== "r");
  $("aOngC").classList.toggle("on", k === "c");
  $("aOngR").classList.toggle("on", k === "r");
  effacerErreurs();
  setTimeout(() => {
    const f = k === "r" ? $("pCode") : (lireChampNom("pNomSel","pNom") ? null : $("pNom"));
    if (f && !f.classList.contains("hide")) f.focus();
  }, 30);
}
function effacerErreurs(){
  ["pErr","rErr"].forEach(id => { $(id).classList.add("hide"); $(id).textContent = ""; });
  ["pNom","pAg","pDo","pCode"].forEach(id => $(id).classList.remove("err"));
}
function erreur(id, champ, txt){
  $(id).textContent = txt; $(id).classList.remove("hide");
  if (champ){ $(champ).classList.add("err"); $(champ).focus(); }
}
function validerProfil(){
  const agence = $("pAg").value, poste = $("pDo").value;
  const nom = lireChampNom("pNomSel","pNom").replace(/\s+/g," ").trim();
  if (!agence) return erreur("pErr","pAg","Choisir une agence.");
  if (!poste) return erreur("pErr","pDo","Choisir votre poste.");
  const mots = nom.split(" ").filter(m => /[A-Za-zÀ-ÿ]{2}/.test(m));
  if (mots.length < 2 || PLACE_VIDE.test(nom) || /\d/.test(nom))
    return erreur("pErr", $("pNomSel").classList.contains("hide") ? "pNom" : "pNomSel",
      "Indiquer votre prénom et votre nom, par exemple « Karim Benali ». Ils figurent sur chaque saisie enregistrée.");
  PROFIL = {agence, poste, nom};
  try{ localStorage.setItem("cockpit.profil", JSON.stringify(PROFIL)); }catch(e){}
  RESPONSABLE = false;
  fermerAccueil();
  BROUILLON.agence = agence; BROUILLON.poste = poste; BROUILLON.responsable = nom;
  const cads = uniq(indPoste(poste).map(i => i.cadence));
  if (cads.length === 1) BROUILLON.cadence = cads[0];
  initSaisie(); majMode();
}
/* Blocage apres plusieurs essais errones : ralentit un essai au hasard. */
function lireEssais(){
  try{ return JSON.parse(localStorage.getItem("cockpit.essais")) || {n:0, t:0}; }catch(e){ return {n:0, t:0}; }
}
function ecrireEssais(o){ try{ localStorage.setItem("cockpit.essais", JSON.stringify(o)); }catch(e){} }
function validerCode(){
  const e = lireEssais(), reste = Math.ceil((e.t - Date.now())/1000);
  if (reste > 0) return erreur("rErr", null, "Trop d'essais erronés. Réessayer dans "+reste+" s.");
  const c = $("pCode").value;
  if (normCode(c).length < 4) return erreur("rErr","pCode","Saisir le code remis par le responsable de l'outil.");
  if (!REF.codeResponsable || empreinteCode(c) !== REF.codeResponsable){
    e.n = (e.n || 0) + 1;
    if (e.n >= ESSAIS_MAX){ e.t = Date.now() + BLOCAGE_S*1000; e.n = 0; }
    ecrireEssais(e);
    $("pCode").value = "";
    return erreur("rErr","pCode", e.t > Date.now()
      ? "Code incorrect. Saisie bloquée pendant "+BLOCAGE_S+" s."
      : "Code incorrect. "+(ESSAIS_MAX - e.n)+" essai"+(ESSAIS_MAX - e.n > 1 ? "s" : "")+" avant blocage.");
  }
  ecrireEssais({n:0, t:0});
  $("pCode").value = "";
  RESPONSABLE = true;
  fermerAccueil();
  majMode();
}
function reinitProfil(){
  if (!RESPONSABLE) return;
  if (!confirm("Effacer le profil enregistré sur ce poste ? Il sera redemandé à la prochaine ouverture.")) return;
  try{ localStorage.removeItem("cockpit.profil"); }catch(e){}
  PROFIL = null; appliquerVerrou();
}
/* Hors mode responsable, le poste reste verrouille sur le domaine du profil. */
function appliquerVerrou(){
  const bloque = !RESPONSABLE;
  $("sDoWrap").classList.toggle("hide", bloque);
  $("sAg").disabled = bloque;
  if (bloque && PROFIL){
    $("sDo").value = PROFIL.poste;
    $("sAg").value = PROFIL.agence;
    majChampNom("sRpSel","sRp",PROFIL.poste, PROFIL.nom);
    ["sRp","sRpSel"].forEach(id => $(id).disabled = true);
  } else ["sRp","sRpSel"].forEach(id => $(id).disabled = false);
  if ($("rProfilDo")){
    opt($("rProfilDo"), postes(), (PROFIL||{}).poste);
    opt($("rProfilAg"), REF.agences, (PROFIL||{}).agence);
    $("rProfilNom").value = (PROFIL||{}).nom || "";
    ["rProfilDo","rProfilAg","rProfilNom"].forEach(id => $(id).disabled = true);
  }
}
/* Le bouton de mode ouvre l'accueil. Quitter le mode responsable
   ramene toujours a l'accueil : jamais d'etat ouvert sans profil. */
function basculerMode(){
  if (RESPONSABLE){
    RESPONSABLE = false; majMode();
    demanderProfil("c", false);
    return;
  }
  demanderProfil("r", !!PROFIL);
}
function majMode(){
  const b = $("nMode");
  appliquerVerrou();
  if (SAISIES.length){ majFiltresCockpit(); rendreCockpit(); }
  b.textContent = RESPONSABLE ? "Responsable d'agence" : PROFIL ? PROFIL.poste+" · "+PROFIL.nom : "Choisir un accès";
  b.classList.toggle("actif", RESPONSABLE);
  b.title = RESPONSABLE ? "Cliquer pour quitter le mode responsable" : "Cliquer pour ouvrir le mode responsable";
  if (!$("vRef").classList.contains("hide")) rendreRef();
  if (!$("vSai").classList.contains("hide")) majEnteteSaisie();
}

/* ---------- dates et periodes ---------- */
function isoLundi(d){ const x = new Date(d); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay()+6)%7)); return x; }
function numSemaine(iso){
  const d = new Date(iso+"T00:00:00Z");
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay()||7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return {s: Math.ceil(((t-y0)/86400000 + 1)/7), a: t.getUTCFullYear()};
}
const dFR = iso => iso ? iso.split("-").reverse().join("/") : "";
function libPeriode(iso, cad){
  if (!iso) return "";
  if (cad === "Hebdo"){ const w = numSemaine(iso); return "S"+String(w.s).padStart(2,"0")+" "+w.a+" ("+dFR(iso)+")"; }
  const [y,m] = iso.split("-");
  return MOIS[+m-1][0].toUpperCase()+MOIS[+m-1].slice(1)+" "+y;
}
/* Periodes calculees autour de la date du jour : la liste ne se perime jamais. */
/* Ramene une date quelconque a sa periode : 1er du mois, ou lundi de la semaine. */
function normalisePeriode(iso, cad){
  if (!iso) return null;
  if (cad === "Mensuel") return iso.slice(0,7)+"-01";
  const d = new Date(iso+"T00:00:00Z");
  if (isNaN(d)) return null;
  return isoLundi(d).toISOString().slice(0,10);
}
/* Conversions entre la periode et la valeur du champ du navigateur. */
function versChamp(iso, cad, type){
  if (!iso) return "";
  if (cad === "Mensuel") return iso.slice(0,7);
  if (type === "week"){ const w = numSemaine(iso); return w.a+"-W"+String(w.s).padStart(2,"0"); }
  return iso;
}
function depuisChamp(v, cad, type){
  if (!v) return null;
  if (cad === "Mensuel") return /^\d{4}-\d{2}$/.test(v) ? v+"-01" : normalisePeriode(v, cad);
  if (type === "week"){
    const m = v.match(/^(\d{4})-W(\d{2})$/);
    if (!m) return normalisePeriode(v, cad);
    const jan4 = new Date(Date.UTC(+m[1],0,4));
    return new Date(isoLundi(jan4).getTime() + (+m[2]-1)*7*86400000).toISOString().slice(0,10);
  }
  return normalisePeriode(v, cad);
}
/* Le navigateur accepte-t-il ce type de champ ? Sinon on retombe sur une date. */
function typeSupporte(t){
  const i = document.createElement("input");
  i.setAttribute("type", t);
  return i.type === t;
}
const TYPE_SEM = typeSupporte("week") ? "week" : "date";

function periodeCourante(cad){
  const n = new Date();
  if (cad === "Mensuel") return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-01";
  return isoLundi(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))).toISOString().slice(0,10);
}

/* ---------- referentiel ---------- */
const indDomaine = dom => REF.indicateurs.filter(i => i.domaine === dom);
const postes = () => REF.postes || uniq(REF.indicateurs.map(i => i.poste));
const indPoste = (poste, cad) => REF.indicateurs.filter(i => i.poste === poste && (!cad || i.cadence === cad));
const sansAccent = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const autoDomaine = dom => REF.automatisables.filter(i => i.domaine === dom);
const indParCode = c => REF.indicateurs.find(i => i.code === c);
const cibleDe = (ind, cad) => cad === "Hebdo" ? ind.cibleH : ind.cibleM;
const typeDe = c => (indParCode(c) || {}).type || "";
const respDomaine = dom => (REF.domaines.find(d => d.nom === dom) || {}).responsable || "";
const PLACE_VIDE = /à nommer|a nommer|prénom nom|prenom nom/i;
const contribsDe = dom => ((REF.contributeurs || {})[dom] || []).filter(x => String(x).trim() && !PLACE_VIDE.test(x));

/* Un domaine tenu par plusieurs personnes propose une liste fermee :
   le nom saisi reste celui d'une personne reellement en charge. */
function majChampNom(idSel, idTxt, dom, valeur){
  const l = contribsDe(dom);
  const sel = $(idSel), txt = $(idTxt);
  if (l.length){
    sel.classList.remove("hide"); txt.classList.add("hide");
    opt(sel, l, l.includes(valeur) ? valeur : l[0]);
  } else {
    sel.classList.add("hide"); txt.classList.remove("hide");
    txt.value = valeur || "";
  }
}
const lireChampNom = (idSel, idTxt) =>
  $(idSel).classList.contains("hide") ? $(idTxt).value.trim() : $(idSel).value;

/* Regle de statut. La tolerance depend du type d'indicateur :
   Tolerance zero : aucun palier intermediaire, tout ecart est hors cible.
   Binaire        : conforme ou hors cible, rien entre les deux.
   Cumul, Stock   : palier de tolerance de 20 % sous la cible (sens >=)
                    ou de 25 % au-dessus (sens <=).
   Un indicateur sans cible n'entre dans aucun calcul. */

function calcStatut(valeur, cible, sens, type){
  if (cible === null || cible === undefined) return "CIBLE";
  if (valeur === null || valeur === undefined || valeur === "") return "ND";
  const v = Number(valeur), c = Number(cible);
  if (!Number.isFinite(v)) return "ND";
  const t = String(type || "");

  if (t === "Tolerance zero")
    return (sens === "≥" ? v >= c : v <= c) ? "OK" : "ROUGE";
  if (t === "Binaire")
    return v >= c ? "OK" : "ROUGE";

  if (sens === "≥"){
    if (v >= c) return "OK";
    return c > 0 && v >= c * TOL_MIN ? "LIMITE" : "ROUGE";
  }
  if (v <= c) return "OK";
  return v <= (c === 0 ? TOL_ABS : c * TOL_MAX) ? "LIMITE" : "ROUGE";
}
const LIB_STATUT = {OK:"conforme", LIMITE:"limite", ROUGE:"hors cible",
                    ND:"non renseigné", CIBLE:"cible à définir"};
const ORDRE = {ROUGE:1, LIMITE:2, ND:3, CIBLE:4, OK:5};
const pill = st => '<span class="pill p-'+(st==="CIBLE"?"ND":st)+'">'+LIB_STATUT[st]+'</span>';

/* ---------- navigation ---------- */
/* Routage par ancre : #/saisie, #/cockpit, #/referentiel, #/aide.
   Une seule page : les saisies chargees dans le cockpit restent en memoire
   quand on change d'onglet. L'ancre rend chaque onglet partageable. */
const ROUTES = {saisie:"sai", cockpit:"coc", referentiel:"ref", aide:"aid"};
const ANCRES = {sai:"saisie", coc:"cockpit", ref:"referentiel", aid:"aide"};
function routeDepuisAncre(){
  const m = location.hash.match(/^#\/([a-z]+)/);
  return m && ROUTES[m[1]] ? ROUTES[m[1]] : null;
}
window.addEventListener("hashchange", () => { const r = routeDepuisAncre(); if (r) go(r, true); });
function go(v, depuisAncre){
  if (!depuisAncre && location.hash !== "#/"+ANCRES[v]) history.pushState(null, "", "#/"+ANCRES[v]);
  ["sai","coc","ref","aid"].forEach(k => {
    $("v"+k[0].toUpperCase()+k.slice(1)).classList.toggle("hide", k !== v);
    $("n"+k[0].toUpperCase()+k.slice(1)).classList.toggle("on", k === v);
  });
  if (v === "ref") rendreRef();
  if (v === "coc") majEntete();
  if (v === "sai") majEnteteSaisie();
  if (v === "aid") rendreAide();
}

function rendreAide(){
  $("aRegles").innerHTML = tab(["Type d'indicateur","Conforme","Limite","Hors cible"], [
    ["Tolérance zéro","La cible est atteinte exactement","aucun palier intermédiaire","dès le premier écart"],
    ["Binaire","La condition est remplie","aucun palier intermédiaire","la condition n'est pas remplie"],
    ["Cumul et Stock, cible « au moins »","La valeur atteint la cible","jusqu'à 20 % sous la cible","au-delà"],
    ["Cumul et Stock, cible « au plus »","La valeur reste sous la cible","jusqu'à 25 % au-dessus","au-delà"],
    ["Cible non définie","l'indicateur n'entre dans aucun calcul","","",]
  ]);
  $("aJournal").innerHTML = '<table class="jour"><tbody>'+JOURNAL.map(([v,d,t]) =>
    "<tr><td><b>"+esc(v)+"</b> du "+dFR(d)+"</td><td>"+esc(t)+"</td></tr>").join("")+"</tbody></table>";
}
function rendrePied(){
  $("pied").innerHTML =
    "<b>Cockpit de pilotage d'agence</b> · version "+VERSION+" du "+dFR(DATE_VERSION)+"<br>"+
    "Traitement entièrement local : aucune donnée saisie ou chargée ne quitte ce poste.<br>"+
    (REF.contact ? "Outil maintenu par "+esc(REF.contact)+"." : "Responsable de l'outil : à renseigner dans le référentiel.");
}

/* ================= SAISIE ================= */
function initSaisie(){
  opt($("sAg"), REF.agences, BROUILLON.agence);
  opt($("sDo"), postes(), BROUILLON.poste);
  $("sCa").value = BROUILLON.cadence || "Mensuel";
  majPeriodesSaisie();
  majChampNom("sRpSel","sRp",$("sDo").value, BROUILLON.responsable || "");
  rendreSaisie();
}
function opt(sel, vals, courant){
  sel.innerHTML = vals.map(v => {
    const val = typeof v === "object" ? v.v : v, txt = typeof v === "object" ? v.t : v;
    return '<option value="'+esc(val)+'"'+(val === courant ? " selected" : "")+">"+esc(txt)+"</option>";
  }).join("");
}
function majPeriodesSaisie(){
  const cad = $("sCa").value, ch = $("sPe");
  const type = cad === "Mensuel" ? "month" : TYPE_SEM;
  if (ch.type !== type) ch.type = type;
  $("sPeLab").textContent = cad === "Mensuel" ? "Mois de la revue" : "Semaine de la revue";
  const p = normalisePeriode(BROUILLON.periode, cad) || periodeCourante(cad);
  ch.value = versChamp(p, cad, type);
  BROUILLON.periode = p;
  majLibPeriode();
}
function majLibPeriode(){
  const cad = $("sCa").value;
  const p = depuisChamp($("sPe").value, cad, $("sPe").type);
  $("sPeLib").textContent = p ? "Période retenue : "+libPeriode(p, cad)
                              : "Choisir une période";
  return p;
}
function periodeAujourdhui(){
  const cad = $("sCa").value;
  BROUILLON.periode = periodeCourante(cad);
  $("sPe").value = versChamp(BROUILLON.periode, cad, $("sPe").type);
  majLibPeriode(); sauverBrouillon(); majEnteteSaisie();
}

["sAg","sDo","sCa","sPe","sRp","sRpSel"].forEach(id => $(id).addEventListener("change", () => {
  if (id === "sCa"){ BROUILLON.periode = null; majPeriodesSaisie(); }
  if (id === "sPe"){ const p = majLibPeriode(); if (p) BROUILLON.periode = p; }
  if (id === "sDo") majChampNom("sRpSel","sRp",$("sDo").value, "");
  if (id !== "sRp") BROUILLON.lignes = BROUILLON.lignes || {};
  rendreSaisie();
}));

function rendreSaisie(){
  const poste = $("sDo").value, cad = $("sCa").value;
  const inds = indPoste(poste, cad);
  BROUILLON.lignes = BROUILLON.lignes || {};
  const autre = cad === "Hebdo" ? "Mensuel" : "Hebdo";
  $("sTitre").textContent = poste+", saisie "+(cad === "Hebdo" ? "hebdomadaire" : "mensuelle");
  $("sHint").textContent = inds.length
    ? pl(inds.length, "indicateur")+" à renseigner. Temps estimé "+(Math.ceil(inds.length/3)+2)+" minutes. Chiffre indisponible : laisser la case vide, ne jamais estimer."
    : "Aucun indicateur "+(cad === "Hebdo" ? "hebdomadaire" : "mensuel")+" pour ce poste."+
      (indPoste(poste, autre).length ? " Choisir la cadence "+autre.toLowerCase()+"." : "");
  const doms = uniq(inds.map(i => i.domaine));
  $("sTable").innerHTML = !inds.length ? "" :
    '<table class="sz"><thead><tr><th>Indicateur</th><th class="num">Objectif</th>'+
    '<th class="num">Ma valeur</th><th>Statut</th><th>Commentaire</th><th>Remonter ?</th></tr></thead><tbody>'+
    doms.map(dom => '<tr class="grp"><td colspan="6">'+esc(dom)+'</td></tr>'+
    inds.filter(i => i.domaine === dom).map(i => {
      const l = BROUILLON.lignes[i.code] || {};
      const c = cibleDe(i, cad);
      const st = calcStatut(l.valeur, c, i.sens, i.type);
      const obj = c === null || c === undefined
        ? '<span class="gr2">à définir</span>'
        : i.type === "Binaire" ? "oui" : esc(i.sens+" "+c+" "+(i.unite||""));
      const champ = i.type === "Binaire" || i.unite === "O/N"
        ? '<select onchange="majLigne(\''+i.code+'\',\'valeur\',this.value)"><option value=""'+(l.valeur == null ? " selected" : "")+'>…</option>'+
          '<option value="1"'+(l.valeur === 1 ? " selected" : "")+'>Oui</option><option value="0"'+(l.valeur === 0 ? " selected" : "")+'>Non</option></select>'
        : '<input type="number" step="any" inputmode="decimal" value="'+esc(l.valeur ?? "")+'" oninput="majLigne(\''+i.code+'\',\'valeur\',this.value)">';
      return '<tr id="tr-'+i.code+'"'+(l.valeur != null && l.valeur !== "" ? ' class="dirty"' : '')+'>'+
        '<td>'+esc(i.libelle)+' <span class="gr2">'+esc(i.code)+'</span></td>'+
        '<td class="num gr">'+obj+'</td>'+
        '<td class="num">'+champ+'</td>'+
        '<td id="st-'+i.code+'">'+pill(st)+'</td>'+
        '<td><input type="text" id="cm-'+i.code+'" value="'+esc(l.commentaire ?? "")+
          '" placeholder="'+(st === "ROUGE" ? "obligatoire" : "facultatif")+
          '" oninput="majLigne(\''+i.code+'\',\'commentaire\',this.value)"'+
          (st === "ROUGE" && !l.commentaire ? ' class="req"' : '')+'></td>'+
        '<td><label class="chk"><input type="checkbox"'+(l.remontee ? " checked" : "")+
          ' onchange="majLigne(\''+i.code+'\',\'remontee\',this.checked)"> oui</label></td></tr>';
    }).join("")).join("")+"</tbody></table>";

  const autos = REF.automatisables.filter(a => doms.includes(a.domaine));
  $("sAutoWrap").classList.toggle("hide", !autos.length);
  if (autos.length)
    $("sAuto").innerHTML = '<table class="auto"><tbody>'+autos.map(a =>
      "<tr><td>"+esc(a.libelle)+"</td><td>"+esc(a.source)+"</td></tr>").join("")+"</tbody></table>";

  $("sFaits").value = BROUILLON.faits || "";
  majEtatSaisie();
  majEnteteSaisie();
}
function majEnteteSaisie(){
  const p = depuisChamp($("sPe").value, $("sCa").value, $("sPe").type);
  $("hsub").textContent = $("sDo").value+" · "+libPeriode(p, $("sCa").value)+" · "+$("sAg").value;
}
function majLigne(code, champ, val){
  const l = BROUILLON.lignes[code] = BROUILLON.lignes[code] || {};
  l[champ] = champ === "valeur" ? (val === "" ? null : Number(val)) : val;
  if (champ === "valeur"){
    const i = indParCode(code), st = calcStatut(l.valeur, cibleDe(i, $("sCa").value), i.sens, i.type);
    $("st-"+code).innerHTML = pill(st);
    $("tr-"+code).classList.toggle("dirty", l.valeur !== null);
    const cm = $("cm-"+code);
    cm.placeholder = st === "ROUGE" ? "obligatoire" : "facultatif";
    cm.classList.toggle("req", st === "ROUGE" && !l.commentaire);
  }
  if (champ === "commentaire"){
    const i = indParCode(code), st = calcStatut(l.valeur, cibleDe(i, $("sCa").value), i.sens, i.type);
    $("cm-"+code).classList.toggle("req", st === "ROUGE" && !val);
  }
  majEtatSaisie(); sauverBrouillon();
}
$("sFaits").addEventListener("input", e => { BROUILLON.faits = e.target.value; sauverBrouillon(); });

function majEtatSaisie(){
  const cad = $("sCa").value, inds = indPoste($("sDo").value, cad);
  let remplis = 0, manquants = [];
  inds.forEach(i => {
    const l = BROUILLON.lignes[i.code] || {};
    if (l.valeur !== null && l.valeur !== undefined) remplis++;
    if (calcStatut(l.valeur, cibleDe(i, cad), i.sens, i.type) === "ROUGE" && !l.commentaire)
      manquants.push(i.libelle);
  });
  $("sEtat").textContent = remplis+" / "+inds.length+" renseigné"+(remplis>1?"s":"");
  $("sMsg").innerHTML = manquants.length
    ? '<div class="msg w"><b>Commentaire attendu.</b> '+manquants.length+
      ' indicateur'+(manquants.length>1?"s sont":" est")+' hors cible sans explication : '+
      esc(manquants.join(", "))+'. La saisie reste enregistrable, mais l\'écart ne sera pas exploitable en revue.</div>'
    : "";
}
function sauverBrouillon(){
  BROUILLON.agence = $("sAg").value; BROUILLON.poste = $("sDo").value;
  BROUILLON.cadence = $("sCa").value;
  BROUILLON.periode = depuisChamp($("sPe").value, BROUILLON.cadence, $("sPe").type) || BROUILLON.periode;
  BROUILLON.responsable = lireChampNom("sRpSel","sRp");
  try{ localStorage.setItem("cockpit.brouillon", JSON.stringify(BROUILLON)); }catch(e){}
}
function chargerBrouillon(){
  try{ const b = localStorage.getItem("cockpit.brouillon"); if (b) BROUILLON = JSON.parse(b); }catch(e){}
}
function viderSaisie(){
  if (!confirm("Effacer toutes les valeurs saisies ?")) return;
  BROUILLON.lignes = {}; BROUILLON.faits = "";
  try{ localStorage.removeItem("cockpit.brouillon"); }catch(e){}
  rendreSaisie();
}
function exporterSaisie(){
  sauverBrouillon();
  const poste = BROUILLON.poste, cad = BROUILLON.cadence;
  if (!BROUILLON.responsable || BROUILLON.responsable.trim().split(/\s+/).length < 2){
    alert("Indiquer votre prénom et votre nom avant d'enregistrer."); return;
  }
  const lignes = indPoste(poste, cad).map(i => {
    const l = BROUILLON.lignes[i.code] || {};
    const c = cibleDe(i, cad);
    return {code:i.code, valeur: l.valeur ?? null, cible: c ?? null, sens:i.sens,
            commentaire: l.commentaire || "", remontee: !!l.remontee,
            statut: calcStatut(l.valeur, c, i.sens, i.type)};
  });
  if (!lignes.some(l => l.valeur !== null)){
    alert("Aucune valeur saisie : rien à enregistrer."); return;
  }
  const o = {format:"cockpit-saisie", version:3, agence:BROUILLON.agence, poste, domaine:poste,
             cadence:cad, periode:BROUILLON.periode, responsable:BROUILLON.responsable || "",
             saisiLe:new Date().toISOString(), faits:BROUILLON.faits || "", lignes,
             signature: signerLignes(lignes)};
  const suff = cad === "Hebdo"
    ? (w => w.a+"-S"+String(w.s).padStart(2,"0"))(numSemaine(BROUILLON.periode))
    : BROUILLON.periode.slice(0,7);
  const net = t => sansAccent(t).replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
  telecharger(JSON.stringify(o, null, 1),
    "SAISIE_"+net(poste).toUpperCase()+"_"+(cad === "Hebdo" ? "H" : "M")+"_"+
    BROUILLON.agence.replace(/\W+/g,"")+"_"+suff+"_"+net(BROUILLON.responsable)+".json", "application/json");
}
function telecharger(txt, nom, type){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt], {type}));
  a.download = nom; a.click();
}

/* ================= COCKPIT ================= */
const DATE_OK = /^\d{4}-\d{2}-\d{2}$/;
function lireSaisieJson(nom, txt){
  const o = JSON.parse(txt);
  if (o.format !== "cockpit-saisie") return {nom, err:"ce fichier n'est pas une saisie du cockpit", n:0, lignes:[]};
  if (!DATE_OK.test(String(o.periode || "")) || isNaN(new Date(o.periode)))
    return {nom, err:"période illisible (" + (o.periode || "absente") + ")", n:0, lignes:[]};
  if (!o.agence) return {nom, err:"agence absente", n:0, lignes:[]};
  if (!o.domaine && !o.poste) return {nom, err:"poste absent", n:0, lignes:[]};
  if (!Array.isArray(o.lignes) || !o.lignes.length)
    return {nom, err:"aucune ligne dans le fichier", n:0, lignes:[]};
  if (!["Hebdo","Mensuel"].includes(String(o.cadence || "").trim()))
    return {nom, err:"cadence inattendue (" + (o.cadence || "absente") + ")", n:0, lignes:[]};
  const intacte = !o.signature || o.signature === signerLignes(o.lignes || []);
  const num = x => (x === null || x === undefined || x === "" || !Number.isFinite(Number(x)))
                  ? null : Number(x);
  const lignes = (o.lignes || []).filter(l => l && l.code).map(l => ({
    agence:String(o.agence), cadence:String(o.cadence).trim(),
    periode:o.periode, domaine:(indParCode(String(l.code)) || {}).domaine || String(o.domaine || o.poste),
    poste:o.poste || (indParCode(String(l.code)) || {}).poste || "",
    responsable:o.responsable, code:String(l.code), valeur:num(l.valeur), cible:num(l.cible), sens:l.sens,
    commentaire:l.commentaire, remontee:l.remontee, statutDeclare:l.statut,
    signee: !!o.signature, intacte, faits:o.faits, _f:nom
  }));
  return {nom, err:null, n:lignes.length, lignes};
}
function lireClasseur(nom, buf){
  const wb = XLSX.read(buf, {type:"array", cellDates:true});
  const ws = wb.Sheets["TABLE_PBI"];
  if (!ws) return {nom, err:"pas un classeur de saisie (onglet TABLE_PBI absent)", n:0, lignes:[]};
  const g = XLSX.utils.sheet_to_json(ws, {header:1, defval:null, raw:true});
  const h = (g[0] || []).map(x => String(x ?? "").trim());
  const k = n => h.indexOf(n);
  const lignes = [];
  for (let r = 1; r < g.length; r++){
    const L = g[r]; if (!L) continue;
    const pick = n => k(n) === -1 ? null : L[k(n)];
    const ag = pick("Agence"), code = pick("Code");
    if (!ag || !code) continue;
    let d = pick("DateRevue");
    if (d instanceof Date) d = d.toISOString().slice(0,10);
    else if (typeof d === "number") d = new Date(Date.UTC(1899,11,30)+d*86400000).toISOString().slice(0,10);
    else if (typeof d === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(d)) d = d.split("/").reverse().join("-");
    else continue;
    if (!DATE_OK.test(d) || isNaN(new Date(d))) continue;
    const brut = pick("Valeur");
    let v = (typeof brut === "string" && brut.startsWith("#")) || brut === null ? null : Number(brut);
    if (v !== null && !Number.isFinite(v)) v = null;
    const cb = pick("Cible");
    lignes.push({agence:ag, cadence:String(pick("Cadence") ?? "Mensuel").trim(), periode:d,
      domaine:pick("Domaine"), responsable:pick("Responsable"), code,
      valeur: isNaN(v) ? null : v, cible: cb === null || cb === "" ? null : Number(cb),
      sens:pick("Sens"), commentaire:pick("Commentaire") || "",
      remontee: String(pick("Escalade") ?? "").trim() === "Oui",
      statut:null, faits:"", _f:nom});
  }
  return {nom, err:null, n:lignes.length, lignes};
}
async function chargerFichiers(fs_){
  const lus = [];
  for (const f of fs_){
    if (/^~\$/.test(f.name)) continue;
    try{
      if (/\.json$/i.test(f.name)) lus.push(lireSaisieJson(f.name, await f.text()));
      else if (/\.xlsx$/i.test(f.name)) lus.push(lireClasseur(f.name, await f.arrayBuffer()));
    }catch(e){ lus.push({nom:f.name, err:"lecture impossible ("+e.message+")", n:0, lignes:[]}); }
  }
  lus.forEach(n => {
    const i = SOURCES.findIndex(s => s.nom === n.nom);
    if (i >= 0) SOURCES[i] = n; else SOURCES.push(n);
  });
  /* Cle unique : agence + cadence + periode + code + personne.
     Une meme personne qui renvoie sa saisie remplace la precedente ;
     deux managers d'une meme agence s'additionnent. */
  const vus = new Map(); let doublons = 0;
  SOURCES.forEach(s => s.lignes.forEach(l => {
    const cle = [l.agence, l.cadence, l.periode, l.code, sansAccent(l.responsable)].join("|");
    if (vus.has(cle)) doublons++;
    vus.set(cle, l);
  }));
  /* Le cockpit ne reprend jamais le statut ecrit dans le fichier :
     il le recalcule avec la cible du referentiel. Un ecart est signale. */
  ANOMALIES = [];
  const brutes = [...vus.values()].map(l => {
    const i = indParCode(l.code) || {};
    const cibleRef = i.code ? cibleDe(i, l.cadence) : null;
    const statut = calcStatut(l.valeur, cibleRef, l.sens || i.sens, i.type);
    if (!i.code)
      ANOMALIES.push({type:"inconnu", f:l._f, txt:"code "+l.code+" absent du référentiel"});
    else if (l.cible !== null && l.cible !== undefined && cibleRef !== null && l.cible !== cibleRef)
      ANOMALIES.push({type:"cible", f:l._f, txt:i.libelle+" : cible "+l.cible+
        " dans le fichier, "+cibleRef+" au référentiel"});
    if (i.code && i.cadence && i.cadence !== l.cadence)
      ANOMALIES.push({type:"cadence", f:l._f, txt:i.libelle+" : indicateur "+i.cadence.toLowerCase()+" saisi en "+l.cadence.toLowerCase()});
    if (l.statutDeclare && l.statutDeclare !== statut && i.code)
      ANOMALIES.push({type:"statut", f:l._f, txt:i.libelle+" : déclaré « "+
        (LIB_STATUT[l.statutDeclare] || l.statutDeclare)+" », recalculé « "+LIB_STATUT[statut]+" »"});
    if (l.signee && !l.intacte && !ANOMALIES.some(x => x.type === "signature" && x.f === l._f))
      ANOMALIES.push({type:"signature", f:l._f, txt:"valeurs modifiées après enregistrement"});
    return l;
  });
  const groupes = new Map();
  brutes.forEach(l => {
    const k = [l.agence, l.cadence, l.periode, l.code].join("|");
    if (!groupes.has(k)) groupes.set(k, []);
    groupes.get(k).push(l);
  });
  SAISIES = [...groupes.values()].map(agreger);
  SOURCES.doublons = doublons;
  indexer();
  /* Un ajout replace la vue sur ce qui vient d'etre charge : sans cela
     le fichier arrive bien mais reste invisible derriere les filtres. */
  const neuves = lus.filter(l => !l.err).flatMap(l => l.lignes);
  if (neuves.length){
    const recente = neuves.reduce((a,b) => a.periode >= b.periode ? a : b);
    VUE.ag = recente.agence; VUE.ca = recente.cadence; VUE.pe = recente.periode;
  }
  majListeFichiers();
  if (SAISIES.length){ majFiltresCockpit(); rendreCockpit(); }
  $("cLoad").classList.toggle("hide", SAISIES.length > 0 && !SOURCES.some(s => s.err));
}
/* Regroupement des saisies d'une agence pour un indicateur.
   Somme : les chiffres des differentes personnes s'additionnent.
   Part de Oui : conforme seulement si tout le monde a repondu Oui.
   Valeur unique : une seule personne doit saisir ; un doublon est signale. */
function agreger(g){
  const l0 = g[g.length-1], i = indParCode(l0.code) || {};
  const vals = g.map(x => x.valeur).filter(v => v !== null && v !== undefined);
  const regle = i.agregation || "Somme";
  let valeur = null, note = "";
  if (vals.length){
    if (regle === "Part de Oui"){
      const oui = vals.filter(v => v >= 1).length;
      valeur = oui === vals.length ? 1 : 0;
      if (vals.length > 1) note = "Oui pour "+oui+" sur "+vals.length;
    } else if (regle === "Valeur unique"){
      valeur = vals[vals.length-1];
      if (vals.length > 1) ANOMALIES.push({type:"multiple", f:uniq(g.map(x => x._f)).join(", "),
        txt:i.libelle+" : "+vals.length+" saisies pour un indicateur à saisie unique, la dernière chargée est retenue"});
    } else valeur = Math.round(vals.reduce((a,b) => a+b, 0)*100)/100;
  }
  const cible = i.code ? cibleDe(i, l0.cadence) : null;
  const sens = i.sens || l0.sens;
  const plusieurs = g.length > 1;
  const comm = g.filter(x => x.commentaire).map(x => (plusieurs ? (x.responsable || "?")+" : " : "")+x.commentaire);
  if (note) comm.unshift(note);
  return {...l0, valeur, cible, cibleSaisie:l0.cible, sens, statut:calcStatut(valeur, cible, sens, i.type),
          libelle:i.libelle || l0.code, unite:i.unite || "", inconnu:!i.code,
          responsable:uniq(g.map(x => x.responsable)).join(", "), nbSaisies:g.length,
          commentaire:comm.join(" · "), remontee:g.some(x => x.remontee),
          faitsListe:g.filter(x => x.faits).map(x => ({qui:x.responsable, poste:x.poste, txt:x.faits, f:x._f}))};
}
function majListeFichiers(){
  const ok = SOURCES.filter(s => !s.err), ko = SOURCES.filter(s => s.err);
  $("cList").innerHTML = "<b>"+ok.length+" fichier"+(ok.length>1?"s lus":" lu")+"</b>, "+
    SAISIES.length+" enregistrements."+
    (ko.length ? "<br>"+ko.map(s => "⚠ "+esc(s.nom)+" : "+esc(s.err)).join("<br>") : "");
  $("cMini").textContent = ok.length+" fichier"+(ok.length>1?"s":"")+" · "+SAISIES.length+" lignes"+
    (ko.length ? " · "+ko.length+" en erreur" : "");
}
function majFiltresCockpit(){
  const ags = uniq(SAISIES.map(r => r.agence)).sort();
  VUE.ag = ags.includes(VUE.ag) ? VUE.ag : ags[0];
  opt($("cAg"), ags, VUE.ag);
  const cads = uniq(SAISIES.filter(r => r.agence === VUE.ag).map(r => r.cadence)).sort();
  VUE.ca = cads.includes(VUE.ca) ? VUE.ca : cads[0];
  opt($("cCa"), cads, VUE.ca);
  const pes = uniq(SAISIES.filter(r => r.agence === VUE.ag && r.cadence === VUE.ca)
                          .map(r => r.periode)).filter(p => DATE_OK.test(p)).sort().reverse();
  VUE.pe = pes.includes(VUE.pe) ? VUE.pe : pes[0];
  opt($("cPe"), pes.map(p => ({v:p, t:libPeriode(p, VUE.ca)})), VUE.pe);
  $("cFilt").classList.remove("hide");
  majFleches();
}
["cAg","cCa","cPe"].forEach(id => $(id).addEventListener("change", e => {
  VUE[id === "cAg" ? "ag" : id === "cCa" ? "ca" : "pe"] = e.target.value;
  if (id === "cAg") VUE.ca = null;
  if (id !== "cPe") VUE.pe = null;
  majFiltresCockpit(); rendreCockpit();
}));
function glisser(pas){
  const sel = $("cPe"), i = sel.selectedIndex + pas;
  if (i < 0 || i >= sel.options.length) return;
  sel.selectedIndex = i; VUE.pe = sel.value; majFiltresCockpit(); rendreCockpit();
}
function majFleches(){
  const sel = $("cPe");
  $("cPrev").disabled = sel.selectedIndex >= sel.options.length - 1;
  $("cNext").disabled = sel.selectedIndex <= 0;
}
/* Indicateurs attendus dans la vue : ceux de la cadence affichee,
   et pour un contributeur ceux de son poste seulement. */
const indVisibles = () => REF.indicateurs.filter(i => (!VUE.ca || i.cadence === VUE.ca) &&
                                                     (RESPONSABLE || (!!PROFIL && i.poste === PROFIL.poste)));
const perimetreDomaines = () => { const n = uniq(indVisibles().map(i => i.domaine));
                                  return REF.domaines.filter(d => n.includes(d.nom)); };
const visible = r => RESPONSABLE || (!!PROFIL && (indParCode(r.code) || {}).poste === PROFIL.poste);
const periode = () => SAISIES.filter(r => visible(r) && r.agence === VUE.ag &&
                                          r.cadence === VUE.ca && r.periode === VUE.pe);
const jusqua  = dom => SAISIES.filter(r => visible(r) && r.agence === VUE.ag && r.cadence === VUE.ca &&
                                           (!dom || r.domaine === dom) && r.periode <= VUE.pe);

/* Index [agence|cadence|code] : serie triee par periode.
   Evite de reparcourir l'ensemble des saisies a chaque indicateur affiche. */
function indexer(){
  IDX = {};
  SAISIES.forEach(r => {
    const k = r.agence+"|"+r.cadence+"|"+r.code;
    (IDX[k] = IDX[k] || []).push(r);
  });
  Object.values(IDX).forEach(a => a.sort((x,y) => x.periode < y.periode ? -1 : 1));
}
const serie = code => (IDX[VUE.ag+"|"+VUE.ca+"|"+code] || []).filter(r => r.periode <= VUE.pe);

/* Escalade automatique : hors cible sur N periodes consecutives, periode courante comprise. */
function escaladeAuto(code){
  const s = serie(code).slice(-N_ESCALADE);
  return s.length === N_ESCALADE && s.every(r => r.statut === "ROUGE");
}
/* Taux de conformite d'une periode donnee, pour la serie de tete. */
const attendusPerimetre = () => indVisibles().length;
const lignesPeriode = p => SAISIES.filter(r => visible(r) && r.agence === VUE.ag && r.cadence === VUE.ca && r.periode === p);
function remplissagePeriode(p){
  const a = attendusPerimetre();
  const n = lignesPeriode(p).filter(r => r.valeur !== null && r.valeur !== undefined).length;
  return a ? Math.min(100, Math.round(100*n/a)) : null;
}
function tauxPeriode(p){
  const d = lignesPeriode(p);
  const s = d.filter(r => r.statut === "OK" || r.statut === "LIMITE" || r.statut === "ROUGE");
  return s.length ? Math.round(100 * d.filter(r => r.statut === "OK").length / s.length) : null;
}
function periodesAvant(n){
  return uniq(SAISIES.filter(r => visible(r) && r.agence === VUE.ag && r.cadence === VUE.ca && r.periode <= VUE.pe)
                     .map(r => r.periode)).sort().slice(-n);
}
function majEntete(){
  $("hsub").textContent = SAISIES.length
    ? VUE.ag+" · "+libPeriode(VUE.pe, VUE.ca)+" · cadence "+String(VUE.ca).toLowerCase()
    : "aucune saisie chargée";
}
function rendreCockpit(){
  const d = periode();
  $("cHome").classList.toggle("hide", !d.length);
  $("cDet").classList.add("hide");
  if (!d.length) return;
  majEntete();

  const mesures = d.filter(r => r.statut === "OK" || r.statut === "LIMITE" || r.statut === "ROUGE");
  const renseignes = d.filter(r => r.valeur !== null && r.valeur !== undefined);
  const sansCible = d.filter(r => r.statut === "CIBLE");
  const ok = d.filter(r => r.statut === "OK");
  const lim = d.filter(r => r.statut === "LIMITE");
  const rou = d.filter(r => r.statut === "ROUGE");
  const nd = d.filter(r => r.statut === "ND");
  const remontes = d.filter(r => r.remontee);
  const escalades = rou.filter(r => !r.remontee && escaladeAuto(r.code));
  const domsPresents = uniq(d.map(r => r.domaine));
  const domsRendus = uniq(renseignes.map(r => r.domaine)).length;
  const domsTot = perimetreDomaines().length;
  /* Attendus : tous les indicateurs du perimetre, y compris ceux des domaines
     qui n'ont rien rendu. Sinon un domaine absent ne ferait pas baisser le taux. */
  const attendus = attendusPerimetre();
  const perimetre = perimetreDomaines();
  const pct = mesures.length ? Math.round(100*ok.length/mesures.length) : 0;
  const remplissage = attendus ? Math.round(100*renseignes.length/attendus) : 0;

  const avant = periodesAvant(2);
  const pctAvant = avant.length > 1 ? tauxPeriode(avant[0]) : null;
  const delta = pctAvant === null ? null : pct - pctAvant;
  const fleche = delta === null ? ""
    : delta === 0 ? '<span class="gr">stable</span>'
    : '<span class="'+(delta > 0 ? "up" : "dn")+'">'+(delta>0?"+":"")+delta+" pts</span>";

  KPI_DETAIL = {
    conformes: {titre:"Indicateurs conformes", lignes: ok, graphe:"conformite"},
    limite:    {titre:"Indicateurs en limite", lignes: lim},
    horscible: {titre:"Indicateurs hors cible", lignes: rou},
    traiter:   {titre:"Points à traiter", lignes: [...remontes, ...escalades]},
    manquants: {titre:"Taux de remplissage", lignes: nd, graphe:"remplissage"},
    sanscible: {titre:"Indicateurs sans cible", lignes: sansCible}
  };

  rendreVue({d, pct, delta, ok, mesures, rou, lim, nd, remontes, escalades, renseignes, attendus,
             sansCible, domsRendus, domsTot, perimetre, remplissage});

  const parDom = {};
  perimetre.forEach(dd => parDom[dd.nom] = []);
  d.forEach(r => { (parDom[r.domaine] = parDom[r.domaine] || []).push(r); });
  $("cDoms").innerHTML = Object.keys(parDom).map(dom => {
    const l = parDom[dom];
    if (!l.length) return '<button class="dom vide" disabled><div class="n">'+esc(dom)+
      '</div><div class="m">pas de saisie sur cette période</div><div class="stack"></div></button>';
    const n = l.length, c = st => l.filter(r => r.statut === st).length;
    const seg = [["OK","var(--ok)"],["LIMITE","var(--lim)"],["ROUGE","var(--rou)"]]
      .map(([st,col]) => c(st) ? '<i style="width:'+(100*c(st)/n)+'%;background:'+col+'"></i>' : "").join("")+
      (c("CIBLE") ? '<i class="hach" style="width:'+(100*c("CIBLE")/n)+'%"></i>' : "")+
      (c("ND") ? '<i style="width:'+(100*c("ND")/n)+'%;background:var(--nd)"></i>' : "");
    const saisisDom = l.filter(r => r.valeur !== null && r.valeur !== undefined).length;
    const detail = [];
    if (c("ROUGE")) detail.push(c("ROUGE")+" hors cible");
    if (c("CIBLE")) detail.push(c("CIBLE")+" sans cible");
    return '<button class="dom" onclick="voirDomaine('+JSON.stringify(dom).replace(/"/g,"&quot;")+')">'+
      '<div class="n">'+esc(dom)+'</div><div class="m">'+saisisDom+" / "+n+
      (n>1?" renseignés":" renseigné")+(detail.length ? " · "+detail.join(" · ") : "")+
      '</div><div class="stack">'+seg+'</div><div class="voir">Voir le détail</div></button>';
  }).join("");

  const aTraiter = [...remontes.map(r => ({r, motif:"signalé par le responsable"})),
                    ...escalades.map(r => ({r, motif:"hors cible depuis "+N_ESCALADE+" périodes"}))];
  $("cEsc").innerHTML = aTraiter.length ? tab(
    ["Indicateur","Domaine","Responsable","Valeur","Cible","Motif","Commentaire"],
    aTraiter.sort((a,b) => ORDRE[a.r.statut]-ORDRE[b.r.statut]).map(({r,motif}) => [
      lienInd(r), esc(r.domaine), esc(r.responsable || ""),
      {c:"num", h: r.valeur ?? "n.c."}, {c:"num gr", h: r.cible ?? "n.c."},
      '<span class="'+(motif[0] === "s" ? "gr" : "dn")+'">'+motif+"</span>",
      esc(r.commentaire || "")
    ])) : '<div class="empty">Aucun point à traiter sur cette période.</div>';

  const vusF = new Set(), faits = [];
  d.forEach(r => (r.faitsListe || []).forEach(f => { if (!vusF.has(f.f)){ vusF.add(f.f); faits.push(f); } }));
  $("cFaitsWrap").classList.toggle("hide", !faits.length);
  if (faits.length)
    $("cFaits").innerHTML = faits.map(f =>
      "<h3>"+esc(f.poste || "")+(f.qui ? " · "+esc(f.qui) : "")+"</h3><p style='margin:0 0 10px;font-size:13.5px'>"+esc(f.txt)+"</p>").join("");

  rendreControles(d);
}
let KPI_DETAIL = {};

function kpi(cle, lab, val, sub, extra){
  const k = KPI_DETAIL[cle] || {};
  const cliquable = cle && ((k.lignes && k.lignes.length) || k.graphe);
  return '<'+(cliquable ? 'button class="kpi clic" onclick="voirKpi(\''+cle+'\')"' : 'div class="kpi"')+'>'+
    '<div class="l">'+esc(lab)+'</div><div class="v">'+esc(val)+'</div>'+
    '<div class="s">'+sub+'</div>'+(extra || "")+
    (cliquable ? '<div class="voir">'+(k.graphe ? "Voir l'évolution" : "Voir la liste")+'</div>' : "")+
    '</'+(cliquable ? "button" : "div")+'>';
}
function sparkTaux(){
  const ps = periodesAvant(N_TENDANCE).map(tauxPeriode).filter(v => v !== null);
  if (ps.length < 3) return "";
  const mn = 0, mx = 100, W = 132, H = 26;
  const pts = ps.map((v,i) => (i*(W/(ps.length-1))).toFixed(1)+","+(H-(v-mn)/(mx-mn)*(H-4)-2).toFixed(1)).join(" ");
  return '<svg class="kspark" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" aria-hidden="true">'+
    '<polyline points="'+pts+'" fill="none" stroke="var(--ac)" stroke-width="2" '+
    'stroke-linejoin="round" stroke-linecap="round"/></svg>';
}
function voirKpi(cle){
  const k = KPI_DETAIL[cle]; if (!k) return;
  if (!k.lignes.length && !k.graphe) return;
  $("mTitre").textContent = k.titre;
  $("mSous").textContent = VUE.ag+" · "+libPeriode(VUE.pe, VUE.ca)+" · cadence "+String(VUE.ca).toLowerCase();
  let h = "";
  if (k.graphe){
    const ps = periodesContinues(N_GRAPHE);
    const f = k.graphe === "conformite" ? tauxPeriode : remplissagePeriode;
    const pts = ps.map(p => {
      const aDes = lignesPeriode(p).length > 0;
      return {p, lab:libCourt(p, VUE.ca), v: aDes ? f(p) : null, st:"PCT"};
    });
    h += graphe({pts, pct:true, unite:"%"});
    h += '<div class="lecture">'+lecturePct(pts, k.graphe)+'</div>';
  }
  if (k.lignes.length){
    h += '<h3 style="margin:6px 0 8px">'+(cle === "manquants" ? "Indicateurs non renseignés" : "Détail de la période")+
         ' <span class="gr" style="font-weight:400">('+k.lignes.length+')</span></h3>';
    h += tab(["Indicateur","Domaine","Responsable","Valeur","Cible","Statut","Commentaire"],
      k.lignes.slice().sort((a,b) => ORDRE[a.statut]-ORDRE[b.statut]).map(r => [
        lienInd(r), esc(r.domaine), esc(r.responsable || ""),
        {c:"num", h: r.valeur ?? "n.c."}, {c:"num gr", h: (r.cible ?? "n.c.")+" "+esc(r.unite||"")},
        pill(r.statut), esc(r.commentaire || "")]));
  } else if (cle === "manquants"){
    h += '<p class="hint">Tous les indicateurs attendus sont renseignés sur cette période.</p>';
  }
  $("mCorps").innerHTML = h;
  $("modal").classList.remove("hide");
}
const lienInd = r => '<button class="lien" onclick="voirIndicateur(\''+esc(r.code)+'\')" title="Voir l\'évolution">'+esc(r.libelle)+'</button>';

/* ================= VUE D'ENSEMBLE =================
   Tout ce qui s'affiche ici se deduit des saisies chargees et du referentiel.
   Aucun score compose : la conformite et le remplissage restent separes,
   pour qu'un bon taux ne masque jamais des chiffres manquants. */
const pl = (n, s, p) => n+" "+(n > 1 ? (p || s+"s") : s);
const signe = x => (x > 0 ? "+" : "")+x;
function statsAg(ag, p){
  const d = SAISIES.filter(r => visible(r) && r.agence === ag && r.cadence === VUE.ca && r.periode === p);
  const m = d.filter(r => ["OK","LIMITE","ROUGE"].includes(r.statut));
  const a = attendusPerimetre();
  const n = d.filter(r => r.valeur !== null && r.valeur !== undefined).length;
  return {n:d.length, taux: m.length ? Math.round(100*d.filter(r => r.statut === "OK").length/m.length) : null,
          rempl: a ? Math.min(100, Math.round(100*n/a)) : null};
}
function anneau(taux, rempl){
  const S = 176, c = S/2, r1 = 76, r2 = 58;
  const C1 = 2*Math.PI*r1, C2 = 2*Math.PI*r2;
  const arc = (r, C, v, col, w) =>
    '<circle cx="'+c+'" cy="'+c+'" r="'+r+'" fill="none" stroke="rgb(255 255 255/.10)" stroke-width="'+w+'"/>'+
    (v === null ? "" : '<circle class="arc" cx="'+c+'" cy="'+c+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+w+
      '" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+C.toFixed(1)+
      '" data-off="'+(C*(1-v/100)).toFixed(1)+'" transform="rotate(-90 '+c+' '+c+')"/>');
  return '<svg width="'+S+'" height="'+S+'" viewBox="0 0 '+S+' '+S+'" role="img" aria-label="conformité '+
    (taux ?? "non calculable")+' %, remplissage '+(rempl ?? "")+' %">'+
    arc(r1, C1, taux, "#70BD95", 13)+arc(r2, C2, rempl, "#8FB9D6", 9)+
    '<text x="'+c+'" y="'+(c+4)+'" text-anchor="middle" font-size="34" font-weight="700" fill="#fff">'+
      (taux === null ? "n.c." : taux+"%")+'</text>'+
    '<text x="'+c+'" y="'+(c+24)+'" text-anchor="middle" font-size="10.5" letter-spacing="1.4" fill="#A9C2D0">CONFORMES</text></svg>';
}
function courbeHero(){
  const ps = periodesContinues(N_GRAPHE);
  if (ps.length < 2) return '<div class="t">Évolution</div><p style="font-size:12px;color:#8FB3C9;margin:6px 4px">Charger au moins deux périodes pour voir une tendance.</p>';
  const W = 310, H = 132, L = 26, R = 8, T = 10, B = 20;
  const X = i => L + i*(W-L-R)/(ps.length-1), Y = v => T + (H-T-B)*(1 - v/100);
  const serie2 = f => ps.map(p => lignesPeriode(p).length ? f(p) : null);
  const tx = serie2(tauxPeriode), rp = serie2(remplissagePeriode);
  let g = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="évolution de la conformité et du remplissage">';
  [0,50,100].forEach(v => g += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="rgb(255 255 255/.12)"/>'+
    '<text x="'+(L-5)+'" y="'+(Y(v)+3.5)+'" text-anchor="end" font-size="9" fill="#8FB3C9">'+v+'</text>');
  const ligne = (vals, col, w) => { let seg = [], out = "";
    const fin = () => { if (seg.length > 1) out += '<polyline points="'+seg.join(" ")+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linejoin="round" stroke-linecap="round"/>'; seg = []; };
    vals.forEach((v,i) => v === null ? fin() : seg.push(X(i).toFixed(1)+","+Y(v).toFixed(1))); fin();
    vals.forEach((v,i) => { if (v !== null && i === vals.length-1) out += '<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="4" fill="'+col+'" stroke="#06304A" stroke-width="2"/>'; });
    return out; };
  g += ligne(rp, "#8FB9D6", 1.8) + ligne(tx, "#70BD95", 2.4);
  g += '<text x="'+L+'" y="'+(H-5)+'" font-size="9.5" fill="#8FB3C9">'+esc(libCourt(ps[0], VUE.ca))+'</text>'+
       '<text x="'+(W-R)+'" y="'+(H-5)+'" text-anchor="end" font-size="9.5" fill="#fff" font-weight="700">'+esc(libCourt(ps[ps.length-1], VUE.ca))+'</text>';
  return '<div class="t">Évolution sur '+ps.length+' périodes</div>'+g+'</svg>';
}
function rendreVue(o){
  const {d, delta, ok, mesures, rou, lim, nd, remontes, escalades, renseignes, attendus, domsRendus, domsTot, perimetre, remplissage} = o;
  const taux = mesures.length ? o.pct : null;
  const absents = perimetre.map(x => x.nom).filter(n => !d.some(r => r.domaine === n));
  const alertes = calculerAlertes(d, absents);
  const tendances = alertes.filter(a => a.type === "derive").length;
  const nbTraiter = remontes.length + escalades.length;
  KPI_DETAIL.derives = {titre:"Dérives détectées", lignes: alertes.filter(a => a.type === "derive").map(a => a.r)};

  let v = taux === null
    ? "Aucun indicateur mesurable sur cette période."
    : "<b>"+taux+" % des indicateurs mesurés sont conformes</b>"+
      (delta === null ? "" : " ("+(delta === 0 ? "stable" : signe(delta)+" pts")+")")+". ";
  v += nbTraiter ? "<b>"+pl(nbTraiter, "point")+" à traiter</b> en revue"+
         (escalades.length ? ", dont "+escalades.length+" remonté"+(escalades.length>1?"s":"")+" automatiquement" : "")+". "
       : "Aucun point à traiter. ";
  v += absents.length ? '<span class="alerte">'+pl(absents.length, "domaine")+" sans saisie : "+esc(absents.join(", ")).toLowerCase()+".</span> "
       : "Tous les domaines ont rendu. ";
  if (remplissage < 90 && taux !== null)
    v += '<span class="alerte">Remplissage à '+remplissage+" % : la conformité ne porte que sur une partie des chiffres.</span>";

  const cnt = (cle, val, lab, sub, cls) => {
    const k = KPI_DETAIL[cle] || {};
    const actif = cle && ((k.lignes && k.lignes.length) || k.graphe);
    return '<button class="h-c '+(cls||"")+'"'+(actif ? ' onclick="voirKpi(\''+cle+'\')"' : ' disabled')+'>'+
      '<div class="v">'+val+'</div><div class="l">'+lab+'</div><div class="s">'+sub+'</div></button>';
  };
  $("cHero").innerHTML =
    '<div class="h-ring">'+anneau(taux, mesures.length || renseignes.length ? remplissage : null)+
      '<div class="h-leg">'+
        '<button onclick="voirKpi(\'conformes\')"><span><i style="background:#70BD95"></i>Conformité</span><b>'+(taux ?? "n.c.")+(taux === null ? "" : " %")+'</b></button>'+
        '<button onclick="voirKpi(\'manquants\')"><span><i style="background:#8FB9D6"></i>Remplissage</span><b>'+remplissage+' %</b></button>'+
      '</div></div>'+
    '<div class="h-main"><div class="h-tag">'+esc(VUE.ag)+" · "+esc(libPeriode(VUE.pe, VUE.ca))+" · "+esc(String(VUE.ca).toLowerCase())+'</div>'+
      '<div class="h-verdict">'+v+'</div>'+
      '<div class="h-cnt">'+
        cnt("horscible", rou.length, "Hors cible", lim.length ? pl(lim.length, "en limite", "en limite") : "aucun en limite", rou.length ? "rou" : "ok")+
        cnt("traiter", nbTraiter, "À traiter", escalades.length ? remontes.length+" signalé"+(remontes.length>1?"s":"")+", "+escalades.length+" auto" : "signalés en saisie", nbTraiter ? "rou" : "ok")+
        cnt(tendances ? "derives" : null, tendances, "Dérives", tendances ? "encore dans la cible" : "aucune détectée", tendances ? "lim" : "ok")+
        cnt("manquants", domsRendus+"/"+domsTot, "Domaines rendus", renseignes.length+" / "+attendus+" indicateurs", domsRendus < domsTot ? "lim" : "ok")+
      '</div></div>'+
    '<div class="h-trend"><button onclick="voirKpi(\'conformes\')" title="Voir l\'évolution">'+courbeHero()+'</button></div>';
  requestAnimationFrame(() => requestAnimationFrame(() =>
    document.querySelectorAll("#cHero .arc").forEach(c => c.style.strokeDashoffset = c.dataset.off)));

  rendreAlertes(alertes);
  rendreCarte(perimetre);
  rendreMouvements(d);
  rendreAgences();
}
/* Alertes : une ligne par indicateur ou par domaine, motifs regroupes. */
function calculerAlertes(d, absents){
  const out = [], vu = {};
  const prec = decaler(VUE.pe, VUE.ca, -1);
  const avant = {}; lignesPeriode(prec).forEach(r => avant[r.code] = r);
  const ajouter = (r, g, type, motif) => {
    if (vu[r.code]){ vu[r.code].motifs.push(motif); vu[r.code].g = Math.min(vu[r.code].g, g); return; }
    const a = {r, g, type, motifs:[motif]}; vu[r.code] = a; out.push(a);
  };
  d.forEach(r => {
    const s = serie(r.code);
    let k = 0; for (let j = s.length-1; j >= 0 && s[j].statut === "ROUGE"; j--) k++;
    if (r.statut === "ROUGE" && k >= N_ESCALADE) ajouter(r, 1, "escalade", "hors cible sur les "+k+" dernières saisies");
    if (r.remontee) ajouter(r, 1, "signale", "signalé par "+(r.responsable || "le responsable"));
    if (r.statut === "ROUGE" && avant[r.code] && ["OK","LIMITE"].includes(avant[r.code].statut))
      ajouter(r, 1, "nouveau", "nouvel écart, "+LIB_STATUT[avant[r.code].statut]+" la période précédente");
    else if (r.statut === "ROUGE" && k < N_ESCALADE && !r.remontee) ajouter(r, 2, "rouge", "hors cible");
    /* Derive : trois mouvements de suite dans le mauvais sens, cible encore tenue. */
    if (["OK","LIMITE"].includes(r.statut) && r.cible !== null && r.cible !== undefined){
      const v = s.slice(-4).map(x => x.valeur);
      if (v.length === 4 && v.every(x => x !== null) &&
          [1,2,3].every(i => r.sens === "≥" ? v[i] < v[i-1] : v[i] > v[i-1]))
        ajouter(r, 2, "derive", "se dégrade depuis 3 périodes ("+v.join(" → ")+"), cible "+r.sens+" "+r.cible);
    }
  });
  absents.forEach(n => out.push({dom:n, g:1, type:"absent", motifs:["aucune saisie reçue sur la période"]}));
  const ndDom = {};
  d.filter(r => r.statut === "ND").forEach(r => ndDom[r.domaine] = (ndDom[r.domaine] || 0) + 1);
  Object.entries(ndDom).forEach(([n, c]) => out.push({dom:n, g:3, type:"nd", motifs:[pl(c, "indicateur non renseigné", "indicateurs non renseignés")]}));
  return out.sort((a,b) => a.g - b.g);
}
const LIB_ALERTE = {escalade:"Écart installé", signale:"Signalé", nouveau:"Nouvel écart", rouge:"Hors cible",
                    derive:"Dérive", absent:"Domaine absent", nd:"Trous de saisie"};
function rendreAlertes(al){
  const MAX = 9;
  if (!al.length){ $("cAlertes").innerHTML = '<div class="empty">Aucune alerte sur cette période.</div>'; return; }
  const ligne = a => {
    const titre = a.r ? esc(a.r.libelle)+' <span class="x">· '+esc(a.r.domaine)+(a.r.valeur !== null ? " · "+a.r.valeur+" pour "+a.r.sens+" "+(a.r.cible ?? "?") : "")+'</span>' : esc(a.dom);
    const k = a.motifs.length > 1 && a.r && a.r.remontee ? "Signalé" : LIB_ALERTE[a.type];
    const inner = '<i></i><div><div class="k">'+k+'</div><div>'+titre+'</div><div class="x">'+esc(a.motifs.join(" · "))+'</div></div>';
    if (a.r) return '<button class="g'+a.g+'" onclick="voirIndicateur(\''+esc(a.r.code)+'\')">'+inner+'<span class="chev">›</span></button>';
    if (a.type === "nd") return '<button class="g'+a.g+'" onclick="voirDomaine('+JSON.stringify(a.dom).replace(/"/g,"&quot;")+')">'+inner+'<span class="chev">›</span></button>';
    return '<div class="it g'+a.g+'">'+inner+'<span></span></div>';
  };
  $("cAlertes").innerHTML = al.slice(0, MAX).map(ligne).join("")+
    (al.length > MAX ? '<details><summary class="x" style="cursor:pointer;margin-top:4px">'+pl(al.length-MAX, "autre alerte", "autres alertes")+'</summary><div class="al" style="margin-top:7px">'+
      al.slice(MAX).map(ligne).join("")+'</div></details>' : "");
}
function etatDomaine(rows){
  if (!rows.length) return "ABS";
  if (rows.some(r => r.statut === "ROUGE")) return "ROUGE";
  if (rows.some(r => r.statut === "LIMITE")) return "LIMITE";
  if (rows.some(r => r.statut === "OK")) return "OK";
  return rows.some(r => r.valeur !== null && r.valeur !== undefined) ? "CIBLE" : "ND";
}
const SYMB = {OK:"✓", LIMITE:"!", ROUGE:"✕", CIBLE:"·", ND:"?", ABS:""};
function rendreCarte(perimetre){
  const ps = periodesContinues(N_GRAPHE);
  const par = {}; ps.forEach(p => par[p] = lignesPeriode(p));
  let h = '<div></div>'+ps.map(p => '<div class="ph'+(p === VUE.pe ? " cur" : "")+'">'+esc(libCourt(p, VUE.ca))+'</div>').join("");
  perimetre.forEach(dd => {
    h += '<div class="hdn" title="'+esc(dd.nom)+'">'+esc(dd.nom)+'</div>';
    ps.forEach(p => {
      const rows = par[p].filter(r => r.domaine === dd.nom), st = etatDomaine(rows);
      const nOk = rows.filter(r => r.statut === "OK").length, nM = rows.filter(r => ["OK","LIMITE","ROUGE"].includes(r.statut)).length;
      const tip = dd.nom+" · "+libPeriode(p, VUE.ca)+" : "+(st === "ABS" ? "aucun fichier"
        : nOk+" conforme"+(nOk>1?"s":"")+" sur "+nM+" mesuré"+(nM>1?"s":"")+
          (rows.filter(r => r.statut === "ROUGE").length ? ", "+rows.filter(r => r.statut === "ROUGE").map(r => r.libelle).join(", ")+" hors cible" : ""));
      h += '<button class="s-'+st+(p === VUE.pe ? " cur" : "")+'" title="'+esc(tip)+'" aria-label="'+esc(tip)+'"'+
        (st === "ABS" ? " disabled" : ' onclick="ouvrirCase('+JSON.stringify([p, dd.nom]).replace(/"/g,"&quot;")+')"')+'>'+SYMB[st]+'</button>';
    });
  });
  $("cCarte").style.gridTemplateColumns = "minmax(110px,150px) repeat("+ps.length+", minmax(30px,1fr))";
  $("cCarte").innerHTML = h;
  const w = $("cCarte").parentNode; w.scrollLeft = w.scrollWidth;
}
function ouvrirCase(c){
  VUE.pe = c[0]; majFiltresCockpit(); rendreCockpit(); voirDomaine(c[1]);
}
function rendreMouvements(d){
  const prec = decaler(VUE.pe, VUE.ca, -1);
  const avant = {}; lignesPeriode(prec).forEach(r => avant[r.code] = r);
  $("cMouvSous").textContent = "Changements de statut entre "+libCourt(prec, VUE.ca)+" et "+libCourt(VUE.pe, VUE.ca)+".";
  if (!Object.keys(avant).length){ $("cMouv").innerHTML = '<div class="empty">Pas de saisie sur la période précédente : comparaison impossible.</div>'; return; }
  const rang = {ROUGE:0, LIMITE:1, OK:2};
  const deg = [], amel = [];
  d.forEach(r => { const a = avant[r.code];
    if (!a || !(r.statut in rang) || !(a.statut in rang) || rang[r.statut] === rang[a.statut]) return;
    (rang[r.statut] < rang[a.statut] ? deg : amel).push({r, a}); });
  const it = ({r,a}) => '<button class="it" onclick="voirIndicateur(\''+esc(r.code)+'\')">'+esc(r.libelle)+
    '<small>'+esc(r.domaine)+" · "+a.valeur+" → "+r.valeur+" · "+LIB_STATUT[a.statut]+" → "+LIB_STATUT[r.statut]+'</small></button>';
  $("cMouv").innerHTML = '<div class="mv"><div><h3 style="color:var(--rou)">▼ Se dégrade ('+deg.length+')</h3>'+
    (deg.length ? deg.map(it).join("") : '<div class="hint">Rien.</div>')+'</div>'+
    '<div><h3 style="color:var(--ok)">▲ S\'améliore ('+amel.length+')</h3>'+
    (amel.length ? amel.map(it).join("") : '<div class="hint">Rien.</div>')+'</div></div>';
}
function rendreAgences(){
  const ags = uniq(SAISIES.filter(r => visible(r) && r.cadence === VUE.ca).map(r => r.agence)).sort();
  $("cAgWrap").classList.toggle("hide", ags.length < 2);
  if (ags.length < 2) return;
  $("cAgSous").textContent = libPeriode(VUE.pe, VUE.ca)+", même périmètre de domaines pour toutes. Cliquer une agence pour l'afficher.";
  $("cAgs").innerHTML = ags.map(ag => {
    const s = statsAg(ag, VUE.pe);
    const b = (v, col) => '<div class="bar"><s style="width:'+(v ?? 0)+'%;background:'+col+'"></s></div>';
    return '<button class="ag'+(ag === VUE.ag ? " on" : "")+'" onclick="allerVers('+JSON.stringify([ag, VUE.ca, VUE.pe]).replace(/"/g,"&quot;")+')">'+
      '<span class="n">'+esc(ag)+(s.n ? "" : '<br><small class="gr">pas de saisie</small>')+'</span>'+
      b(s.taux, "var(--bd)")+'<span class="val">'+(s.taux === null ? "n.c." : s.taux+" %")+'</span>'+
      b(s.rempl, "var(--ac)")+'<span class="val">'+(s.n ? s.rempl+" %" : "n.c.")+'</span></button>';
  }).join("");
}

/* ---------- graphes d'evolution ---------- */
const MOIS_C = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
function libCourt(p, cad){
  if (cad === "Hebdo") return "S"+String(numSemaine(p).s).padStart(2,"0");
  const [y,m] = p.split("-");
  return MOIS_C[+m-1]+(+m === 1 ? " "+y.slice(2) : "");
}
function decaler(p, cad, k){
  const d = new Date(p+"T00:00:00Z");
  if (cad === "Mensuel") d.setUTCMonth(d.getUTCMonth() + k); else d.setUTCDate(d.getUTCDate() + 7*k);
  return d.toISOString().slice(0,10);
}
/* Suite continue de periodes jusqu'a la periode affichee : une semaine
   sans aucun fichier apparait comme un trou, elle n'est pas sautee. */
function periodesContinues(n){
  const connues = uniq(SAISIES.filter(r => visible(r) && r.agence === VUE.ag && r.cadence === VUE.ca && r.periode <= VUE.pe)
                             .map(r => r.periode)).sort();
  if (!connues.length) return [];
  const out = [];
  for (let k = n-1; k >= 0; k--){ const p = decaler(VUE.pe, VUE.ca, -k); if (p >= connues[0]) out.push(p); }
  return out;
}
const COUL = {OK:"var(--ok)", LIMITE:"var(--lim)", ROUGE:"var(--rou)", CIBLE:"#6C8EA4", ND:"var(--nd)", PCT:"var(--bd)"};
function pasJoli(max){
  const brut = max/4, e = Math.pow(10, Math.floor(Math.log10(brut || 1)));
  const f = brut/e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
}
function graphe(o){
  const W = 760, H = 290, L = 46, R = 18, T = 22, B = 40;
  const pts = o.pts, n = pts.length;
  const vals = pts.map(x => x.v).filter(v => v !== null && v !== undefined);
  let yMax = o.pct ? 100 : Math.max(1, ...vals, o.cible ?? 0);
  const pas = o.pct ? 25 : pasJoli(yMax * 1.15);
  if (!o.pct) yMax = Math.ceil((yMax * 1.15) / pas) * pas;
  const X = i => n === 1 ? L + (W-L-R)/2 : L + i*(W-L-R)/(n-1);
  const Y = v => T + (H-T-B) * (1 - v/yMax);
  let g = '<svg class="graphe" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="évolution">';
  // zone hors cible, legerement teintee
  if (o.cible !== null && o.cible !== undefined){
    const yc = Y(o.cible);
    g += o.sens === "≥"
      ? '<rect x="'+L+'" y="'+yc+'" width="'+(W-L-R)+'" height="'+(H-B-yc)+'" fill="var(--rou)" opacity=".06"/>'
      : '<rect x="'+L+'" y="'+T+'" width="'+(W-L-R)+'" height="'+(yc-T)+'" fill="var(--rou)" opacity=".06"/>';
  }
  for (let v = 0; v <= yMax + 1e-9; v += pas){
    const y = Y(v);
    g += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" stroke="var(--hl)" stroke-width="1"/>'+
         '<text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="var(--mut)">'+
         (Math.round(v*100)/100)+(o.pct ? " %" : "")+'</text>';
  }
  if (o.cible !== null && o.cible !== undefined){
    const yc = Y(o.cible);
    g += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yc+'" y2="'+yc+'" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="6 5"/>'+
         '<text x="'+(W-R)+'" y="'+(yc-7)+'" text-anchor="end" font-size="11.5" font-weight="600" fill="var(--ink)">cible '+
         esc(o.sens || "")+" "+o.cible+'</text>';
  }
  // segments entre periodes renseignees consecutives
  let seg = [];
  const tracer = () => { if (seg.length > 1) g += '<polyline points="'+seg.join(" ")+'" fill="none" stroke="var(--bd)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'; seg = []; };
  pts.forEach((p,i) => { if (p.v === null || p.v === undefined) tracer(); else seg.push(X(i).toFixed(1)+","+Y(p.v).toFixed(1)); });
  tracer();
  const pasLab = n > 14 ? 2 : 1;
  pts.forEach((p,i) => {
    const x = X(i);
    if (i % pasLab === 0 || i === n-1)
      g += '<text x="'+x+'" y="'+(H-B+18)+'" text-anchor="middle" font-size="11" fill="var(--mut)"'+
           (i === n-1 ? ' font-weight="700"' : '')+'>'+esc(p.lab)+'</text>';
    if (p.v === null || p.v === undefined){
      g += '<text x="'+x+'" y="'+(H-B-6)+'" text-anchor="middle" font-size="10.5" fill="var(--mut2)">n.c.</text>';
      return;
    }
    const y = Y(p.v), col = COUL[p.st] || "var(--bd)";
    g += '<circle cx="'+x+'" cy="'+y+'" r="'+(i === n-1 ? 6.5 : 5)+'" fill="'+col+'" stroke="#fff" stroke-width="2">'+
         '<title>'+esc(p.lab+" : "+p.v+(o.pct ? " %" : ""))+'</title></circle>'+
         '<text x="'+x+'" y="'+(y-11)+'" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--ink)">'+
         (Math.round(p.v*100)/100)+(o.pct ? "%" : "")+'</text>';
  });
  return g + "</svg>";
}
function lecturePct(pts, quoi){
  const v = pts.filter(p => p.v !== null && p.v !== undefined);
  const nom = quoi === "conformite" ? "Taux de conformité" : "Taux de remplissage";
  const trous = pts.filter(p => p.v === null).length;
  if (!v.length) return "Aucune donnée sur la période affichée.";
  if (v.length < 2) return "<b>"+nom+" : "+v[0].v+" %.</b> Une seule période chargée, pas encore de tendance.";
  const der = v[v.length-1], prec = v[v.length-2], prem = v[0];
  const d = der.v - prec.v, dt = der.v - prem.v;
  return "<b>"+nom+" : "+der.v+" %</b> sur "+der.lab+", "+
    (d === 0 ? "stable" : (d > 0 ? "+" : "")+d+" pts")+" par rapport à "+prec.lab+", "+
    (dt === 0 ? "identique" : (dt > 0 ? "+" : "")+dt+" pts")+" depuis "+prem.lab+"."+
    (trous ? " "+trous+" période"+(trous>1?"s":"")+" sans aucune saisie." : "");
}
function voirIndicateur(code){
  const i = indParCode(code); if (!i) return;
  const ps = periodesContinues(N_GRAPHE);
  const lignes = ps.map(p => SAISIES.find(r => visible(r) && r.agence === VUE.ag && r.cadence === VUE.ca &&
                                               r.periode === p && r.code === code));
  const cible = cibleDe(i, VUE.ca);
  const pts = ps.map((p,k) => ({p, lab:libCourt(p, VUE.ca), v: lignes[k] ? lignes[k].valeur : null,
                                st: lignes[k] ? lignes[k].statut : "ND"}));
  $("mTitre").textContent = i.libelle;
  $("mSous").textContent = i.domaine+" · "+VUE.ag+" · cadence "+String(VUE.ca).toLowerCase()+" · "+
    (cible === null || cible === undefined ? "cible à définir" : "cible "+i.sens+" "+cible+" "+(i.unite || ""));
  // lecture : derniere valeur, ecart, serie hors cible
  const conn = pts.filter(p => p.v !== null);
  let lec = "";
  if (!conn.length) lec = "Aucune valeur renseignée sur la période affichée.";
  else {
    const der = conn[conn.length-1];
    lec = "<b>Dernière valeur : "+der.v+" "+esc(i.unite || "")+"</b> ("+der.lab+", "+LIB_STATUT[der.st]+").";
    if (conn.length > 1){
      const pr = conn[conn.length-2], x = Math.round((der.v - pr.v)*100)/100;
      lec += " "+(x === 0 ? "Stable" : (x > 0 ? "+" : "")+x)+" par rapport à "+pr.lab+".";
    }
    const sr = serie(code);
    let k = 0; for (let j = sr.length-1; j >= 0 && sr[j].statut === "ROUGE"; j--) k++;
    if (k >= 2) lec += " <b style='color:var(--rou)'>Hors cible sur les "+k+" dernières saisies"+
                       (k >= N_ESCALADE ? ", seuil de remontée automatique atteint" : "")+".</b>";
    const nc = pts.filter(p => p.v === null).length;
    if (nc) lec += " "+nc+" période"+(nc>1?"s":"")+" non renseignée"+(nc>1?"s":"")+".";
    if (cible === null || cible === undefined) lec += " Sans cible, l'indicateur est suivi mais n'entre dans aucun calcul.";
  }
  const leg = '<div class="legende"><span><i style="background:var(--ok)"></i>conforme</span>'+
    '<span><i style="background:var(--lim)"></i>limite</span><span><i style="background:var(--rou)"></i>hors cible</span>'+
    '<span><i style="background:#6C8EA4"></i>sans cible</span>'+
    (cible !== null && cible !== undefined ? '<span>zone teintée : hors cible</span>' : '')+'</div>';
  const hist = ps.map((p,k) => ({p, r:lignes[k]})).reverse();
  $("mCorps").innerHTML = graphe({pts, cible, sens:i.sens}) + leg +
    '<div class="lecture">'+lec+'</div>'+
    tab(["Période","Valeur","Statut","Responsable","Commentaire"], hist.map(({p,r}) => [
      esc(libPeriode(p, VUE.ca)),
      {c:"num", h: r && r.valeur !== null ? r.valeur : '<span class="gr">n.c.</span>'},
      r ? pill(r.statut) : '<span class="gr">aucun fichier</span>',
      esc(r ? r.responsable || "" : ""), esc(r ? r.commentaire || "" : "")]));
  $("modal").classList.remove("hide");
}
function fermerModal(){ $("modal").classList.add("hide"); }

function rendreControles(d){
  const trous = uniq(d.filter(r => r.statut === "ND").map(r => r.domaine));
  const absents = perimetreDomaines().map(x => x.nom).filter(n => !uniq(d.map(r => r.domaine)).includes(n));
  const ailleurs = SAISIES.filter(r => visible(r) && (r.agence !== VUE.ag || r.cadence !== VUE.ca));
  const hors = ailleurs.length;
  const graves = ANOMALIES.filter(a => a.type === "statut" || a.type === "signature");
  let m = "";
  if (graves.length)
    m += '<div class="msg e"><b>Contrôle de cohérence.</b> '+graves.length+
      " écart"+(graves.length>1?"s":"")+" entre ce qui est déclaré dans les fichiers et ce que le référentiel donne. "+
      '<button class="lien" onclick="voirAnomalies()">Voir le détail</button></div>';
  else if (ANOMALIES.length)
    m += '<div class="msg w"><b>Contrôle de cohérence.</b> '+ANOMALIES.length+
      " point"+(ANOMALIES.length>1?"s":"")+" à vérifier sur les fichiers chargés. "+
      '<button class="lien" onclick="voirAnomalies()">Voir le détail</button></div>';
  if (hors > 0){
    const vues = new Map();
    ailleurs.forEach(r => vues.set([r.agence,r.cadence].join("|"), r));
    const liste = [...vues.values()].sort((a,b) => a.periode < b.periode ? 1 : -1);
    m += '<div class="msg i"><b>'+hors+" enregistrement"+(hors>1?"s":"")+" hors de la vue.</b> "+
      "Ils sont chargés, mais rattachés à une autre agence ou à une autre cadence. "+
      liste.slice(0,5).map(r => '<button class="lien" onclick="allerVers('+
        JSON.stringify([r.agence,r.cadence,r.periode]).replace(/"/g,"&quot;")+')">'+
        esc(r.agence+" · cadence "+String(r.cadence).toLowerCase())+
        "</button>").join(" &nbsp;· ")+
      (liste.length > 5 ? " et "+(liste.length-5)+" autres." : "")+"</div>";
  }
  if (absents.length) m += '<div class="msg e"><b>Domaines sans saisie sur cette période.</b> '+
    esc(absents.join(", "))+". Ils n'entrent dans aucun calcul affiché ici.</div>";
  if (trous.length) m += '<div class="msg w"><b>Indicateurs non renseignés.</b> '+
    esc(trous.join(", "))+". Le taux de conformité ne porte que sur les indicateurs mesurés.</div>";
  if (SOURCES.doublons) m += '<div class="msg w"><b>Doublons écartés.</b> '+SOURCES.doublons+
    " enregistrement"+(SOURCES.doublons>1?"s":"")+" en double sur la même période. La version chargée en dernier a été retenue.</div>";
  $("cMsg").innerHTML = m;
}
function allerVers(cle){
  VUE.ag = cle[0]; VUE.ca = cle[1]; VUE.pe = cle[2];
  fermerModal();
  majFiltresCockpit(); rendreCockpit(); window.scrollTo(0,0);
}
function voirAnomalies(){
  const L = {inconnu:"Code inconnu", cible:"Cible divergente", cadence:"Mauvaise cadence",
             multiple:"Saisie en double",
             statut:"Statut recalculé différent", signature:"Fichier modifié après enregistrement"};
  $("mTitre").textContent = "Contrôles de cohérence";
  $("mSous").textContent = ANOMALIES.length+" point"+(ANOMALIES.length>1?"s":"")+
    " relevé"+(ANOMALIES.length>1?"s":"")+" au chargement";
  $("mCorps").innerHTML =
    '<p class="hint">Le cockpit ne reprend jamais le statut inscrit dans un fichier : il le recalcule avec la cible du référentiel. Les écarts ci-dessous opposent ce que dit le fichier à ce que donne le calcul.</p>'+
    tab(["Nature","Fichier","Constat"], ANOMALIES.map(a => [
      '<span class="'+(a.type === "statut" || a.type === "signature" ? "dn" : "gr")+'">'+L[a.type]+"</span>",
      esc(a.f), esc(a.txt)]));
  $("modal").classList.remove("hide");
}

function tab(entetes, lignes){
  return '<table><thead><tr>'+entetes.map(h =>
    '<th'+(/Valeur|Cible|Écart/.test(h) ? ' class="num"' : '')+'>'+esc(h)+'</th>').join("")+
    '</tr></thead><tbody>'+lignes.map(l => "<tr>"+l.map(c =>
      typeof c === "object" ? '<td class="'+(c.c||"")+'">'+c.h+"</td>" : "<td>"+c+"</td>").join("")+
    "</tr>").join("")+"</tbody></table>";
}
function voirDomaine(dom){
  const d = periode().filter(r => r.domaine === dom);
  if (!d.length) return;
  $("cHome").classList.add("hide"); $("cDet").classList.remove("hide");
  $("cMsg").classList.add("hide"); window.scrollTo(0,0);
  $("dTitre").textContent = dom;
  $("dSous").textContent = (uniq(d.map(r => r.responsable))[0] || respDomaine(dom) || "responsable non renseigné")+
    " · "+d.length+" indicateur"+(d.length>1?"s":"")+" · "+libPeriode(VUE.pe, VUE.ca)+
    ". Cliquer un indicateur ou sa courbe pour voir son évolution.";

  const prec = {};
  jusqua(dom).filter(r => r.periode < VUE.pe).forEach(r => {
    if (!prec[r.code] || r.periode > prec[r.code].periode) prec[r.code] = r;
  });
  $("dTable").innerHTML = tab(
    ["Indicateur","Valeur","Cible","Statut","Écart","Commentaire","Tendance"],
    d.sort((a,b) => ORDRE[a.statut]-ORDRE[b.statut]).map(r => {
      const p = prec[r.code];
      let e = '<span class="gr"></span>';
      if (r.valeur !== null && p && p.valeur !== null){
        const x = Math.round((r.valeur - p.valeur)*100)/100;
        e = x === 0 ? '<span class="gr">stable</span>'
          : '<span class="'+((r.sens === "≥" ? x>0 : x<0) ? "up" : "dn")+'">'+(x>0?"+":"")+x+"</span>";
      }
      const ecartCible = p && p.cible !== r.cible
        ? ' <span class="gr2" title="la cible a changé depuis la période précédente">·</span>' : "";
      return [lienInd(r),
        {c:"num", h: r.valeur ?? '<span class="gr">n.c.</span>'},
        {c:"num gr", h: (r.cible ?? "n.c.")+" "+esc(r.unite || "")+ecartCible},
        pill(r.statut), {c:"num", h:e}, esc(r.commentaire || ""),
        {c:"num", h: '<button class="spk" title="Voir l\'évolution" onclick="voirIndicateur(\''+esc(r.code)+'\')">'+
          (spark(r.code, dom) || '<span class="gr">voir</span>')+'</button>'}];
    }));

  const autos = autoDomaine(dom);
  $("dAutoWrap").classList.toggle("hide", !autos.length);
  if (autos.length) $("dAuto").innerHTML = '<table class="auto"><tbody>'+autos.map(a =>
    "<tr><td>"+esc(a.libelle)+"</td><td>"+esc(a.source)+"</td></tr>").join("")+"</tbody></table>";
}
function versAccueil(){
  $("cDet").classList.add("hide"); $("cHome").classList.remove("hide");
  $("cMsg").classList.remove("hide"); window.scrollTo(0,0);
}
function spark(code, dom){
  const s = jusqua(dom).filter(r => r.code === code && r.valeur !== null)
                       .sort((a,b) => a.periode < b.periode ? -1 : 1).slice(-N_TENDANCE);
  if (s.length < 2) return "";
  const v = s.map(r => r.valeur), mn = Math.min(...v), mx = Math.max(...v), ec = (mx-mn) || 1;
  const W = 84, H = 22;
  const pts = v.map((x,i) => (i*(W/(v.length-1))).toFixed(1)+","+(H-(x-mn)/ec*(H-4)-2).toFixed(1)).join(" ");
  const st = s[s.length-1].statut;
  const col = st === "ROUGE" ? "var(--rou)" : st === "LIMITE" ? "var(--lim)" : "var(--ok)";
  return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" aria-hidden="true">'+
    '<polyline points="'+pts+'" fill="none" stroke="'+col+'" stroke-width="1.8" '+
    'stroke-linejoin="round" stroke-linecap="round"/></svg>';
}
function exporterCockpit(){
  telecharger(JSON.stringify({format:"cockpit-consolide", version:1,
    genere:new Date().toISOString(), agence:VUE.ag, cadence:VUE.ca, periode:VUE.pe,
    sources:SOURCES.map(s => ({nom:s.nom, erreur:s.err, lignes:s.n})), donnees:SAISIES}, null, 1),
    "cockpit_"+String(VUE.ag).replace(/\W+/g,"_")+"_"+VUE.pe+".json", "application/json");
}
function reinit(){
  SOURCES = []; SAISIES = []; VUE = {};
  $("cHome").classList.add("hide"); $("cDet").classList.add("hide");
  $("cFilt").classList.add("hide"); $("cLoad").classList.remove("hide");
  $("cMsg").innerHTML = ""; $("cList").innerHTML = ""; $("cMini").textContent = "";
  $("cPick").value = ""; majEntete();
}

/* ================= RÉFÉRENTIEL ================= */
function rendreRef(){
  if ($("rContribDo") && !$("rContribDo").options.length){
    opt($("rContribDo"), postes(), "Manager");
    $("rContribDo").onchange = majContribs;
    $("rContribs").oninput = () => {
      if (!RESPONSABLE) return;
      REF.contributeurs = REF.contributeurs || {};
      REF.contributeurs[$("rContribDo").value] =
        $("rContribs").value.split("\n").map(x => x.trim()).filter(Boolean);
      sauverRef();
    };
  }
  majContribs();
  $("rVerrou").innerHTML = RESPONSABLE
    ? '<div class="msg i"><b>Mode responsable.</b> Les cibles, les noms d\'agence et le code d\'accès sont modifiables. Exporter le référentiel après modification pour le transmettre aux autres postes.</div>'
    : '<div class="msg w"><b>Lecture seule.</b> Les cibles ne sont modifiables qu\'en mode responsable. Utiliser le bouton en haut à droite.</div>';
  $("rBar").classList.toggle("hide", !RESPONSABLE);
  const doms = REF.domaines.map(d => d.nom);
  if (!$("rDo").options.length) opt($("rDo"), ["Tous", ...doms], "Tous");
  const sel = $("rDo").value || "Tous";
  const inds = sel === "Tous" ? REF.indicateurs : indDomaine(sel);
  $("rTable").innerHTML =
    "<table><thead><tr><th>Code</th><th>Poste</th><th>Domaine</th><th>Indicateur</th><th>Unité</th><th>Sens</th>"+
    '<th>Cadence</th><th class="num">Cible</th><th>Type</th><th>Agrégation</th></tr></thead><tbody>'+
    inds.map(i => {
      const k = REF.indicateurs.indexOf(i), champ = i.cadence === "Hebdo" ? "cibleH" : "cibleM";
      return "<tr><td>"+esc(i.code)+"</td><td>"+esc(i.poste || "")+"</td><td>"+esc(i.domaine)+"</td><td>"+esc(i.libelle)+"</td>"+
        "<td>"+esc(i.unite || "")+"</td><td>"+esc(i.sens)+"</td><td>"+esc(i.cadence || "")+"</td>"+
        '<td class="num"><input type="number" step="any" style="width:78px;text-align:right" value="'+
          (i[champ] ?? "")+'" oninput="majCible('+k+',\''+champ+'\',this.value)"'+
          (i.origineCible === "proposee" && !i.modifie ? ' title="cible proposée, à valider"' : "")+'></td>'+
        "<td class='gr'>"+esc(i.type)+"</td><td class='gr'>"+esc(i.agregation || "")+"</td></tr>";
    }).join("")+"</tbody></table>";

  $("rTable").classList.toggle("ro", !RESPONSABLE);
  $("rAgWrap").classList.toggle("ro", !RESPONSABLE);
  $("rContact").value = REF.contact || "";
  $("rAg").innerHTML = "<table><tbody>"+REF.agences.map((a,i) =>
    '<tr><td style="width:60px" class="gr">'+(i+1)+'</td><td><input type="text" style="width:340px" value="'+
    esc(a)+'" oninput="majAgence('+i+',this.value)"></td></tr>').join("")+"</tbody></table>";
}
$("rDo").addEventListener("change", rendreRef);
function majContribs(){
  if (!$("rContribDo")) return;
  $("rContribs").value = contribsDe($("rContribDo").value).join("\n");
  $("rContribs").disabled = !RESPONSABLE;
}
function majCible(i, champ, val){
  if (!RESPONSABLE) return;
  REF.indicateurs[i][champ] = val === "" ? null : Number(val);
  REF.indicateurs[i].modifie = true;
  sauverRef();
}
function majAgence(i, val){
  if (!RESPONSABLE) return;
  REF.agences[i] = val; sauverRef(); initSaisie();
}
function majContact(val){
  if (!RESPONSABLE) return;
  REF.contact = val; sauverRef(); rendrePied();
}
function changerCode(){
  if (!RESPONSABLE) return;
  const a = prompt("Nouveau code responsable.\nHuit caractères au moins, lettres et chiffres mélangés. Les tirets sont ignorés.");
  if (a === null) return;
  const n = normCode(a);
  if (n.length < 8 || !/[A-Z]/.test(n) || !/[0-9]/.test(n)){
    alert("Code refusé : huit caractères au moins, avec des lettres et des chiffres."); return; }
  const b = prompt("Confirmer le nouveau code :");
  if (b === null) return;
  if (normCode(b) !== n){ alert("Les deux saisies diffèrent. Code inchangé."); return; }
  REF.codeResponsable = empreinteCode(n); sauverRef();
  alert("Code modifié sur ce poste. Exporter le référentiel et le transmettre aux autres postes.");
}
function sauverRef(){ try{ localStorage.setItem("cockpit.referentiel", JSON.stringify(REF)); }catch(e){} }
/* Un referentiel enregistre par une version anterieure ne remplace jamais
   la structure du fichier (domaines, indicateurs, codes) : il n'apporte que
   les reglages locaux. Sans cela, un poste garde des indicateurs perimes. */
function fusionnerRef(o, importe){
  const base = JSON.parse(JSON.stringify(REF_DEFAUT));
  if (!o || typeof o !== "object") return base;
  if (Array.isArray(o.agences) && o.agences.length) base.agences = o.agences.map(String);
  if (o.contact) base.contact = String(o.contact);
  if (typeof o.codeResponsable === "string" && o.codeResponsable.startsWith("s2:")) base.codeResponsable = o.codeResponsable;
  if (o.contributeurs && typeof o.contributeurs === "object")
    Object.keys(base.contributeurs).forEach(k => {
      if (Array.isArray(o.contributeurs[k])) base.contributeurs[k] = o.contributeurs[k].map(String);
    });
  const num = v => v === null || v === "" || v === undefined ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
  if (Array.isArray(o.indicateurs))
    base.indicateurs.forEach(i => {
      const a = o.indicateurs.find(x => x && x.code === i.code);
      if (a && (importe || a.modifie)){ i.cibleH = num(a.cibleH); i.cibleM = num(a.cibleM); i.modifie = true; }
    });
  return base;
}
function chargerRef(){
  try{
    const r = localStorage.getItem("cockpit.referentiel");
    if (r){ REF = fusionnerRef(JSON.parse(r), false); sauverRef(); }
  }catch(e){ REF = JSON.parse(JSON.stringify(REF_DEFAUT)); }
}
function exporterRef(){
  telecharger(JSON.stringify(REF, null, 1), "referentiel_cockpit.json", "application/json");
}
$("rPick").addEventListener("change", async e => {
  const f = e.target.files[0]; if (!f || !RESPONSABLE) return;
  try{
    const o = JSON.parse(await f.text());
    if (!o.indicateurs || !o.domaines) throw new Error("structure inattendue");
    REF = fusionnerRef(o, true); sauverRef(); rendreRef(); initSaisie(); appliquerVerrou();
    alert("Référentiel importé : "+REF.indicateurs.length+" indicateurs.");
  }catch(err){ alert("Import impossible : "+err.message); }
  e.target.value = "";
});

/* ---------- depot de fichiers ---------- */
const dz = $("drop");
dz.addEventListener("click", () => $("cPick").click());
$("cPick").addEventListener("change", e => chargerFichiers([...e.target.files]));
["dragenter","dragover"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("on"); }));
["dragleave","drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("on"); }));
dz.addEventListener("drop", e => chargerFichiers([...e.dataTransfer.files]));

/* ---------- demarrage ---------- */
chargerRef(); chargerBrouillon(); chargerProfil();
if (PROFIL){
  BROUILLON.agence = PROFIL.agence;
  BROUILLON.poste = PROFIL.poste;
  BROUILLON.responsable = PROFIL.nom;
}
initSaisie(); majMode(); rendrePied();
if (routeDepuisAncre()) go(routeDepuisAncre(), true);
demanderProfil("c", false);
