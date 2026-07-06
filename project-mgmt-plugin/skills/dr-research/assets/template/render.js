/* ============================================================================
   dr-research microsite — render.js   (template v2)
   Turns the embedded markdown into the themed document:
   marked -> extract mermaid -> highlight -> auto-pill -> wrap tables
   -> wrap figures -> heading ids -> in-page TOC -> render mermaid
   -> wire click-to-zoom. Re-renders mermaid on theme change.
   Classic script; no fetch, no ES modules (works on file://).
   ========================================================================== */
(function () {
  var DR = (window.DRResearch = window.DRResearch || {});

  // Disable mermaid's auto-run immediately; we render manually from data-src.
  if (window.mermaid) { try { mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' }); } catch (e) {} }

  /* ---------------- definitions (must precede use) ---------------- */

  function prepMermaid(root) {
    // Without the mermaid library (pages that ship no diagrams) the fence stays
    // visible as a plain code block instead of silently disappearing.
    if (!root || !window.mermaid) return;
    root.querySelectorAll('pre > code.language-mermaid').forEach(function (code) {
      var div = document.createElement('div');
      div.className = 'mermaid';
      div.setAttribute('data-src', code.textContent);
      var pre = code.parentNode;
      pre.parentNode.replaceChild(div, pre);
    });
  }

  function autoPill(root) {
    if (!root) return;
    root.querySelectorAll('table').forEach(function (t) {
      var heads = Array.prototype.map.call(t.querySelectorAll('thead th'), function (h) {
        return h.textContent.trim().toLowerCase();
      });
      var idx = heads.indexOf('confidence');
      if (idx < 0) idx = heads.indexOf('priority');
      if (idx < 0) idx = heads.indexOf('verdict');
      if (idx < 0) return;
      t.querySelectorAll('tbody tr').forEach(function (tr) {
        var cell = tr.children[idx];
        if (!cell || cell.querySelector('.pill')) return;
        var v = cell.textContent.trim();
        if (!v) return;
        var cls = /med|single|estimat/i.test(v) ? ' med' : /low|unverified|contested/i.test(v) ? ' low' : '';
        cell.innerHTML = '<span class="pill' + cls + '">' + v + '</span>';
      });
    });
  }

  function wrapTables(root) {
    // Scroll-safe wrapper for every table; tables whose natural (unwrapped)
    // width wants more room than the prose column get flagged so the
    // "Breakout" width mode can widen them (see styles.css .tablewrap.breakout).
    if (!root) return;
    root.querySelectorAll('table').forEach(function (t) {
      if (t.parentElement && t.parentElement.classList.contains('tablewrap')) return;
      var w = document.createElement('div');
      w.className = 'tablewrap';
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });
    requestAnimationFrame(function () {
      root.querySelectorAll('.tablewrap').forEach(function (w) {
        var t = w.querySelector('table');
        if (!t) return;
        var prev = t.style.width;
        t.style.width = 'max-content';
        var natural = t.getBoundingClientRect().width;
        t.style.width = prev;
        w.classList.toggle('breakout', natural > 900);
      });
    });
  }

  function wrapFigures(root) {
    if (!root) return;
    // frame standalone mermaid diagrams (custom SVGs are already authored inside <figure>)
    root.querySelectorAll('.mermaid').forEach(function (el) {
      if (el.closest('figure')) return;
      var fig = document.createElement('figure'); fig.className = 'zoomable';
      var frame = document.createElement('div'); frame.className = 'frame';
      el.parentNode.insertBefore(fig, el);
      frame.appendChild(el);
      fig.appendChild(frame);
    });
    // any figure that contains (or will contain) a diagram is zoomable
    root.querySelectorAll('figure').forEach(function (f) {
      if ((f.querySelector('svg') || f.querySelector('.mermaid')) && !f.classList.contains('zoomable')) {
        f.classList.add('zoomable');
      }
    });
  }

  function rewriteMdLinks(root) {
    // Canonical markdown links to sibling .md files; the HTML view navigates
    // between the generated .html pairs instead.
    if (!root) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^(https?:|mailto:|javascript:|#)/i.test(href)) return;
      a.setAttribute('href', href.replace(/\.md(?=$|#|\?)/i, '.html'));
    });
  }

  function slugify(text) {
    return String(text).toLowerCase().replace(/[^\w\s-]/g, '').trim()
      .replace(/\s+/g, '-').slice(0, 80) || 'section';
  }

  function addHeadingIds(root) {
    if (!root) return;
    var seen = {};
    root.querySelectorAll('h2, h3, h4').forEach(function (h) {
      if (h.id) { seen[h.id] = true; return; }
      var base = slugify(h.textContent), id = base, n = 2;
      while (seen[id]) { id = base + '-' + (n++); }
      seen[id] = true;
      h.id = id;
    });
  }

  function buildToc(root) {
    if (!root || root.querySelectorAll('h2').length < 3) return;
    var nav = document.createElement('nav');
    nav.id = 'toc';
    nav.setAttribute('aria-label', 'Contents');
    var title = document.createElement('p');
    title.className = 'toc-title';
    title.textContent = 'Contents';
    nav.appendChild(title);

    var heads = Array.prototype.slice.call(root.querySelectorAll('h2, h3'));
    heads.forEach(function (h) {
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      if (h.tagName === 'H3') a.className = 'h3';
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    nav.classList.add('ready');

    // scroll-spy: mark the section whose heading was last scrolled past
    var links = nav.querySelectorAll('a');
    var ticking = false;
    function spy() {
      ticking = false;
      var cur = -1;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top <= 96) cur = i; else break;
      }
      links.forEach(function (l, i) { l.classList.toggle('active', i === cur); });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(spy); }
    }, { passive: true });
    spy();
  }

  DR.mermaidThemeVars = function () {
    var cs = getComputedStyle(document.documentElement);
    function g(n) { return (cs.getPropertyValue(n) || '').trim(); }
    return {
      background: g('--surface'),
      primaryColor: g('--accent-soft'),
      primaryBorderColor: g('--accent'),
      primaryTextColor: g('--fg'),
      secondaryColor: g('--surface-2'),
      tertiaryColor: g('--bg'),
      lineColor: g('--edge'),
      textColor: g('--fg'),
      noteBkgColor: g('--accent-soft'),
      noteTextColor: g('--fg'),
      fontFamily: g('--sans') || 'system-ui, sans-serif'
    };
  };

  var mmCounter = 0;
  DR.renderMermaid = function () {
    if (!window.mermaid) return;
    var nodes = document.querySelectorAll('.mermaid[data-src]');
    if (!nodes.length) return;
    try {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'base', themeVariables: DR.mermaidThemeVars() });
    } catch (e) {}
    nodes.forEach(function (el) {
      var src = el.getAttribute('data-src');
      mermaid.render('drm_' + (mmCounter++), src).then(function (res) {
        el.innerHTML = res.svg;
      }).catch(function () {
        el.innerHTML = '<div style="color:var(--muted);font-family:var(--mono);font-size:12px">diagram failed to render</div>';
      });
    });
  };

  function setupZoom() {
    var overlay = document.getElementById('zoom');
    var stage = overlay ? overlay.querySelector('.stage') : null;
    if (!overlay || !stage) return;
    function close() { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); stage.innerHTML = ''; }
    document.addEventListener('click', function (e) {
      var fig = e.target.closest && e.target.closest('figure.zoomable');
      if (!fig) return;
      var svg = fig.querySelector('svg');
      if (!svg) return;
      stage.innerHTML = '';
      stage.appendChild(svg.cloneNode(true));
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    });
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('dr:themechange', function () { if (overlay.classList.contains('open')) close(); });
  }

  /* ---------------- execute ---------------- */

  var srcEl = document.getElementById('dr-content-src');
  var out = document.getElementById('content');

  if (srcEl && out && window.marked) {
    try { marked.setOptions({ gfm: true }); } catch (e) {}
    out.innerHTML = marked.parse(srcEl.textContent || '');
  }
  prepMermaid(out);
  if (window.hljs && out) {
    out.querySelectorAll('pre code').forEach(function (b) {
      if (b.classList.contains('language-mermaid')) return; // fallback source block, leave plain
      try { hljs.highlightElement(b); } catch (e) {}
    });
  }
  autoPill(out);
  wrapTables(out);
  wrapFigures(out);
  rewriteMdLinks(out);
  addHeadingIds(out);
  buildToc(out);
  DR.renderMermaid();
  setupZoom();

  document.addEventListener('dr:themechange', function () { DR.renderMermaid(); });
})();
