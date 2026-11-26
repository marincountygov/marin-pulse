// The search box on the Marin Pulse home page: type a word, see the County's organizations, programs, places, services and people
// that have it, grouped by kind, each opening its page here.
// It is plain on purpose. Lower case, accents ignored, every word typed must match the start of a word in a name, an other name or a description.
// One list feeds it: data/search-index.json (copied from marin-data, never edited here). Each entry's address is relative to this page.
// Without JavaScript the box stays hidden and the collections are all there is.
(() => {
  const box = document.getElementById("home-search");
  const input = document.getElementById("home-search-input");
  const statusEl = document.getElementById("home-search-status");
  const resultsEl = document.getElementById("home-search-results");
  const grid = document.getElementById("docs-collections");
  if (!box || !input || !statusEl || !resultsEl || !grid) return;
  box.hidden = false;

  const KINDS = ["Organization", "Program", "Place", "Service", "Person"];
  const PLURAL = { Organization: "Organizations", Program: "Programs", Place: "Places", Service: "Services", Person: "People" };
  const SHOWN = 60; // the most results listed; the count says how many there are
  const plain = (text) => String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const words = (text) => window.marinSearchWords(text);

  // The words typed are marked on the page a result opens (the shell: marinSearchRemember).
  let typedNow = [];

  let entries = null;
  let loading = null;

  // The list's addresses are relative to this page, so a result opens on the same site wherever it is served from.
  const fromList = (doc) => {
    if (!doc || !Array.isArray(doc.entries)) return [];
    return doc.entries.map((e) => ({ k: e.k, n: e.n, d: e.d || "", a: (e.a || []).join(" "), alts: e.a || [], c: e.c || "", h: e.h }));
  };
  const read = (url) => fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const load = () => {
    if (!loading) {
      loading = read("data/search-index.json").then((data) => {
        entries = fromList(data).map((e) => ({ ...e, nw: words(e.n), aw: words(e.a), dw: words(e.d), name: plain(e.n), code: plain(e.c), alt: e.alts.map(plain) }));
      });
    }
    return loading;
  };

  // ---- the match: every word typed starts a word of the name, the other names or the description ----
  const starts = (list, word) => list.some((w) => w.startsWith(word));
  const score = (e, typed, q) => {
    let total = 0;
    for (const word of typed) {
      if (starts(e.nw, word)) total += 3;
      else if (starts(e.aw, word)) total += 2;
      else if (e.code && e.code === word) total += 3; // a code is matched whole
      else if (starts(e.dw, word)) total += 1;
      else return 0;
    }
    if (e.code && e.code === q) total += 100; // the code, exactly
    if (e.alt.some((x) => x === q || x === `marin ${q}` || x === `marin county ${q}`)) total += 50; // another name for it, exactly (HHS)
    if (e.name === q) total += 100; // the name, exactly
    else if (e.name.startsWith(q)) total += 20; // a name that starts with what was typed
    return total;
  };

  // ---- the page ----
  const line = (count, q) => {
    const root = document.createElement("span");
    root.className = "results-line";
    root.append(Object.assign(document.createElement("span"), { className: "results-line__count", textContent: `${count.toLocaleString("en-US")} ${count === 1 ? "result" : "results"}` }));
    root.append(Object.assign(document.createElement("span"), { className: "results-line__slash", textContent: " / " }), Object.assign(document.createElement("span"), { className: "results-line__filters", textContent: `matching “${q}”` }));
    return root;
  };
  const item = (e) => {
    const li = document.createElement("li");
    li.append(Object.assign(document.createElement("a"), { href: e.h, textContent: e.n }));
    if (e.c) li.append(" ", Object.assign(document.createElement("span"), { textContent: `(${e.c})` }));
    if (e.d) li.append(" ", Object.assign(document.createElement("span"), { className: "home-search__what", textContent: e.d }));
    return li;
  };
  const clear = () => { resultsEl.replaceChildren(); statusEl.replaceChildren(); grid.hidden = false; };
  const run = () => {
    const q = plain(input.value).trim().replace(/\s+/g, " ");
    if (!q || !words(q).length) { clear(); return; }
    load().then(() => {
      if (plain(input.value).trim().replace(/\s+/g, " ") !== q) return; // the box has changed since
      const typed = words(q);
      typedNow = typed;
      const scored = entries.map((e, i) => [e, score(e, typed, q), i]).filter(([, s]) => s > 0)
        .sort((a, b) => b[1] - a[1] || KINDS.indexOf(a[0].k) - KINDS.indexOf(b[0].k) || a[0].n.localeCompare(b[0].n, "en", { sensitivity: "base", numeric: true }));
      const found = scored.map(([e]) => e);
      const best = new Map(); // the best score in each kind
      scored.forEach(([e, s]) => { if (!best.has(e.k)) best.set(e.k, s); });
      grid.hidden = true;
      statusEl.replaceChildren(line(found.length, input.value.trim()));
      // Grouped by kind, the group with the best match first, each with its count.
      const sizes = new Map();
      found.forEach((e) => sizes.set(e.k, (sizes.get(e.k) || 0) + 1));
      const groups = new Map();
      found.slice(0, SHOWN).forEach((e) => groups.set(e.k, [...(groups.get(e.k) || []), e]));
      resultsEl.replaceChildren(...[...groups].sort((a, b) => best.get(b[0]) - best.get(a[0]) || sizes.get(b[0]) - sizes.get(a[0]) || KINDS.indexOf(a[0]) - KINDS.indexOf(b[0])).map(([kind, list]) => {
        const group = document.createElement("section");
        group.className = "home-search__group";
        const ul = document.createElement("ul");
        ul.append(...list.map(item));
        group.append(Object.assign(document.createElement("h3"), { textContent: `${PLURAL[kind] || kind} (${sizes.get(kind)})` }), ul);
        return group;
      }));
      if (!found.length) resultsEl.append(Object.assign(document.createElement("p"), { innerHTML: '<a href="#">All collections</a>' }));
      const none = resultsEl.querySelector("p a");
      if (none) none.addEventListener("click", (event) => { event.preventDefault(); input.value = ""; clear(); input.focus(); });
    });
  };

  input.addEventListener("focus", load);
  input.addEventListener("input", run);
  resultsEl.addEventListener("click", (event) => { const link = event.target.closest("a[href]"); if (link) window.marinSearchRemember(link.href, typedNow); });
  // Enter opens the first result; Down moves into the list; Escape empties the box.
  const links = () => [...resultsEl.querySelectorAll("li a")];
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { const first = links()[0]; if (first) { event.preventDefault(); first.click(); } }
    else if (event.key === "ArrowDown") { const first = links()[0]; if (first) { event.preventDefault(); first.focus(); } }
    else if (event.key === "Escape") { input.value = ""; clear(); }
  });
  resultsEl.addEventListener("keydown", (event) => {
    const all = links();
    const at = all.indexOf(document.activeElement);
    if (at < 0) return;
    if (event.key === "ArrowDown" && at < all.length - 1) { event.preventDefault(); all[at + 1].focus(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); (at ? all[at - 1] : input).focus(); }
    else if (event.key === "Escape") { input.focus(); }
  });
})();
