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

// --- Addizionale comunale: usata per il RANGE mostrato in output ---
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
 *
 * Ogni regione contiene l'elenco dei Comuni CAPOLUOGO di provincia con la
 * relativa aliquota di addizionale comunale IRPEF (in %). La gran parte dei
 * capoluoghi applica il tetto ordinario 0,80%; alcuni una quota inferiore.
 * Valori indicativi 2025 da verificare sul regolamento del singolo Comune.
 */
const REGIONI = [
  { nome: "Abruzzo", aliquota: 0.0173, comuni: [
    { nome: "L'Aquila", aliquota: 0.80 },
    { nome: "Chieti", aliquota: 0.80 },
    { nome: "Pescara", aliquota: 0.80 },
    { nome: "Teramo", aliquota: 0.80 }
  ] },
  { nome: "Basilicata", aliquota: 0.0123, comuni: [
    { nome: "Potenza", aliquota: 0.80 },
    { nome: "Matera", aliquota: 0.80 }
  ] },
  { nome: "Calabria", aliquota: 0.0173, comuni: [
    { nome: "Catanzaro", aliquota: 0.80 },
    { nome: "Cosenza", aliquota: 0.80 },
    { nome: "Crotone", aliquota: 0.80 },
    { nome: "Reggio Calabria", aliquota: 0.80 },
    { nome: "Vibo Valentia", aliquota: 0.80 }
  ] },
  { nome: "Campania", aliquota: 0.0203, comuni: [
    { nome: "Napoli", aliquota: 0.80 },
    { nome: "Avellino", aliquota: 0.80 },
    { nome: "Benevento", aliquota: 0.80 },
    { nome: "Caserta", aliquota: 0.80 },
    { nome: "Salerno", aliquota: 0.80 }
  ] },
  { nome: "Emilia-Romagna", aliquota: 0.0177, comuni: [
    { nome: "Bologna", aliquota: 0.80 },
    { nome: "Ferrara", aliquota: 0.80 },
    { nome: "Forlì", aliquota: 0.80 },
    { nome: "Cesena", aliquota: 0.60 },
    { nome: "Modena", aliquota: 0.80 },
    { nome: "Parma", aliquota: 0.80 },
    { nome: "Piacenza", aliquota: 0.80 },
    { nome: "Ravenna", aliquota: 0.70 },
    { nome: "Reggio Emilia", aliquota: 0.80 },
    { nome: "Rimini", aliquota: 0.80 }
  ] },
  { nome: "Friuli-Venezia Giulia", aliquota: 0.0123, comuni: [
    { nome: "Trieste", aliquota: 0.80 },
    { nome: "Gorizia", aliquota: 0.80 },
    { nome: "Pordenone", aliquota: 0.50 },
    { nome: "Udine", aliquota: 0.80 }
  ] },
  { nome: "Lazio", aliquota: 0.0333, comuni: [
    { nome: "Roma", aliquota: 0.90 },
    { nome: "Frosinone", aliquota: 0.80 },
    { nome: "Latina", aliquota: 0.80 },
    { nome: "Rieti", aliquota: 0.80 },
    { nome: "Viterbo", aliquota: 0.80 }
  ] },
  { nome: "Liguria", aliquota: 0.0193, comuni: [
    { nome: "Genova", aliquota: 0.80 },
    { nome: "Imperia", aliquota: 0.80 },
    { nome: "La Spezia", aliquota: 0.80 },
    { nome: "Savona", aliquota: 0.80 }
  ] },
  { nome: "Lombardia", aliquota: 0.0158, comuni: [
    { nome: "Milano", aliquota: 0.80 },
    { nome: "Bergamo", aliquota: 0.80 },
    { nome: "Brescia", aliquota: 0.80 },
    { nome: "Como", aliquota: 0.80 },
    { nome: "Cremona", aliquota: 0.80 },
    { nome: "Lecco", aliquota: 0.80 },
    { nome: "Lodi", aliquota: 0.80 },
    { nome: "Mantova", aliquota: 0.80 },
    { nome: "Monza", aliquota: 0.80 },
    { nome: "Pavia", aliquota: 0.80 },
    { nome: "Sondrio", aliquota: 0.70 },
    { nome: "Varese", aliquota: 0.80 }
  ] },
  { nome: "Marche", aliquota: 0.0173, comuni: [
    { nome: "Ancona", aliquota: 0.80 },
    { nome: "Ascoli Piceno", aliquota: 0.80 },
    { nome: "Fermo", aliquota: 0.80 },
    { nome: "Macerata", aliquota: 0.80 },
    { nome: "Pesaro", aliquota: 0.80 }
  ] },
  { nome: "Molise", aliquota: 0.0223, comuni: [
    { nome: "Campobasso", aliquota: 0.80 },
    { nome: "Isernia", aliquota: 0.80 }
  ] },
  { nome: "Piemonte", aliquota: 0.0233, comuni: [
    { nome: "Torino", aliquota: 0.80 },
    { nome: "Alessandria", aliquota: 0.80 },
    { nome: "Asti", aliquota: 0.80 },
    { nome: "Biella", aliquota: 0.80 },
    { nome: "Cuneo", aliquota: 0.50 },
    { nome: "Novara", aliquota: 0.80 },
    { nome: "Verbania", aliquota: 0.80 },
    { nome: "Vercelli", aliquota: 0.80 }
  ] },
  { nome: "Puglia", aliquota: 0.0163, comuni: [
    { nome: "Bari", aliquota: 0.80 },
    { nome: "Andria", aliquota: 0.80 },
    { nome: "Barletta", aliquota: 0.80 },
    { nome: "Brindisi", aliquota: 0.80 },
    { nome: "Foggia", aliquota: 0.80 },
    { nome: "Lecce", aliquota: 0.80 },
    { nome: "Taranto", aliquota: 0.80 },
    { nome: "Trani", aliquota: 0.80 }
  ] },
  { nome: "Sardegna", aliquota: 0.0123, comuni: [
    { nome: "Cagliari", aliquota: 0.80 },
    { nome: "Nuoro", aliquota: 0.80 },
    { nome: "Oristano", aliquota: 0.80 },
    { nome: "Sassari", aliquota: 0.80 }
  ] },
  { nome: "Sicilia", aliquota: 0.0123, comuni: [
    { nome: "Palermo", aliquota: 0.80 },
    { nome: "Agrigento", aliquota: 0.80 },
    { nome: "Caltanissetta", aliquota: 0.80 },
    { nome: "Catania", aliquota: 0.80 },
    { nome: "Enna", aliquota: 0.80 },
    { nome: "Messina", aliquota: 0.80 },
    { nome: "Ragusa", aliquota: 0.60 },
    { nome: "Siracusa", aliquota: 0.80 },
    { nome: "Trapani", aliquota: 0.80 }
  ] },
  { nome: "Toscana", aliquota: 0.0158, comuni: [
    { nome: "Firenze", aliquota: 0.20 },
    { nome: "Arezzo", aliquota: 0.80 },
    { nome: "Grosseto", aliquota: 0.80 },
    { nome: "Livorno", aliquota: 0.80 },
    { nome: "Lucca", aliquota: 0.80 },
    { nome: "Massa", aliquota: 0.80 },
    { nome: "Pisa", aliquota: 0.80 },
    { nome: "Pistoia", aliquota: 0.80 },
    { nome: "Prato", aliquota: 0.80 },
    { nome: "Siena", aliquota: 0.30 }
  ] },
  { nome: "Trentino-Alto Adige", aliquota: 0.0123, comuni: [
    { nome: "Trento", aliquota: 0.00 },
    { nome: "Bolzano", aliquota: 0.00 }
  ] },
  { nome: "Umbria", aliquota: 0.0163, comuni: [
    { nome: "Perugia", aliquota: 0.80 },
    { nome: "Terni", aliquota: 0.80 }
  ] },
  { nome: "Valle d'Aosta", aliquota: 0.0123, comuni: [
    { nome: "Aosta", aliquota: 0.00 }
  ] },
  { nome: "Veneto", aliquota: 0.0123, comuni: [
    { nome: "Venezia", aliquota: 0.80 },
    { nome: "Belluno", aliquota: 0.80 },
    { nome: "Padova", aliquota: 0.80 },
    { nome: "Rovigo", aliquota: 0.80 },
    { nome: "Treviso", aliquota: 0.80 },
    { nome: "Verona", aliquota: 0.80 },
    { nome: "Vicenza", aliquota: 0.80 }
  ] }
];

