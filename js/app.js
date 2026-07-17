/*
 * app.js — Interfaccia: legge il form, invoca il motore di calcolo, mostra i risultati.
 */

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const euro2 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const perc = (frazione) => (frazione * 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

// Testi delle icone "informazioni" nel dettaglio del calcolo.
const INFO_BONUS =
  'Somma integrativa introdotta dalla Legge di Bilancio 2025 (L. 207/2024) per i ' +
  'redditi da lavoro dipendente fino a 20.000 €. È esente da imposte e si aggiunge ' +
  'al netto: 7,1% del reddito fino a 8.500 €, 5,3% tra 8.500 e 15.000 €, 4,8% tra ' +
  '15.000 e 20.000 €. Oltre i 20.000 € non spetta più: subentra l’ulteriore detrazione IRPEF.';
const INFO_ULT_DETR =
  'Ulteriore detrazione IRPEF (Legge di Bilancio 2025) per i redditi da lavoro ' +
  'dipendente tra 20.000 e 40.000 €. Vale 1.000 € fissi fino a 32.000 €, poi ' +
  'diminuisce gradualmente fino ad azzerarsi a 40.000 €. Sotto i 20.000 € è ' +
  'sostituita dal bonus integrativo.';

document.addEventListener('DOMContentLoaded', () => {
  popolaRegioni();
  popolaContratti();

  document.getElementById('form-calcolo').addEventListener('submit', (e) => {
    e.preventDefault();
    esegui();
  });
  document.getElementById('btn-sim').addEventListener('click', simulaRAL);
  document.getElementById('comune').addEventListener('change', applicaComune);
  initInstall();
  initSimToggle();
});

// --- Testo dinamico del pulsante che apre/chiude la simulazione RAL da CCNL ---
function initSimToggle() {
  const body = document.getElementById('sim-contratto-body');
  const btn = document.getElementById('btn-sim-toggle');
  body.addEventListener('shown.bs.collapse', () => { btn.textContent = 'Nascondi simulazione'; });
  body.addEventListener('hidden.bs.collapse', () => { btn.textContent = 'Mostra simulazione'; });
}

// --- Pulsante "Installa l'app" (PWA), mostrato solo su telefono ---
function initInstall() {
  const wrap = document.getElementById('install-wrap');
  const btn = document.getElementById('btn-install');
  const hint = document.getElementById('install-hint');

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobile = (navigator.userAgentData && navigator.userAgentData.mobile) || /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  // Già installata o non è un telefono: non mostrare nulla.
  if (isStandalone || !isMobile) return;

  let deferredPrompt = null;

  // Android/Chrome: intercetta l'evento e mostra il pulsante.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    wrap.hidden = false;
  });

  // iOS/Safari non emette l'evento: mostra comunque il pulsante con le istruzioni.
  if (isIOS) wrap.hidden = false;

  btn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      wrap.hidden = true;
    } else if (isIOS) {
      hint.hidden = false;
      hint.textContent = 'Tocca l’icona Condividi in basso, poi «Aggiungi a Home».';
    }
  });

  window.addEventListener('appinstalled', () => { wrap.hidden = true; });
}

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
  // Al cambio di regione, ripopola i capoluoghi figli.
  select.addEventListener('change', () => popolaComuni('Torino'));
  // Prima compilazione: capoluoghi del Piemonte con Torino preselezionata.
  popolaComuni('Torino');
}

// Popola i Comuni capoluogo della regione selezionata e compila l'aliquota.
function popolaComuni(comuneDefault) {
  const idxRegione = parseInt(document.getElementById('regione').value, 10) || 0;
  const comuni = REGIONI[idxRegione].comuni || [];
  const selC = document.getElementById('comune');
  selC.innerHTML = '';

  comuni.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${c.nome} — ${c.aliquota.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    if (comuneDefault && c.nome === comuneDefault) opt.selected = true;
    selC.appendChild(opt);
  });

  // Opzione per un Comune non capoluogo: aliquota inserita a mano.
  const altro = document.createElement('option');
  altro.value = 'altro';
  altro.textContent = 'Altro Comune (inserisci l’aliquota)';
  selC.appendChild(altro);

  // Applica l'aliquota del Comune selezionato al campo numerico.
  applicaComune();
}

