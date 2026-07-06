/*
 * app.js — Interfaccia: legge il form, invoca il motore di calcolo, mostra i risultati.
 */

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const euro2 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const perc = (frazione) => (frazione * 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

document.addEventListener('DOMContentLoaded', () => {
  popolaRegioni();
  popolaContratti();

  document.getElementById('form-calcolo').addEventListener('submit', (e) => {
    e.preventDefault();
    esegui();
  });
  document.getElementById('btn-sim').addEventListener('click', simulaRAL);
});

// Popola il menu delle regioni, con il Piemonte preselezionato.
function popolaRegioni() {
  const select = document.getElementById('regione');
  REGIONI.forEach((r, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = r.nome;
    if (r.nome === 'Piemonte') opt.selected = true;
    select.appendChild(opt);
  });
}

// --- Simulazione RAL minima da CCNL + livello ---

function popolaContratti() {
  const selC = document.getElementById('ccnl');
  CONTRATTI.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = c.nome;
    selC.appendChild(opt);
  });
  selC.addEventListener('change', popolaLivelli);
  popolaLivelli();
}

function popolaLivelli() {
  const c = CONTRATTI[parseInt(document.getElementById('ccnl').value, 10) || 0];
  const selL = document.getElementById('livello');
  selL.innerHTML = '';
  c.livelli.forEach((l, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = l.nome;
    if (l.nome.includes("Impiegato d'ordine")) opt.selected = true;
    selL.appendChild(opt);
  });
  document.getElementById('oreSim').value = c.oreFullTime;
  document.getElementById('oreSim-help').textContent =
    `Tempo pieno del contratto: ${c.oreFullTime} ore, ${c.mensilita} mensilità (${c.aggiornato}). Inserisci meno ore per un part-time.`;
}

function simulaRAL() {
  const c = CONTRATTI[parseInt(document.getElementById('ccnl').value, 10) || 0];
  const livIdx = parseInt(document.getElementById('livello').value, 10) || 0;
  const ore = Math.max(0, parseFloat(document.getElementById('oreSim').value) || 0);
  const res = ralMinimaContratto(c, livIdx, ore);

  // Riporta i valori nei campi principali.
  document.getElementById('ral').value = Math.round(res.ral);
  document.getElementById('superminimo').value = 0;
  document.getElementById('mensilita').value = String(c.mensilita);
  document.getElementById('ore').value = res.ore;

  const nota = res.ore < res.oreFullTime
    ? `part-time ${res.ore}h/${res.oreFullTime}h`
    : 'tempo pieno';
  document.getElementById('sim-esito').textContent =
    `RAL minima ${res.livello}: ${euro.format(res.ral)} (${nota}). Riportata nel campo RAL qui sotto.`;

  esegui();
}

// --- Calcolo del netto ---

function leggiInput() {
  const idxRegione = parseInt(document.getElementById('regione').value, 10) || 0;
  const aliquotaComunale = Math.max(0, (parseFloat(document.getElementById('comunale').value) || 0) / 100);
  return {
    ral: Math.max(0, parseFloat(document.getElementById('ral').value) || 0),
    superminimo: Math.max(0, parseFloat(document.getElementById('superminimo').value) || 0),
    mensilita: parseInt(document.getElementById('mensilita').value, 10) || 12,
    oreSettimana: Math.max(0, parseFloat(document.getElementById('ore').value) || 0),
    aliquotaRegionale: REGIONI[idxRegione].aliquota,
    nomeRegione: REGIONI[idxRegione].nome,
    aliquotaComunale: aliquotaComunale,
    coniugeACarico: document.getElementById('coniuge').checked
  };
}

function esegui() {
  const input = leggiInput();
  if (input.ral <= 0) {
    alert('Inserisci una RAL maggiore di zero.');
    return;
  }

  // Stima puntuale col Comune indicato dall'utente.
  const centrale = calcolaNetto(input);
  // Intervallo al variare della sola addizionale comunale (0% → 0,8%).
  const nettoMax = calcolaNetto(Object.assign({}, input, { aliquotaComunale: ADDIZIONALE_COMUNALE.min }));
  const nettoMin = calcolaNetto(Object.assign({}, input, { aliquotaComunale: ADDIZIONALE_COMUNALE.max }));

  document.getElementById('out-mensile').textContent = euro.format(centrale.nettoMensile);
  document.getElementById('out-mensile-range').textContent =
    `in altri Comuni: ${euro.format(nettoMin.nettoMensile)} – ${euro.format(nettoMax.nettoMensile)}`;

  document.getElementById('out-annuo').textContent = euro.format(centrale.nettoAnnuo);
  document.getElementById('out-annuo-range').textContent =
    `${euro.format(nettoMin.nettoAnnuo)} – ${euro.format(nettoMax.nettoAnnuo)}`;

  document.getElementById('out-orario').textContent = euro2.format(centrale.nettoOrario);

  mostraDettaglio(centrale, input);
}

function mostraDettaglio(c, input) {
  const righe = [
    ['RAL + Superminimo (lordo annuo)', euro2.format(c.lordo), false],
    ['− Contributi INPS (9,19%)', '− ' + euro2.format(c.inps), false],
    ['= Imponibile fiscale', euro2.format(c.imponibileFiscale), true],
    ['IRPEF lorda (scaglioni)', euro2.format(c.irpefLorda), false],
    ['− Detrazioni lavoro dipendente', '− ' + euro2.format(c.detrLavoro), false]
  ];
  if (c.detrConiuge > 0) righe.push(['− Detrazione coniuge a carico', '− ' + euro2.format(c.detrConiuge), false]);
  if (c.ultDetr > 0) righe.push(['− Ulteriore detrazione 2025', '− ' + euro2.format(c.ultDetr), false]);
  righe.push(['= IRPEF netta', '− ' + euro2.format(c.irpefNetta), true]);
  righe.push([`− Addizionale regionale (${input.nomeRegione}, ${perc(input.aliquotaRegionale)})`, '− ' + euro2.format(c.addRegionale), false]);
  righe.push([`− Addizionale comunale (${perc(input.aliquotaComunale)})`, '− ' + euro2.format(c.addComunale), false]);
  if (c.bonus > 0) righe.push(['+ Bonus integrativo 2025', '+ ' + euro2.format(c.bonus), false]);
  righe.push(['= Netto annuo', euro2.format(c.nettoAnnuo), true]);
  righe.push([`Netto mensile (÷ ${input.mensilita})`, euro2.format(c.nettoMensile), true]);
  righe.push([`Netto orario (${input.oreSettimana} h × ${SETTIMANE_ANNO} sett.)`, euro2.format(c.nettoOrario), false]);

  const body = document.getElementById('dettaglio-body');
  body.innerHTML = '';
  for (const [label, valore, forte] of righe) {
    const tr = document.createElement('tr');
    if (forte) tr.className = 'riga-totale';
    const td1 = document.createElement('td');
    td1.textContent = label;
    const td2 = document.createElement('td');
    td2.className = 'text-end valore-num';
    td2.textContent = valore;
    tr.appendChild(td1);
    tr.appendChild(td2);
    body.appendChild(tr);
  }
}
