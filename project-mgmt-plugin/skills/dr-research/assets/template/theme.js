/* ============================================================================
   dr-research microsite — theme.js   (template v1)
   Appearance controls: palette picker + light/dark, persisted to localStorage,
   propagated across pages via ?palette=&mode= URL params (file:// has per-file
   storage). Broadcasts 'dr:themechange' so render.js re-renders mermaid.
   ========================================================================== */
(function () {
  var root = document.documentElement;
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function announce() { document.dispatchEvent(new CustomEvent('dr:themechange')); }

  // ---- palette picker ----
  var picker = document.getElementById('dr-picker');
  function syncPicker() {
    if (!picker) return;
    var cur = root.dataset.palette;
    picker.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.palette === cur));
    });
  }
  if (picker) {
    picker.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        root.dataset.palette = b.dataset.palette;
        save('dr-palette', b.dataset.palette);
        syncPicker();
        announce();
      });
    });
    syncPicker();
  }

  // ---- light / dark ----
  var modeBtn = document.getElementById('dr-mode');
  if (modeBtn) {
    modeBtn.addEventListener('click', function () {
      var next = root.dataset.mode === 'dark' ? 'light' : 'dark';
      root.dataset.mode = next;
      save('dr-mode', next);
      announce();
    });
  }

  // ---- cross-page continuity on file:// ----
  // Each file:// page is its own storage origin, so carry the active choices as
  // URL params on internal links; the next page's inline FOUC guard reads them.
  document.querySelectorAll('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || /^(https?:|#|mailto:|javascript:)/i.test(href)) return;
    a.addEventListener('click', function () {
      try {
        var u = new URL(a.href, location.href);
        u.searchParams.set('palette', root.dataset.palette);
        u.searchParams.set('mode', root.dataset.mode);
        a.setAttribute('href', u.pathname + '?' + u.searchParams.toString() + u.hash);
      } catch (e) {}
    });
  });
})();
