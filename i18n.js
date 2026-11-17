// Traduzioni UI: ITA, GER, SPA, FRA (fallback su ITA)
const I18N = {
  it: {
    appTitle: "WEIGHT REMINDER", select: "Seleziona gru", choose: "— scegli —", settings: "Impostazioni",
    language: "Cambio lingua", cranes: "Gru", addCrane: "+ Aggiungi gru", edit: "Modifica", del: "Elimina",
    save: "Salva", cancel: "Annulla", home: "Home", location: "Indirizzo / cantiere", name: "Nome / seriale",
    model3d: "Modello 3D", vDx: "Lato DX", vSx: "Lato SX", vTop: "Alto", vReset: "Reset", zoomZone: "Zoom zona",
    z_col_dx: "Colonna · lato DX", z_col_sx: "Colonna · lato SX", z_beam_dx: "Trave · lato DX",
    z_beam_sx: "Trave · lato SX", z_beam_top: "Trave · alto",
    pickZone: "Tocca una parte del modello (o una zona qui sopra) per vedere i pesi",
    tapHint: "Tocca un peso per toglierlo / rimetterlo", present: "Presente", removed: "Rimosso",
    weightsCrane: "Pesi GRU", stock: "Stock pesi", total: "Tot", factory: "Di fabbrica", diff: "Differenza",
    removedTot: "Rimossi", warn: "AVVISO!", missingTitle: "Pesi mancanti nello stock",
    missingInfo: "Per rimettere la gru in configurazione di fabbrica mancano:",
    order: "Ordina nuovi pesi", copied: "Ordine copiato negli appunti", stockEmpty: "Stock vuoto",
    addWeight: "Aggiungi allo stock", lb: "lb",
    layoutHelp: "Pesi in lb separati da spazio (es. 3 5 5). Salvando, la zona torna tutta 'presente'.",
    factoryReset: "Ripristina pesi di fabbrica", backup: "Backup dati", export: "Esporta", import: "Importa",
    confirmDel: "Eliminare questa gru?", confirmReset: "Rimettere tutti i pesi come da configurazione di fabbrica? (lo stock non cambia)",
    stockZero: "Attenzione: stock di {lb} lb a zero", noCranes: "Nessuna gru: premi + per aggiungerne una",
    importOk: "Dati importati", importKo: "File non valido", orderTitle: "Ordine pesi", need: "servono", have: "in stock",
    zones: "Zone", close: "Chiudi", share: "Condividi / copia", editTitle: "Modifica gru", newCrane: "Nuova gru", newName: "Nuova gru",
    zoomIn: "Ingrandisci", zoomOut: "Riduci", installed: "Installato", onCrane: "sulla gru"
  },
  de: {
    appTitle: "WEIGHT REMINDER", select: "Kran wählen", choose: "— wählen —", settings: "Einstellungen",
    language: "Sprache", cranes: "Krane", addCrane: "+ Kran hinzufügen", edit: "Bearbeiten", del: "Löschen",
    save: "Speichern", cancel: "Abbrechen", home: "Start", location: "Adresse / Baustelle", name: "Name / Seriennr.",
    model3d: "3D-Modell", vDx: "Seite R", vSx: "Seite L", vTop: "Oben", vReset: "Reset", zoomZone: "Zone zoomen",
    z_col_dx: "Säule · Seite R", z_col_sx: "Säule · Seite L", z_beam_dx: "Ausleger · Seite R",
    z_beam_sx: "Ausleger · Seite L", z_beam_top: "Ausleger · oben",
    pickZone: "Teil des Modells (oder Zone oben) antippen, um Gewichte zu sehen",
    tapHint: "Gewicht antippen zum Entfernen / Einsetzen", present: "Vorhanden", removed: "Entfernt",
    weightsCrane: "Gewichte Kran", stock: "Lagerbestand", total: "Ges", factory: "Werkseinstellung", diff: "Differenz",
    removedTot: "Entfernt", warn: "WARNUNG!", missingTitle: "Fehlende Gewichte im Lager",
    missingInfo: "Für die Werkskonfiguration fehlen:",
    order: "Neue Gewichte bestellen", copied: "Bestellung kopiert", stockEmpty: "Lager leer",
    addWeight: "Zum Lager hinzufügen", lb: "lb",
    layoutHelp: "Gewichte in lb, durch Leerzeichen getrennt (z.B. 3 5 5). Beim Speichern ist die Zone wieder komplett 'vorhanden'.",
    factoryReset: "Werksgewichte wiederherstellen", backup: "Datensicherung", export: "Exportieren", import: "Importieren",
    confirmDel: "Diesen Kran löschen?", confirmReset: "Alle Gewichte auf Werkskonfiguration zurücksetzen? (Lager bleibt)",
    stockZero: "Achtung: Lager {lb} lb bei null", noCranes: "Kein Kran: mit + hinzufügen",
    importOk: "Daten importiert", importKo: "Ungültige Datei", orderTitle: "Gewichtsbestellung", need: "benötigt", have: "im Lager",
    zones: "Zonen", close: "Schließen", share: "Teilen / kopieren", editTitle: "Kran bearbeiten", newCrane: "Neuer Kran", newName: "Neuer Kran",
    zoomIn: "Vergrößern", zoomOut: "Verkleinern", installed: "Installiert", onCrane: "am Kran"
  },
  es: {
    appTitle: "WEIGHT REMINDER", select: "Selecciona grúa", choose: "— elige —", settings: "Ajustes",
    language: "Cambio de idioma", cranes: "Grúas", addCrane: "+ Añadir grúa", edit: "Editar", del: "Eliminar",
    save: "Guardar", cancel: "Cancelar", home: "Inicio", location: "Dirección / obra", name: "Nombre / serie",
    model3d: "Modelo 3D", vDx: "Lado DER", vSx: "Lado IZQ", vTop: "Arriba", vReset: "Reset", zoomZone: "Zoom zona",
    z_col_dx: "Columna · lado DER", z_col_sx: "Columna · lado IZQ", z_beam_dx: "Pluma · lado DER",
    z_beam_sx: "Pluma · lado IZQ", z_beam_top: "Pluma · arriba",
    pickZone: "Toca una parte del modelo (o una zona arriba) para ver los pesos",
    tapHint: "Toca un peso para quitarlo / ponerlo", present: "Presente", removed: "Quitado",
    weightsCrane: "Pesos GRÚA", stock: "Stock pesos", total: "Tot", factory: "De fábrica", diff: "Diferencia",
    removedTot: "Quitados", warn: "¡AVISO!", missingTitle: "Pesos que faltan en el stock",
    missingInfo: "Para volver a la configuración de fábrica faltan:",
    order: "Pedir nuevos pesos", copied: "Pedido copiado", stockEmpty: "Stock vacío",
    addWeight: "Añadir al stock", lb: "lb",
    layoutHelp: "Pesos en lb separados por espacio (ej. 3 5 5). Al guardar, la zona vuelve a 'presente'.",
    factoryReset: "Restaurar pesos de fábrica", backup: "Copia de datos", export: "Exportar", import: "Importar",
    confirmDel: "¿Eliminar esta grúa?", confirmReset: "¿Volver todos los pesos a la configuración de fábrica? (el stock no cambia)",
    stockZero: "Atención: stock de {lb} lb a cero", noCranes: "Ninguna grúa: pulsa + para añadir",
    importOk: "Datos importados", importKo: "Archivo no válido", orderTitle: "Pedido de pesos", need: "faltan", have: "en stock",
    zones: "Zonas", close: "Cerrar", share: "Compartir / copiar", editTitle: "Editar grúa", newCrane: "Nueva grúa", newName: "Nueva grúa",
    zoomIn: "Acercar", zoomOut: "Alejar", installed: "Instalado", onCrane: "en la grúa"
  },
  fr: {
    appTitle: "WEIGHT REMINDER", select: "Sélectionner la grue", choose: "— choisir —", settings: "Réglages",
    language: "Changer de langue", cranes: "Grues", addCrane: "+ Ajouter une grue", edit: "Modifier", del: "Supprimer",
    save: "Enregistrer", cancel: "Annuler", home: "Accueil", location: "Adresse / chantier", name: "Nom / série",
    model3d: "Modèle 3D", vDx: "Côté DR", vSx: "Côté GA", vTop: "Dessus", vReset: "Reset", zoomZone: "Zoom zone",
    z_col_dx: "Mât · côté DR", z_col_sx: "Mât · côté GA", z_beam_dx: "Flèche · côté DR",
    z_beam_sx: "Flèche · côté GA", z_beam_top: "Flèche · dessus",
    pickZone: "Touchez une partie du modèle (ou une zone ci-dessus) pour voir les poids",
    tapHint: "Touchez un poids pour l'enlever / le remettre", present: "Présent", removed: "Retiré",
    weightsCrane: "Poids GRUE", stock: "Stock poids", total: "Tot", factory: "D'usine", diff: "Différence",
    removedTot: "Retirés", warn: "ATTENTION !", missingTitle: "Poids manquants dans le stock",
    missingInfo: "Pour revenir à la configuration d'usine il manque :",
    order: "Commander de nouveaux poids", copied: "Commande copiée", stockEmpty: "Stock vide",
    addWeight: "Ajouter au stock", lb: "lb",
    layoutHelp: "Poids en lb séparés par un espace (ex. 3 5 5). À l'enregistrement, la zone redevient 'présente'.",
    factoryReset: "Rétablir les poids d'usine", backup: "Sauvegarde", export: "Exporter", import: "Importer",
    confirmDel: "Supprimer cette grue ?", confirmReset: "Remettre tous les poids en configuration d'usine ? (le stock ne change pas)",
    stockZero: "Attention : stock de {lb} lb à zéro", noCranes: "Aucune grue : appuyez sur + pour en ajouter",
    importOk: "Données importées", importKo: "Fichier invalide", orderTitle: "Commande de poids", need: "manquent", have: "en stock",
    zones: "Zones", close: "Fermer", share: "Partager / copier", editTitle: "Modifier la grue", newCrane: "Nouvelle grue", newName: "Nouvelle grue",
    zoomIn: "Agrandir", zoomOut: "Réduire", installed: "Installé", onCrane: "sur la grue"
  }
};


