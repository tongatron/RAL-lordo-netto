# Dalla RAL al netto — calcolo stipendio netto

Piccola web app che stima il **netto annuo, mensile e orario** a partire dalla
**RAL** (Retribuzione Annua Lorda) in trattativa, per un rapporto di **lavoro
dipendente**. Calcolo riferito all'anno d'imposta **2025**.

Interfaccia basata su **[Bootstrap Italia](https://italia.github.io/bootstrap-italia/)**
(Design System delle PA italiane), font **Titillium Web**.

**Online:** https://tongatron.org/RAL-lordo-netto/

## Come funziona

Tutto il calcolo avviene **nel browser**, in JavaScript. Nessun dato viene
inviato o salvato: puoi aprire `index.html` anche con un doppio clic.

Passaggi del calcolo:

```
RAL + Superminimo (lordo annuo)
  − Contributi INPS (9,19% + 1% oltre la prima fascia)   → imponibile fiscale
  − IRPEF netta = IRPEF lorda a scaglioni
                  − detrazioni lavoro dipendente
                  − detrazione coniuge a carico (se indicata)
                  − ulteriore detrazione 2025 (redditi 20–40k)
  − addizionale regionale IRPEF (per regione, predefinita: Piemonte)
  − addizionale comunale IRPEF (impostabile, predefinita: Torino 0,80%)
  + bonus integrativo 2025 (redditi ≤ 20k, non tassato)
= NETTO annuo → ÷ mensilità → netto mensile; ÷ ore annue → netto orario
```

L'**addizionale comunale** è impostabile (predefinita: Torino 0,80%); il netto
mostra anche l'**intervallo** al variare del Comune (0% → 0,8%). L'**addizionale
regionale** usa un valore rappresentativo per regione. È una **stima**, non
sostituisce la busta paga.

### Stima della RAL minima da CCNL

Il box *«Non conosci la RAL? Stimala dal contratto»* calcola la RAL **minima**
partendo da **CCNL + livello + ore settimanali**:

```
RAL minima (full-time) = (minimo tabellare + ex contingenza + EDR) × mensilità
RAL effettiva          = RAL full-time × (ore settimanali ÷ ore tempo pieno)
```

Se le ore sono inferiori all'orario pieno del contratto (es. 24h su 40h), la RAL
viene riproporzionata. Nota: le **detrazioni da lavoro dipendente non si riducono**
per il part-time (dipendono dai giorni di lavoro nell'anno, non dalle ore).

Contratti inclusi (in `js/dati.js`, `CONTRATTI`):

- **Commercio – Terziario (Confcommercio)** — 40h/settimana, 14 mensilità,
  minimi in vigore dal 1° novembre 2025. Es.: *4° livello — Impiegato d'ordine*
  = 1.781,68 €/mese → RAL full-time 24.943,52 €.

I minimi contrattuali cambiano a ogni tranche di rinnovo: **verificare sempre**
sulle tabelle ufficiali del CCNL.

## Struttura

| File | Contenuto |
|------|-----------|
| `index.html` | Interfaccia (form + risultati) |
| `css/style.css` | Personalizzazioni grafiche |
| `js/dati.js` | **Parametri fiscali 2025** — da aggiornare ogni anno |
| `js/calcolo.js` | Motore di calcolo (funzioni pure) |
| `js/app.js` | Collegamento form ↔ calcolo ↔ UI |
| `manifest.json` | Web App Manifest (PWA) |
| `sw.js` | Service worker (offline + installabilità) |
| `icons/` | Icone dell'app (192/512/maskable/apple-touch) |

Per aggiornare le aliquote di un nuovo anno, in genere basta modificare
`js/dati.js` (scaglioni IRPEF, detrazioni, aliquote regionali).

## App installabile (PWA)

La pagina è una **Progressive Web App**: da Chrome su Android compare
*«Aggiungi a schermata Home»* / *«Installa app»* e si apre a tutto schermo come
un'app nativa, con funzionamento anche offline (gli asset sono in cache).

Requisiti già soddisfatti: HTTPS (GitHub Pages), `manifest.json`, service worker
con gestione `fetch`, icone 192/512 px + versione *maskable*.

Un pulsante **«Installa l'app»** compare solo su telefono (nascosto su desktop):
su Android/Chrome lancia il prompt nativo, su iOS/Safari mostra l'istruzione
«Aggiungi a Home».

### Aggiornamenti automatici

Il service worker usa una strategia **stale-while-revalidate**: ad ogni visita
online scarica in background la versione aggiornata degli asset, mostrata al
reload successivo. **Non serve incrementare alcun numero di versione**: basta
fare `git push` e l'aggiornamento raggiunge da solo i dispositivi.

## Pubblicare su GitHub Pages

Non serve alcun server: è un sito statico.

1. Crea un repository su GitHub (es. `lordo-netto`) e carica questi file:
   ```
   git init
   git add .
   git commit -m "Calcolo netto da RAL"
   git branch -M main
   git remote add origin https://github.com/<utente>/<repo>.git
   git push -u origin main
   ```
2. Su GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   ramo `main`, cartella `/ (root)`, salva.
3. Dopo qualche minuto il sito è online su
   `https://<utente>.github.io/<repo>/`.

## Test rapido in locale

```
python3 -m http.server 4173
# poi apri http://localhost:4173
```

## Avvertenze

Stima indicativa a fini di orientamento nella trattativa. Assume tempo pieno per
l'intero anno. Non include fringe benefit, premi di risultato, né l'Assegno Unico
(erogato a parte dall'INPS). Per valori esatti fare riferimento a una busta paga
o a un consulente del lavoro.
