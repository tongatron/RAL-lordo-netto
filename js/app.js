/*
 * app.js — Interfaccia: legge il form, invoca il motore di calcolo, mostra i risultati.
 */

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const euro2 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

document.addEventListener('DOMContentLoaded', () => {
  popolaRegioni();
  const form = document.getElementById('form-calcolo');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    esegui();
  });

  // Mostra/nasconde i campi part-time.
  const partTime = document.getElementById('partTime');
  partTime.addEventListener('change', () => {
    document.getElementById('pt-fields').hidden = !partTime.checked;
  });
});

// Popola il menu delle regioni, con la Lombardia preselezionata.
function popolaRegioni() {
  const select = document.getElementById('regione');
  REGIONI.forEach((r, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = r.nome;
    if (r.nome === 'Lombardia') opt.selected = true;
    select.appendChild(opt);
  });
}

function leggiInput() {
  const idxRegione = parseInt(document.getElementById('regione').value, 10) || 0;
  const ralNominale = Math.max(0, parseFloat(document.getElementById('ral').value) || 0);
  const oreSettimana = Math.max(0, parseFloat(document.getElementById('ore').value) || 0);
  const partTime = document.getElementById('partTime').checked;
  const oreFullTime = Math.max(0, parseFloat(document.getElementById('oreFullTime').value) || 0);

  // Con il part-time la RAL inserita (tempo pieno) viene ridotta in proporzione alle ore.
  let ral = ralNominale;
  if (partTime && oreFullTime > 0 && oreSettimana > 0) {
    ral = ralNominale * (oreSettimana / oreFullTime);
  }

  return {
    ral: ral,                    // RAL effettiva usata dal calcolo
    ralNominale: ralNominale,    // RAL a tempo pieno inserita (per il dettaglio)
    partTime: partTime,
    oreFullTime: oreFullTime,
    superminimo: Math.max(0, parseFloat(document.getElementById('superminimo').value) || 0),
    mensilita: parseInt(document.getElementById('mensilita').value, 10) || 12,
    oreSettimana: oreSettimana,
    aliquotaRegionale: REGIONI[idxRegione].aliquota,
    nomeRegione: REGIONI[idxRegione].nome,
    coniugeACarico: document.getElementById('coniuge').checked
  };
}

function esegui() {
  const input = leggiInput();
  if (input.ral <= 0) {
    alert('Inserisci una RAL maggiore di zero.');
    return;
  }

  const range = calcolaRange(input);
  // Netto più ALTO = addizionale comunale minima; più BASSO = addizionale comunale massima.
  const nettoMax = range.min;   // comunale 0%
  const nettoMin = range.max;   // comunale 0,8%
  const centrale = range.tipico;

  // Riquadro principale.
  document.getElementById('out-mensile').textContent = euro.format(centrale.nettoMensile);
  document.getElementById('out-mensile-range').textContent =
    `tra ${euro.format(nettoMin.nettoMensile)} e ${euro.format(nettoMax.nettoMensile)}`;

  document.getElementById('out-annuo').textContent = euro.format(centrale.nettoAnnuo);
  document.getElementById('out-annuo-range').textContent =
    `${euro.format(nettoMin.nettoAnnuo)} – ${euro.format(nettoMax.nettoAnnuo)}`;

  document.getElementById('out-orario').textContent = euro2.format(centrale.nettoOrario);

  mostraDettaglio(centrale, input);
}

function mostraDettaglio(c, input) {
  const righe = [];
  if (input.partTime && input.oreFullTime > 0) {
    righe.push(['RAL a tempo pieno (riferimento)', euro2.format(input.ralNominale), false]);
    righe.push([`Riproporzione part-time (${input.oreSettimana}h ÷ ${input.oreFullTime}h)`, euro2.format(c.lordo - input.superminimo), false]);
  }
  righe.push(
    ['RAL + Superminimo (lordo annuo)', euro2.format(c.lordo), false],
    ['− Contributi INPS (9,19%)', '− ' + euro2.format(c.inps), false],
    ['= Imponibile fiscale', euro2.format(c.imponibileFiscale), true],
    ['IRPEF lorda (scaglioni)', euro2.format(c.irpefLorda), false],
    ['− Detrazioni lavoro dipendente', '− ' + euro2.format(c.detrLavoro), false]
  );
  if (c.detrConiuge > 0) righe.push(['− Detrazione coniuge a carico', '− ' + euro2.format(c.detrConiuge), false]);
  if (c.ultDetr > 0) righe.push(['− Ulteriore detrazione 2025', '− ' + euro2.format(c.ultDetr), false]);
  righe.push(['= IRPEF netta', '− ' + euro2.format(c.irpefNetta), true]);
  righe.push([`− Addizionale regionale (${input.nomeRegione})`, '− ' + euro2.format(c.addRegionale), false]);
  righe.push(['− Addizionale comunale (valore centrale 0,4%)', '− ' + euro2.format(c.addComunale), false]);
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