Object.assign(I18N.it, { open: "Apri gru", logTitle: "Log azioni", logEmpty: "Nessuna azione registrata", logClear: "Svuota log", logClearQ: "Cancellare il log di questa gru?", logRem: "Tolto", logAdd: "Aggiunto" });
Object.assign(I18N.de, { open: "Kran öffnen", logTitle: "Aktionsprotokoll", logEmpty: "Keine Aktionen", logClear: "Protokoll leeren", logClearQ: "Protokoll dieses Krans löschen?", logRem: "Entfernt", logAdd: "Hinzugefügt" });
Object.assign(I18N.es, { open: "Abrir grúa", logTitle: "Registro de acciones", logEmpty: "Sin acciones", logClear: "Vaciar registro", logClearQ: "¿Borrar el registro de esta grúa?", logRem: "Quitado", logAdd: "Añadido" });
Object.assign(I18N.fr, { open: "Ouvrir la grue", logTitle: "Journal des actions", logEmpty: "Aucune action", logClear: "Vider le journal", logClearQ: "Effacer le journal de cette grue ?", logRem: "Retiré", logAdd: "Ajouté" });


Object.assign(I18N.it, { installed: "Installato", missingN: "mancano {n}", takeOff: "TOGLI", putBack: "RIMETTI", undo: "Annulla", last: "Ultimo", undone: "Azione annullata" });
Object.assign(I18N.de, { installed: "Montiert", missingN: "fehlen {n}", takeOff: "ENTFERNEN", putBack: "EINSETZEN", undo: "Rückgängig", last: "Zuletzt", undone: "Rückgängig gemacht" });
Object.assign(I18N.es, { installed: "Instalado", missingN: "faltan {n}", takeOff: "QUITAR", putBack: "PONER", undo: "Deshacer", last: "Último", undone: "Acción deshecha" });
Object.assign(I18N.fr, { installed: "Installé", missingN: "manquent {n}", takeOff: "RETIRER", putBack: "REMETTRE", undo: "Annuler", last: "Dernier", undone: "Action annulée" });
