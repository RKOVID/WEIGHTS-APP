# Weight Reminder

PWA per tenere traccia dei pesi di contrappeso delle gru durante le manutenzioni: modello 3D semplice,
pesi montati/rimossi con un tap, stock personale e avviso arancione se mancano pesi.
Funziona offline e si installa su iPhone ("Condividi" → "Aggiungi a Home").

Nessuna dipendenza: HTML + CSS + JS puro. Dati salvati sul dispositivo (localStorage); backup JSON dalle impostazioni.

## Pubblicare su GitHub Pages
1. Crea un repo (es. `weight-reminder`) e carica tutti i file di questa cartella.
2. Settings → Pages → Branch `main` / root → Save.
3. Apri `https://<utente>.github.io/weight-reminder/` da Safari e aggiungi alla Home.

Dopo ogni modifica incrementa `VERSION` in `sw.js` per forzare l'aggiornamento della cache.

## Provare in locale
`python -m http.server 8765` poi apri http://localhost:8765