// Copia l'aliquota del Comune scelto nel campo "Addizionale comunale".
function applicaComune() {
  const idxRegione = parseInt(document.getElementById('regione').value, 10) || 0;
  const selC = document.getElementById('comune');
  const comuni = REGIONI[idxRegione].comuni || [];
  const val = selC.value;
  if (val === 'altro' || val === '') return; // Comune non capoluogo: non tocco il campo
  const comune = comuni[parseInt(val, 10)];
  if (comune) {
    document.getElementById('comunale').value = comune.aliquota.toFixed(2);
    // Se ci sono già dei risultati a schermo, riallinea subito.
    if (document.getElementById('out-mensile').textContent !== '—') esegui();
  }
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
  document.getElementById('out-mensilita').textContent = `(${input.mensilita} mensilità)`;
  document.getElementById('out-mensile-range').textContent =
    `${euro.format(nettoMin.nettoMensile)} – ${euro.format(nettoMax.nettoMensile)}`;

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
  if (c.ultDetr > 0) righe.push(['− Ulteriore detrazione 2025', '− ' + euro2.format(c.ultDetr), false, INFO_ULT_DETR]);
  righe.push(['= IRPEF netta', '− ' + euro2.format(c.irpefNetta), true]);
  righe.push([`− Addizionale regionale (${input.nomeRegione}, ${perc(input.aliquotaRegionale)})`, '− ' + euro2.format(c.addRegionale), false]);
  righe.push([`− Addizionale comunale (${perc(input.aliquotaComunale)})`, '− ' + euro2.format(c.addComunale), false]);
  if (c.bonus > 0) righe.push(['+ Bonus integrativo 2025', '+ ' + euro2.format(c.bonus), false, INFO_BONUS]);
  righe.push(['= Netto annuo', euro2.format(c.nettoAnnuo), true]);
  righe.push([`Netto mensile (÷ ${input.mensilita})`, euro2.format(c.nettoMensile), true]);
  righe.push([`Netto orario (${input.oreSettimana} h × ${SETTIMANE_ANNO} sett.)`, euro2.format(c.nettoOrario), false]);

  const body = document.getElementById('dettaglio-body');
  body.innerHTML = '';
  for (const [label, valore, forte, info] of righe) {
    const tr = document.createElement('tr');
    if (forte) tr.className = 'riga-totale';
    const td1 = document.createElement('td');
    td1.textContent = label;
    if (info) td1.appendChild(creaIconaInfo(info));
    const td2 = document.createElement('td');
    td2.className = 'text-end valore-num';
    td2.textContent = valore;
    tr.appendChild(td1);
    tr.appendChild(td2);
    body.appendChild(tr);
  }
  initTooltip();
}

// Crea l'icona "informazioni" con tooltip (Bootstrap Italia) e title di fallback.
function creaIconaInfo(testo) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-info-dettaglio ms-1';
  btn.setAttribute('data-bs-toggle', 'tooltip');
  btn.setAttribute('data-bs-placement', 'top');
  btn.setAttribute('title', testo);
  btn.setAttribute('aria-label', 'Come funziona: ' + testo);
  btn.innerHTML =
    '<svg class="icon icon-primary icon-sm" aria-hidden="true">' +
    '<use href="https://cdn.jsdelivr.net/npm/bootstrap-italia@2.15.0/dist/svg/sprites.svg#it-help-circle"></use></svg>';
  return btn;
}

// Inizializza i tooltip Bootstrap sulle icone appena inserite.
function initTooltip() {
  if (!window.bootstrap || !window.bootstrap.Tooltip) return;
  document.querySelectorAll('#dettaglio-body [data-bs-toggle="tooltip"]').forEach((el) => {
    const esistente = window.bootstrap.Tooltip.getInstance(el);
    if (esistente) esistente.dispose();
    new window.bootstrap.Tooltip(el);
  });
}