// Settimane retribuite in un anno (52). Usata per il netto orario.
const SETTIMANE_ANNO = 52;

/*
 * Contratti collettivi per la stima della RAL MINIMA da CCNL + livello.
 * "totaleMensile" = minimo tabellare + ex indennità di contingenza + EDR
 * (retribuzione minima mensile lorda a tempo pieno).
 * RAL minima full-time = totaleMensile × mensilita.
 * Dove nota, al livello è affiancata una breve descrizione del profilo.
 * ATTENZIONE: i minimi cambiano a ogni tranche. I valori qui sotto sono
 * indicativi (tabelle 2024/2025) e vanno verificati sulle tabelle ufficiali
 * del CCNL di riferimento.
 */
const CONTRATTI = [
  {
    nome: "Commercio – Terziario (Confcommercio)",
    oreFullTime: 40,
    mensilita: 14,
    aggiornato: "in vigore dal 1° novembre 2025",
    fonte: "Tabelle CCNL Terziario Confcommercio",
    livelli: [
      { nome: "Quadri", totaleMensile: 2984.21 },
      { nome: "1° livello — funzioni direttive/quadri operativi", totaleMensile: 2504.07 },
      { nome: "2° livello — impiegato di concetto / capo reparto", totaleMensile: 2233.60 },
      { nome: "3° livello — impiegato d'ordine specializzato / commesso specializzato", totaleMensile: 1981.84 },
      { nome: "4° livello — impiegato d'ordine / commesso", totaleMensile: 1781.68 },
      { nome: "5° livello — addetto qualificato alle vendite/magazzino", totaleMensile: 1658.01 },
      { nome: "6° livello — operaio/ausiliario qualificato", totaleMensile: 1539.70 },
      { nome: "7° livello — personale ausiliario / pulizie", totaleMensile: 1395.89 }
    ]
  },
  {
    nome: "Metalmeccanica Industria (Federmeccanica/Assistal)",
    oreFullTime: 40,
    mensilita: 13,
    aggiornato: "minimi indicativi giugno 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Metalmeccanici Industria",
    livelli: [
      { nome: "Quadri", totaleMensile: 2669.32 },
      { nome: "7° livello (A1) — funzioni direttive/tecnici laureati", totaleMensile: 2560.55 },
      { nome: "6° livello (B1) — impiegato/tecnico con autonomia", totaleMensile: 2317.68 },
      { nome: "5° livello Super (B2) — impiegato/operaio altamente specializzato", totaleMensile: 2170.03 },
      { nome: "5° livello (B3) — impiegato/operaio specializzato", totaleMensile: 2038.83 },
      { nome: "4° livello (C1) — operaio/impiegato qualificato con specializzazione", totaleMensile: 1905.68 },
      { nome: "3° livello (C2) — operaio qualificato", totaleMensile: 1821.75 },
      { nome: "2° livello (C3) — operaio comune / lavori di attesa", totaleMensile: 1699.83 },
      { nome: "1° livello (D2) — primo impiego / mansioni semplici", totaleMensile: 1588.72 }
    ]
  },
  {
    nome: "Metalmeccanica PMI (Confapi – Unionmeccanica)",
    oreFullTime: 40,
    mensilita: 13,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Unionmeccanica Confapi",
    livelli: [
      { nome: "Quadri", totaleMensile: 2560.00 },
      { nome: "7° livello — funzioni direttive/tecnici", totaleMensile: 2460.00 },
      { nome: "6° livello — impiegato/tecnico con autonomia", totaleMensile: 2230.00 },
      { nome: "5° livello — impiegato/operaio specializzato", totaleMensile: 1980.00 },
      { nome: "4° livello — operaio/impiegato qualificato", totaleMensile: 1855.00 },
      { nome: "3° livello — operaio qualificato", totaleMensile: 1760.00 },
      { nome: "2° livello — operaio comune", totaleMensile: 1650.00 },
      { nome: "1° livello — mansioni semplici", totaleMensile: 1545.00 }
    ]
  },
  {
    nome: "Studi Professionali (Confprofessioni)",
    oreFullTime: 40,
    mensilita: 14,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Studi Professionali",
    livelli: [
      { nome: "Quadri", totaleMensile: 2245.00 },
      { nome: "1° livello — coordinamento/elevata specializzazione", totaleMensile: 2010.00 },
      { nome: "2° livello — impiegato di concetto", totaleMensile: 1720.00 },
      { nome: "3° livello Super — impiegato con autonomia operativa", totaleMensile: 1620.00 },
      { nome: "3° livello — impiegato esecutivo", totaleMensile: 1520.00 },
      { nome: "4° livello Super — operatore qualificato", totaleMensile: 1420.00 },
      { nome: "4° livello — addetto d'ordine / segreteria", totaleMensile: 1360.00 }
    ]
  },
  {
    nome: "Turismo – Pubblici Esercizi (Fipe/Confcommercio)",
    oreFullTime: 40,
    mensilita: 14,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Turismo/Pubblici Esercizi",
    livelli: [
      { nome: "Quadri A", totaleMensile: 2360.00 },
      { nome: "Quadri B", totaleMensile: 2200.00 },
      { nome: "1° livello — capo servizio/responsabile", totaleMensile: 2050.00 },
      { nome: "2° livello — impiegato di concetto / chef", totaleMensile: 1880.00 },
      { nome: "3° livello — impiegato d'ordine / cuoco, cameriere qualificato", totaleMensile: 1720.00 },
      { nome: "4° livello — operatore qualificato / commis", totaleMensile: 1640.00 },
      { nome: "5° livello — operatore esecutivo", totaleMensile: 1570.00 },
      { nome: "6° livello Super — addetto con specifiche competenze", totaleMensile: 1500.00 },
      { nome: "6° livello — addetto / lavapiatti, facchino", totaleMensile: 1450.00 }
    ]
  },
  {
    nome: "Edilizia – Industria (ANCE)",
    oreFullTime: 40,
    mensilita: 13,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Edilizia Industria",
    livelli: [
      { nome: "7° livello — quadri/impiegati con funzioni direttive", totaleMensile: 2470.00 },
      { nome: "6° livello — impiegato di 1ª categoria / capo cantiere", totaleMensile: 2220.00 },
      { nome: "5° livello — impiegato tecnico / operaio di 4° liv.", totaleMensile: 1900.00 },
      { nome: "4° livello — operaio specializzato di 3° liv.", totaleMensile: 1770.00 },
      { nome: "3° livello — operaio qualificato di 2° liv.", totaleMensile: 1650.00 },
      { nome: "2° livello — operaio comune di 1° liv.", totaleMensile: 1520.00 },
      { nome: "1° livello — custode/guardiano", totaleMensile: 1370.00 }
    ]
  },
  {
    nome: "Chimico-Farmaceutico (Federchimica/Farmindustria)",
    oreFullTime: 40,
    mensilita: 13,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Chimico-Farmaceutico",
    livelli: [
      { nome: "Quadri", totaleMensile: 3050.00 },
      { nome: "Categoria A (A1) — funzioni direttive/specialistiche elevate", totaleMensile: 2760.00 },
      { nome: "Categoria B (B1) — tecnico/impiegato con ampia autonomia", totaleMensile: 2470.00 },
      { nome: "Categoria C (C1) — impiegato/operaio altamente specializzato", totaleMensile: 2200.00 },
      { nome: "Categoria D (D1) — operaio/impiegato specializzato", totaleMensile: 1980.00 },
      { nome: "Categoria E (E1) — operaio qualificato", totaleMensile: 1830.00 },
      { nome: "Categoria F (F1) — operaio comune / mansioni semplici", totaleMensile: 1710.00 }
    ]
  },
  {
    nome: "Trasporti, Logistica e Spedizione merci",
    oreFullTime: 39,
    mensilita: 14,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Logistica, Trasporto e Spedizione",
    livelli: [
      { nome: "Quadri", totaleMensile: 2560.00 },
      { nome: "1° livello — funzioni direttive/coordinamento", totaleMensile: 2280.00 },
      { nome: "2° livello — impiegato di concetto / capo reparto", totaleMensile: 2080.00 },
      { nome: "3° livello Super — autista con patente CE+CQC / impiegato specializzato", totaleMensile: 1920.00 },
      { nome: "3° livello — autista / operaio specializzato", totaleMensile: 1830.00 },
      { nome: "4° livello — operaio qualificato / mulettista", totaleMensile: 1730.00 },
      { nome: "5° livello — operaio comune / magazziniere", totaleMensile: 1650.00 },
      { nome: "6° livello — addetto / mansioni semplici", totaleMensile: 1560.00 }
    ]
  },
  {
    nome: "Alimentari – Industria",
    oreFullTime: 40,
    mensilita: 13,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Industria Alimentare",
    livelli: [
      { nome: "Quadri", totaleMensile: 2760.00 },
      { nome: "1° livello — funzioni direttive/specialistiche", totaleMensile: 2540.00 },
      { nome: "2° livello — impiegato di concetto / tecnico", totaleMensile: 2270.00 },
      { nome: "3°A livello — impiegato/operaio altamente specializzato", totaleMensile: 2080.00 },
      { nome: "3° livello — operaio specializzato", totaleMensile: 1970.00 },
      { nome: "4° livello — operaio qualificato", totaleMensile: 1850.00 },
      { nome: "5° livello — operaio comune", totaleMensile: 1740.00 },
      { nome: "6° livello — mansioni semplici / avviamento", totaleMensile: 1630.00 }
    ]
  },
  {
    nome: "Tessile, Abbigliamento e Moda – Industria",
    oreFullTime: 40,
    mensilita: 13,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Tessile-Abbigliamento-Moda",
    livelli: [
      { nome: "8° livello — quadri/funzioni direttive", totaleMensile: 2560.00 },
      { nome: "7° livello — impiegato di concetto elevato / tecnico", totaleMensile: 2270.00 },
      { nome: "6° livello — impiegato/operaio altamente specializzato", totaleMensile: 2050.00 },
      { nome: "5° livello — impiegato/operaio specializzato", totaleMensile: 1880.00 },
      { nome: "4° livello — operaio qualificato", totaleMensile: 1750.00 },
      { nome: "3° livello — operaio comune", totaleMensile: 1650.00 },
      { nome: "2° livello — addetto / mansioni semplici", totaleMensile: 1560.00 },
      { nome: "1° livello — avviamento al lavoro", totaleMensile: 1470.00 }
    ]
  },
  {
    nome: "Credito – Banche (ABI)",
    oreFullTime: 37.5,
    mensilita: 13,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL ABI Credito",
    livelli: [
      { nome: "Quadro Direttivo 4° livello", totaleMensile: 3760.00 },
      { nome: "Quadro Direttivo 3° livello", totaleMensile: 3350.00 },
      { nome: "Quadro Direttivo 2° livello", totaleMensile: 3080.00 },
      { nome: "Quadro Direttivo 1° livello", totaleMensile: 2900.00 },
      { nome: "3ª Area professionale 4° livello — impiegato senior", totaleMensile: 2560.00 },
      { nome: "3ª Area professionale 3° livello — impiegato", totaleMensile: 2380.00 },
      { nome: "3ª Area professionale 2° livello — impiegato junior", totaleMensile: 2260.00 },
      { nome: "3ª Area professionale 1° livello — impiegato di base", totaleMensile: 2150.00 },
      { nome: "2ª Area professionale — commesso/ausiliario", totaleMensile: 1950.00 }
    ]
  },
  {
    nome: "Lavoro Domestico (Colf e Badanti)",
    oreFullTime: 40,
    mensilita: 13,
    aggiornato: "minimi indicativi 2025 — retribuzioni Vademecum in vigore da gennaio",
    fonte: "Tabelle retributive CCNL Lavoro Domestico",
    livelli: [
      { nome: "Livello D Super — assistente familiare formato con incarichi di responsabilità", totaleMensile: 1500.00 },
      { nome: "Livello D — assistente a persona non autosufficiente (con formazione)", totaleMensile: 1350.00 },
      { nome: "Livello C Super — badante a persona non autosufficiente", totaleMensile: 1250.00 },
      { nome: "Livello C — collaboratore generico polifunzionale", totaleMensile: 1150.00 },
      { nome: "Livello B Super — assistente a persona autosufficiente", totaleMensile: 1080.00 },
      { nome: "Livello B — collaboratore generico (colf)", totaleMensile: 1020.00 },
      { nome: "Livello A Super — addetto a mansioni di compagnia", totaleMensile: 960.00 },
      { nome: "Livello A — addetto alle pulizie / mansioni semplici", totaleMensile: 900.00 }
    ]
  },
  {
    nome: "Cooperative Sociali",
    oreFullTime: 38,
    mensilita: 13,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Cooperative Sociali",
    livelli: [
      { nome: "F1 — funzioni direttive / coordinamento di area", totaleMensile: 2180.00 },
      { nome: "E2 — coordinatore di unità operativa", totaleMensile: 1980.00 },
      { nome: "E1 — educatore professionale / infermiere", totaleMensile: 1820.00 },
      { nome: "D3 — operatore socio-sanitario (OSS) con coordinamento", totaleMensile: 1720.00 },
      { nome: "D2 — operatore socio-sanitario (OSS)", totaleMensile: 1620.00 },
      { nome: "D1 — operatore tecnico qualificato", totaleMensile: 1540.00 },
      { nome: "C2 — addetto all'assistenza di base", totaleMensile: 1460.00 },
      { nome: "C1 — addetto ai servizi ausiliari", totaleMensile: 1400.00 },
      { nome: "A1 — addetto alle pulizie / mansioni semplici", totaleMensile: 1330.00 }
    ]
  },
  {
    nome: "Vigilanza Privata e Servizi Fiduciari",
    oreFullTime: 40,
    mensilita: 13,
    aggiornato: "minimi indicativi 2024 — verificare l'ultima tranche",
    fonte: "Tabelle CCNL Vigilanza Privata / Servizi Fiduciari",
    livelli: [
      { nome: "Livello A — quadri/funzioni direttive", totaleMensile: 2360.00 },
      { nome: "Livello B — impiegato di concetto / capo servizio", totaleMensile: 2010.00 },
      { nome: "Livello C — guardia particolare giurata specializzata", totaleMensile: 1720.00 },
      { nome: "Livello D — guardia particolare giurata", totaleMensile: 1590.00 },
      { nome: "Livello E — operatore di servizi fiduciari / portierato", totaleMensile: 1480.00 },
      { nome: "Livello F — addetto ai servizi ausiliari / mansioni semplici", totaleMensile: 1390.00 }
    ]
  }
];
