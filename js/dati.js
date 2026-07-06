/*
 * dati.js — Parametri fiscali e previdenziali.
 * Tutti i valori sono riferiti all'anno d'imposta 2025 (lavoro dipendente).
 * Aggiornare qui ogni anno: scaglioni IRPEF, detrazioni, aliquote regionali.
 *
 * Fonti di riferimento:
 *  - IRPEF a 3 scaglioni: art. 11 TUIR (riforma 2024, confermata 2025)
 *  - Detrazioni da lavoro dipendente: art. 13 TUIR
 *  - Detrazione coniuge a carico: art. 12 TUIR
 *  - Bonus/ulteriore detrazione 2025: Legge di Bilancio 2025 (L. 207/2024)
 *  - Contributi INPS FPLD dipendente: 9,19% + 1% oltre la prima fascia
 */

const ANNO_IMPOSTA = 2025;

// --- Contributi previdenziali a carico del lavoratore (INPS) ---
const INPS = {
  aliquotaBase: 0.0919,          // 9,19%
  aliquotaAggiuntiva: 0.01,      // +1% sulla quota oltre la prima fascia
  primaFasciaAnnua: 55008        // massimale prima fascia 2025 (€/anno)
};

// --- Scaglioni IRPEF 2025 (imposta lorda) ---
const SCAGLIONI_IRPEF = [
  { fino: 28000, aliquota: 0.23 },
  { fino: 50000, aliquota: 0.35 },
  { fino: Infinity, aliquota: 0.43 }
];

// --- Addizionale comunale: gestita come RANGE (non chiediamo il Comune) ---
const ADDIZIONALE_COMUNALE = {
  min: 0.0,      // Comuni che non l'applicano
  tipica: 0.004, // 0,4% valore centrale indicativo
  max: 0.008     // 0,8% (tetto ordinario per la gran parte dei Comuni)
};

/*
 * Addizionale regionale IRPEF — aliquota indicativa per regione.
 * Molte regioni applicano aliquote progressive per scaglioni: qui usiamo
 * un valore rappresentativo per un reddito medio da lavoro dipendente.
 * È volutamente un'approssimazione (vedi disclaimer nell'app).
 */
const REGIONI = [
  { nome: "Abruzzo", aliquota: 0.0173 },
  { nome: "Basilicata", aliquota: 0.0123 },
  { nome: "Calabria", aliquota: 0.0173 },
  { nome: "Campania", aliquota: 0.0203 },
  { nome: "Emilia-Romagna", aliquota: 0.0177 },
  { nome: "Friuli-Venezia Giulia", aliquota: 0.0123 },
  { nome: "Lazio", aliquota: 0.0333 },
  { nome: "Liguria", aliquota: 0.0193 },
  { nome: "Lombardia", aliquota: 0.0158 },
  { nome: "Marche", aliquota: 0.0173 },
  { nome: "Molise", aliquota: 0.0223 },
  { nome: "Piemonte", aliquota: 0.0233 },
  { nome: "Puglia", aliquota: 0.0163 },
  { nome: "Sardegna", aliquota: 0.0123 },
  { nome: "Sicilia", aliquota: 0.0123 },
  { nome: "Toscana", aliquota: 0.0158 },
  { nome: "Trentino-Alto Adige", aliquota: 0.0123 },
  { nome: "Umbria", aliquota: 0.0163 },
  { nome: "Valle d'Aosta", aliquota: 0.0123 },
  { nome: "Veneto", aliquota: 0.0123 }
];

// Settimane retribuite in un anno (52). Usata per il netto orario.
const SETTIMANE_ANNO = 52;
