// Ablage der Dokumente im Geraet (IndexedDB). Ein Eintrag: { id, name, art, datei (Blob), geaendert }.
// Spaeter kommt hier der Abgleich mit dem Heft-Konto (Supabase) dazu.
const Speicher = (() => {
  let db;
  function oeffnen() {
    if (db) return Promise.resolve(db);
    return new Promise((ok, fehler) => {
      const r = indexedDB.open('kxd-office', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('dokumente', { keyPath: 'id' });
      r.onsuccess = () => ok(db = r.result);
      r.onerror = () => fehler(r.error);
    });
  }
  async function vorgang(modus, f) {
    const d = await oeffnen();
    return new Promise((ok, fehler) => {
      const t = d.transaction('dokumente', modus);
      const r = f(t.objectStore('dokumente'));
      t.oncomplete = () => ok(r && r.result);
      t.onerror = () => fehler(t.error);
    });
  }
  return {
    alle: () => vorgang('readonly', (s) => s.getAll()).then((l) => l.sort((a, b) => b.geaendert - a.geaendert)),
    holen: (id) => vorgang('readonly', (s) => s.get(id)),
    sichern: (eintrag) => vorgang('readwrite', (s) => s.put({ ...eintrag, geaendert: Date.now() })),
    loeschen: (id) => vorgang('readwrite', (s) => s.delete(id)),
  };
})();
