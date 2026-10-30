// Ablage der Dokumente im Geraet (IndexedDB).
// Eintrag: { id, name, art, datei (Blob), geaendert, hochgeladen }  – hochgeladen = Stand, der schon in der Wolke liegt.
// Geloeschte Dokumente bleiben als Grabstein in „geloescht“, bis der Abgleich sie in der Wolke entfernt hat.
const Speicher = (() => {
  let db;
  function oeffnen() {
    if (db) return Promise.resolve(db);
    return new Promise((ok, fehler) => {
      const r = indexedDB.open('kxd-office', 2);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains('dokumente')) r.result.createObjectStore('dokumente', { keyPath: 'id' });
        if (!r.result.objectStoreNames.contains('geloescht')) r.result.createObjectStore('geloescht', { keyPath: 'id' });
        if (!r.result.objectStoreNames.contains('meta')) r.result.createObjectStore('meta', { keyPath: 'id' });
      };
      r.onsuccess = () => ok(db = r.result);
      r.onerror = () => fehler(r.error);
    });
  }
  async function vorgang(ablage, modus, f) {
    const d = await oeffnen();
    return new Promise((ok, fehler) => {
      const t = d.transaction(ablage, modus);
      const r = f(t.objectStore(ablage));
      t.oncomplete = () => ok(r && r.result);
      t.onerror = () => fehler(t.error);
    });
  }
  const geaendertMelden = () => dispatchEvent(new Event('kxd-lokal'));
  return {
    alle: () => vorgang('dokumente', 'readonly', (s) => s.getAll()).then((l) => l.sort((a, b) => b.geaendert - a.geaendert)),
    holen: (id) => vorgang('dokumente', 'readonly', (s) => s.get(id)),
    // Eigene Aenderung: Zeitstempel neu, Abgleich anstossen
    sichern: async (e) => { await vorgang('dokumente', 'readwrite', (s) => s.put({ ...e, geaendert: Date.now() })); geaendertMelden(); },
    // Vom Abgleich: Eintrag unveraendert ablegen (Zeitstempel kommt aus der Wolke)
    uebernehmen: (e) => vorgang('dokumente', 'readwrite', (s) => s.put(e)),
    loeschen: async (id) => {
      await vorgang('dokumente', 'readwrite', (s) => s.delete(id));
      await vorgang('geloescht', 'readwrite', (s) => s.put({ id, zeit: Date.now() }));
      geaendertMelden();
    },
    entfernen: (id) => vorgang('dokumente', 'readwrite', (s) => s.delete(id)),
    grabsteine: () => vorgang('geloescht', 'readonly', (s) => s.getAll()),
    grabsteinWeg: (id) => vorgang('geloescht', 'readwrite', (s) => s.delete(id)),
    meta: (id) => vorgang('meta', 'readonly', (s) => s.get(id)).then((m) => m?.wert),
    metaSetzen: (id, wert) => vorgang('meta', 'readwrite', (s) => s.put({ id, wert })),
  };
})();
