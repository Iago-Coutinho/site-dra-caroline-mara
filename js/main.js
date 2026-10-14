/* Dra. Caroline Mara - interacoes do site (sem dependencias) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Analytics (desligado ate definir o provedor) ----------
     Quando o provedor for escolhido, basta implementar window.track.
     Ex.: GA4 -> gtag("event", name, params)
          Plausible -> plausible(name, { props: params })
          Cloudflare -> ja conta visitas; eventos opcionais via Zaraz. */
  window.track = window.track || function (name, params) {
    if (window.__ANALYTICS_DEBUG__) console.log("[track]", name, params || {});
  };
  document.querySelectorAll("[data-track]").forEach(function (el) {
    el.addEventListener("click", function () {
      window.track(el.getAttribute("data-track"), { label: el.getAttribute("data-track-label") || "" });
    });
  });

  /* ---------- Header: encolhe e ganha borda ao rolar ---------- */
  var header = document.querySelector(".header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 24); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Reveal no scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Spotlight que segue o cursor nos cards ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---------- Acordeao (procedimentos e FAQ) ---------- */
  document.querySelectorAll(".acc").forEach(function (acc) {
    var single = acc.hasAttribute("data-single");
    acc.querySelectorAll(".acc__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".acc__item");
        var willOpen = !item.classList.contains("is-open");
        if (single) {
          acc.querySelectorAll(".acc__item.is-open").forEach(function (o) {
            o.classList.remove("is-open");
            o.querySelector(".acc__btn").setAttribute("aria-expanded", "false");
          });
        }
        item.classList.toggle("is-open", willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));
      });
    });
  });

  /* ---------- Galeria: filtros + "ver mais" + lightbox ---------- */
  var gallery = document.querySelector(".gallery");
  if (gallery) {
    var items = Array.prototype.slice.call(gallery.querySelectorAll(".gallery__item"));
    var chips = document.querySelectorAll(".chip");
    var moreBtn = document.querySelector("[data-gallery-more]");
    var INITIAL = 9;
    var expanded = false;
    var current = "all";

    /* Layout em colunas montado por script: cada foto vai para a coluna mais baixa,
       na ordem original. Como as primeiras fotos sempre caem no mesmo lugar,
       "ver mais casos" só acrescenta fotos abaixo, sem reembaralhar as que já estavam. */
    var cols = [];
    function colCount() {
      if (window.matchMedia("(max-width: 900px)").matches) return 2;
      return 3;
    }
    function ratio(it) {
      var img = it.querySelector("img");
      var w = parseFloat(img.getAttribute("width")) || 1;
      var h = parseFloat(img.getAttribute("height")) || 1;
      return h / w;
    }
    function layout(visible) {
      var n = colCount();
      if (cols.length !== n) {
        cols.forEach(function (c) { c.remove(); });
        cols = [];
        for (var k = 0; k < n; k++) {
          var c = document.createElement("div");
          c.className = "gallery__col";
          gallery.appendChild(c);
          cols.push(c);
        }
      }
      var heights = cols.map(function () { return 0; });
      visible.forEach(function (it) {
        var best = 0;
        for (var k = 1; k < heights.length; k++) if (heights[k] < heights[best] - 0.01) best = k;
        cols[best].appendChild(it);
        heights[best] += ratio(it) + 0.12; /* 0.12 = legenda e espaçamento */
      });
    }

    function applyFilter() {
      var visible = [];
      var matches = 0;
      items.forEach(function (it) {
        var match = current === "all" || (" " + it.getAttribute("data-cat") + " ").indexOf(" " + current + " ") !== -1;
        if (match) matches += 1;
        var show = match && (expanded || current !== "all" || matches <= INITIAL);
        it.classList.toggle("is-hidden", !show);
        it.classList.remove("is-collapsed");
        if (show) visible.push(it);
      });
      layout(visible);
      if (moreBtn) {
        moreBtn.hidden = current !== "all" || items.length <= INITIAL;
        moreBtn.textContent = expanded ? "Ver menos casos" : "Ver mais casos";
        moreBtn.setAttribute("aria-expanded", String(expanded));
      }
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        current = chip.getAttribute("data-filter");
        applyFilter();
        window.track("gallery_filter", { label: current });
      });
    });
    if (moreBtn) moreBtn.addEventListener("click", function () {
      expanded = !expanded;
      applyFilter();
      if (!expanded) {
        var section = document.getElementById("resultados");
        if (section) section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
    var lastCols = colCount();
    window.addEventListener("resize", function () {
      if (colCount() !== lastCols) { lastCols = colCount(); applyFilter(); }
    });
    applyFilter();

    /* Lightbox */
    var lb = document.getElementById("lightbox");
    if (lb && typeof lb.showModal === "function") {
      var lbImg = lb.querySelector("img");
      var lbCap = lb.querySelector(".lightbox__cap span:first-child");
      var index = 0;

      function visibleItems() {
        return items.filter(function (it) { return !it.classList.contains("is-hidden") && !it.classList.contains("is-collapsed"); });
      }
      function show(i) {
        var vis = visibleItems();
        if (!vis.length) return;
        index = (i + vis.length) % vis.length;
        var it = vis[index];
        var img = it.querySelector("img");
        lbImg.src = it.getAttribute("data-full") || img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = it.getAttribute("data-caption") || "";
      }
      items.forEach(function (it) {
        it.addEventListener("click", function () {
          var vis = visibleItems();
          show(vis.indexOf(it));
          lb.showModal();
          window.track("gallery_open", { label: it.getAttribute("data-caption") || "" });
        });
      });
      lb.querySelector(".lightbox__btn--prev").addEventListener("click", function () { show(index - 1); });
      lb.querySelector(".lightbox__btn--next").addEventListener("click", function () { show(index + 1); });
      lb.querySelector(".lightbox__close").addEventListener("click", function () { lb.close(); });
      lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
      lb.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") show(index - 1);
        if (e.key === "ArrowRight") show(index + 1);
      });
    }
  }

  /* ---------- Carrossel ---------- */
  document.querySelectorAll(".carousel").forEach(function (c) {
    var track = c.querySelector(".carousel__track");
    var slides = c.querySelectorAll(".carousel__slide");
    var dots = c.querySelectorAll(".carousel__dots span");
    var prev = c.querySelector(".carousel__btn--prev");
    var next = c.querySelector(".carousel__btn--next");
    function idx() { return Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); }
    function update() {
      var i = idx();
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === i); });
      prev.disabled = i <= 0;
      next.disabled = i >= slides.length - 1;
    }
    function go(i) { track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" }); }
    prev.addEventListener("click", function () { go(idx() - 1); });
    next.addEventListener("click", function () { go(idx() + 1); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(idx() + 1); }
    });
    update();
  });

  /* ---------- Ano no rodape ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());
})();
