# Dalla RAL al netto — calcolo stipendio netto

Piccola web app che stima il **netto annuo, mensile e orario** a partire dalla
**RAL** (Retribuzione Annua Lorda) in trattativa, per un rapporto di **lavoro
dipendente**. Calcolo riferito all'anno d'imposta **2025**.

Interfaccia basata su **[Bootstrap Italia](https://italia.github.io/bootstrap-italia/)**
(Design System delle PA italiane), font **Titillium Web**.

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
  − addizionale regionale IRPEF (per regione)
  − addizionale comunale IRPEF (gestita come RANGE 0 → 0,8%)
  + bonus integrativo 2025 (redditi ≤ 20k, non tassato)
= NETTO annuo → ÷ mensilità → netto mensile; ÷ ore annue → netto orario
```

L'**addizionale comunale** non viene chiesta (varia Comune per Comune): il netto
è mostrato come **intervallo**. L'**addizionale regionale** usa un valore
rappresentativo per regione. È una **stima**, non sostituisce la busta paga.

### Part-time

Spuntando *Contratto part-time* la **RAL** inserita è intesa come quella a
**tempo pieno** e viene ridotta in proporzione alle ore
(`RAL × ore lavorate ÷ ore tempo pieno`); il superminimo resta invariato.

Il part-time incide sul netto **solo** tramite la RAL più bassa: aliquote e
scaglioni non cambiano. Nota: le **detrazioni da lavoro dipendente non si
riducono** per il part-time (dipendono dai giorni di lavoro nell'anno, non dalle
ore), quindi su un rapporto annuale restano piene.

## Struttura

| File | Contenuto |
|------|-----------|
| `index.html` | Interfaccia (form + risultati) |
| `css/style.css` | Personalizzazioni grafiche |
| `js/dati.js` | **Parametri fiscali 2025** — da aggiornare ogni anno |
| `js/calcolo.js` | Motore di calcolo (funzioni pure) |
| `js/app.js` | Collegamento form ↔ calcolo ↔ UI |

Per aggiornare le aliquote di un nuovo anno, in genere basta modificare
`js/dati.js` (scaglioni IRPEF, detrazioni, aliquote regionali).

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
