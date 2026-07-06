/*
 * calcolo.js — Motore di calcolo del netto da lavoro dipendente (anno 2025).
 * Funzioni pure: nessun accesso al DOM. Usa le costanti definite in dati.js.
 *
 * Flusso:
 *   RAL + Superminimo (lordo annuo)
 *     - contributi INPS               -> imponibile fiscale
 *     - IRPEF netta (lorda - detrazioni)
 *     - addizionali regionale e comunale
 *     + bonus integrativo 2025 (non tassato)
 *   = NETTO annuo
 */

// IRPEF lorda a scaglioni progressivi.
function irpefLorda(imponibile) {
  let imposta = 0;
  let precedente = 0;
  for (const scaglione of SCAGLIONI_IRPEF) {
    if (imponibile <= precedente) break;
    const quota = Math.min(imponibile, scaglione.fino) - precedente;
    imposta += quota * scaglione.aliquota;
    precedente = scaglione.fino;
  }
  return imposta;
}

// Detrazioni da lavoro dipendente (art. 13 TUIR, importi 2025), rapporto a tempo pieno/anno intero.
function detrazioneLavoroDipendente(reddito) {
  let d;
  if (reddito <= 15000) {
    d = 1955;
  } else if (reddito <= 28000) {
    d = 1910 + 1190 * (28000 - reddito) / 13000;
  } else if (reddito <= 50000) {
    d = 1910 * (50000 - reddito) / 22000;
  } else {
    d = 0;
  }
  // Maggiorazione di 65 € per redditi tra 25.000 e 35.000 €.
  if (reddito > 25000 && reddito <= 35000) {
    d += 65;
  }
  return Math.max(0, d);
}

// Detrazione per coniuge a carico (art. 12 TUIR), con le piccole maggiorazioni 29.000–35.200 €.
function detrazioneConiuge(reddito) {
  if (reddito <= 15000) {
    return 800 - 110 * (reddito / 15000);
  }
  if (reddito <= 40000) {
    let d = 690;
    if (reddito > 29000 && reddito <= 29200) d += 10;
    else if (reddito > 29200 && reddito <= 34700) d += 20;
    else if (reddito > 34700 && reddito <= 35000) d += 30;
    else if (reddito > 35000 && reddito <= 35100) d += 20;
    else if (reddito > 35100 && reddito <= 35200) d += 10;
    return d;
  }
  if (reddito <= 80000) {
    return 690 * (80000 - reddito) / 40000;
  }
  return 0;
}

// Ulteriore detrazione 2025 per redditi 20.000–40.000 € (Legge di Bilancio 2025).
function ulterioreDetrazione2025(reddito) {
  if (reddito > 20000 && reddito <= 32000) {
    return 1000;
  }
  if (reddito > 32000 && reddito <= 40000) {
    return 1000 * (40000 - reddito) / 8000;
  }
  return 0;
}

// Bonus / somma integrativa 2025 per redditi fino a 20.000 € (non concorre a tassazione).
function bonusIntegrativo2025(redditoLavoro) {
  let aliquota = 0;
  if (redditoLavoro <= 8500) aliquota = 0.071;
  else if (redditoLavoro <= 15000) aliquota = 0.053;
  else if (redditoLavoro <= 20000) aliquota = 0.048;
  return redditoLavoro * aliquota;
}

/*
 * Calcolo completo.
 * input = { ral, superminimo, mensilita, oreSettimana, aliquotaRegionale,
 *           coniugeACarico (bool), aliquotaComunale }
 * Restituisce un oggetto con tutti i passaggi (per trasparenza).
 */
function calcolaNetto(input) {
  const lordo = input.ral + input.superminimo;

  // Contributi INPS a carico dipendente.
  let inps = lordo * INPS.aliquotaBase;
  if (lordo > INPS.primaFasciaAnnua) {
    inps += (lordo - INPS.primaFasciaAnnua) * INPS.aliquotaAggiuntiva;
  }

  const imponibileFiscale = lordo - inps;

  // IRPEF.
  const irpefLordaVal = irpefLorda(imponibileFiscale);
  const detrLavoro = detrazioneLavoroDipendente(imponibileFiscale);
  const detrConiuge = input.coniugeACarico ? detrazioneConiuge(imponibileFiscale) : 0;
  const ultDetr = ulterioreDetrazione2025(imponibileFiscale);
  const irpefNetta = Math.max(0, irpefLordaVal - detrLavoro - detrConiuge - ultDetr);

  // Bonus integrativo 2025 (aggiunto al netto, non tassato).
  const bonus = bonusIntegrativo2025(imponibileFiscale);

  // Addizionali sull'imponibile fiscale.
  const addRegionale = imponibileFiscale * input.aliquotaRegionale;
  const addComunale = imponibileFiscale * input.aliquotaComunale;

  const nettoAnnuo = imponibileFiscale - irpefNetta - addRegionale - addComunale + bonus;

  const nettoMensile = nettoAnnuo / input.mensilita;

  // Netto orario: netto annuo diviso le ore contrattuali dell'anno.
  const oreAnnue = input.oreSettimana * SETTIMANE_ANNO;
  const nettoOrario = oreAnnue > 0 ? nettoAnnuo / oreAnnue : 0;

  return {
    lordo,
    inps,
    imponibileFiscale,
    irpefLorda: irpefLordaVal,
    detrLavoro,
    detrConiuge,
    ultDetr,
    irpefNetta,
    bonus,
    addRegionale,
    addComunale,
    nettoAnnuo,
    nettoMensile,
    nettoOrario,
    oreAnnue
  };
}

/*
 * Calcola il netto come RANGE, facendo variare la sola addizionale comunale
 * (min = Comune che non l'applica, max = tetto ordinario 0,8%).
 * Il valore "centrale" usa l'aliquota comunale tipica.
 */
function calcolaRange(inputBase) {
  const min = calcolaNetto(Object.assign({}, inputBase, { aliquotaComunale: ADDIZIONALE_COMUNALE.min }));
  const tipico = calcolaNetto(Object.assign({}, inputBase, { aliquotaComunale: ADDIZIONALE_COMUNALE.tipica }));
  const max = calcolaNetto(Object.assign({}, inputBase, { aliquotaComunale: ADDIZIONALE_COMUNALE.max }));
  return { min, tipico, max };
}
