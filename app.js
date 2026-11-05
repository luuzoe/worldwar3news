// World War 3 News v2 - front end. Data comes only from news.json, which the
// collector rebuilds hourly from public RSS feeds. Nothing is invented here.
(function () {
  var savedStore = [];
  try { savedStore = JSON.parse(localStorage.getItem("ww3saved") || "[]"); } catch (e) { savedStore = []; }
  var state = { data: null, cat: "", country: "", q: "", newsLang: "", day: "", shown: 24, lang: "my", pending: null, view: "all", warOnly: false };
  function isSaved(link) { return savedStore.indexOf(link) !== -1; }
  function persistSaved() { try { localStorage.setItem("ww3saved", JSON.stringify(savedStore)); } catch (e) {} }
  var CONFLICT = ["Ukraine / Russia", "Middle East", "Asia-Pacific", "Europe / NATO"];

  var I18N = {
    my: {
      tagline: "နိုင်ငံတကာသတင်း • ၂၄ နာရီ အပ်ဒိတ်",
      breaking: "🔴 နောက်ဆုံးရ",
      statStories: "သတင်းများ",
      statMy: "မြန်မာလို သတင်း",
      statCountries: "နိုင်ငံများ",
      statUpdated: "နောက်ဆုံးအပ်ဒိတ်",
      byCountry: "နိုင်ငံအလိုက်",
      moreFilters: "🔽 စစ်ထုတ်မှု ပိုမို — နိုင်ငံ၊ ဘာသာ၊ ရက်စွဲ",
      loadMore: "နောက်ထပ် သတင်းများ ပြပါ",
      empty: "ဒီစစ်ထုတ်မှုနဲ့ ကိုက်ညီတဲ့ သတင်း မရှိသေးပါ။ စစ်ထုတ်မှုကို ဖြုတ်ကြည့်ပါ။",
      disclaimer: "⚠️ မှတ်ချက် — တတိယကမ္ဘာစစ် မစသေးပါ။ ဒီ site က ကမ္ဘာ့ တင်းမာမှုတွေ၊ စစ်ပွဲတွေနဲ့ နိုင်ငံတကာသတင်းတွေကို စုစည်းပြတာပါ။ ခေါင်းစဉ်တိုင်းက မူရင်းသတင်းဌာနက ဖြစ်ပြီး၊ အပြည့်အစုံ ဖတ်ဖို့ မူရင်းလင့်ခ်ကို နှိပ်ပါ။ သတင်းကို ကိုယ်တိုင် မဖန်တီးပါ။ မြန်မာလို သတင်းတွေက BBC မြန်မာရဲ့ မူရင်းမြန်မာ သတင်းတွေပါ။",
      autoUpdate: "နာရီတိုင်း အလိုအလျောက် အပ်ဒိတ်",
      all: "အားလုံး",
      featured: "အထူးသတင်း",
      readFull: "အပြည့်အစုံ ဖတ်ရန် →",
      results: "သတင်း",
      found: "ခု တွေ့သည်",
      searchPh: "သတင်းရှာပါ… ဥပမာ Ukraine, Iran, China",
      newStories: "သတင်းအသစ် ရောက်ပြီ",
      showNew: "အသစ်တွေ ပြပါ",
      share: "မျှဝေရန်",
      copied: "ကူးပြီးပြီ ✓",
      translate: "မြန်မာလို ဖတ်ရန်",
      today: "ဒီနေ့",
      tapHome: "ပင်မ",
      warOnly: "⚔️ စစ်ပွဲ",
      tapLatest: "အသစ်",
      tapMy: "မြန်မာ",
      tapCountries: "နိုင်ငံ",
      tapSearch: "ရှာရန်",
      tapSaved: "သိမ်းထား",
      save: "★ သိမ်းရန်",
      savedLabel: "★ သိမ်းပြီး ✓",
      savedEmpty: "သိမ်းထားတဲ့ သတင်း မရှိသေးပါ — card မှာ ★ နှိပ်ပြီး သိမ်းပါ။",
      yesterday: "မနေ့က",
      allDays: "ရက်အားလုံး",
      burmeseNews: "မြန်မာလို",
      englishNews: "English"
    },
    en: {
      tagline: "World news • Updated 24 hours",
      breaking: "🔴 BREAKING",
      statStories: "stories",
      statMy: "Burmese stories",
      statCountries: "countries",
      statUpdated: "last updated",
      byCountry: "By country",
      moreFilters: "🔽 More filters — country, language, date",
      loadMore: "Show more stories",
      empty: "No stories match these filters. Try clearing a filter.",
      disclaimer: "⚠️ Note — World War III has not started. This site collects world tensions, conflicts and international news. Every headline comes from its original news outlet; tap it to read the full story. Nothing here is invented. Burmese stories are original BBC Burmese reporting.",
      autoUpdate: "Auto-updated every hour",
      all: "All",
      featured: "Featured",
      readFull: "Read full story →",
      results: "stories",
      found: "found",
      searchPh: "Search news… e.g. Ukraine, Iran, China",
      newStories: "New stories arrived",
      showNew: "Show new",
      share: "Share",
      copied: "Copied ✓",
      translate: "Read in Burmese",
      today: "Today",
      tapHome: "Home",
      warOnly: "⚔️ War",
      tapLatest: "Latest",
      tapMy: "Burmese",
      tapCountries: "Countries",
      tapSearch: "Search",
      tapSaved: "Saved",
      save: "★ Save",
      savedLabel: "★ Saved ✓",
      savedEmpty: "No saved stories yet — tap ★ on a card to save one.",
      yesterday: "Yesterday",
      allDays: "All days",
      burmeseNews: "Burmese",
      englishNews: "English"
    }
  };

  function t(key) {
    return I18N[state.lang][key] || key;
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function articleUrl(it) {
    return "article.html?link=" + encodeURIComponent(it.link) + "&t=" + encodeURIComponent(it.title);
  }

  function minsAgo(iso) {
    if (!iso) return null;
    return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  }

  function timeAgo(iso) {
    var mins = minsAgo(iso);
    if (mins === null) return "";
    if (state.lang === "my") {
      if (mins < 60) return mins + " မိနစ်က";
      if (mins < 1440) return Math.floor(mins / 60) + " နာရီက";
      return Math.floor(mins / 1440) + " ရက်က";
    }
    if (mins < 60) return mins + " min ago";
    if (mins < 1440) return Math.floor(mins / 60) + "h ago";
    return Math.floor(mins / 1440) + "d ago";
  }

  function yangonDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Yangon" });
    } catch (e) {
      return (iso || "").slice(0, 10);
    }
  }

  function yangonToday() {
    var shifted = new Date(Date.now() + 6.5 * 3600 * 1000);
    return shifted.toISOString().slice(0, 10);
  }

  function yangonYesterday() {
    var shifted = new Date(Date.now() + 6.5 * 3600 * 1000 - 24 * 3600 * 1000);
    return shifted.toISOString().slice(0, 10);
  }

  function fmtYangon(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Yangon", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return iso.slice(0, 16).replace("T", " ");
    }
  }

  function isNew(iso) {
    var m = minsAgo(iso);
    return m !== null && m < 120;
  }

  function newBadge(iso) {
    return isNew(iso) ? ' <span class="badge new">' + (state.lang === "my" ? "အသစ်" : "NEW") + "</span>" : "";
  }

  function langTag(it) {
    return it.lang === "my" ? '<span class="tag lang-my">မြန်မာ</span>' : "";
  }

  function translateUrl(link) {
    // In-site Burmese reading: open the article page with ?my=1 (no external tab)
    return "article.html?link=" + encodeURIComponent(link) + "&my=1";
  }

  function applyLang() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.getElementById("search").placeholder = t("searchPh");
    document.getElementById("langBtn").textContent = state.lang === "my" ? "EN" : "မြန်မာ";
    document.documentElement.lang = state.lang === "my" ? "my" : "en";
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return state.data.items.filter(function (it) {
      if (state.view === "saved" && !isSaved(it.link)) return false;
      if (state.warOnly && !it.is_war) return false;
      if (state.cat && it.category !== state.cat) return false;
      if (state.country && (it.countries || []).indexOf(state.country) === -1) return false;
      if (state.newsLang && (it.lang || "en") !== state.newsLang) return false;
      if (state.day) {
        var want = state.day === "today" ? yangonToday() : yangonYesterday();
        if (yangonDate(it.published) !== want) return false;
      }
      if (q) {
        var hay = (it.title + " " + (it.summary || "") + " " + it.source).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function hasFilter() {
    return !!(state.cat || state.country || state.q || state.newsLang || state.day || state.view === "saved" || state.warOnly);
  }

  function metaLine(it) {
    return "<b>" + esc(it.source) + "</b> • " + timeAgo(it.published) + " • " + fmtYangon(it.published) + " Yangon";
  }

  function render() {
    var data = state.data;
    var list = filtered();
    var heroItem = null;
    var rest = list;
    if (!hasFilter()) {
      heroItem = list.find(function (it) { return CONFLICT.indexOf(it.category) !== -1; }) || list[0];
      if (heroItem) rest = list.filter(function (it) { return it !== heroItem; });
    }
    var hero = document.getElementById("hero");
    if (heroItem) {
      hero.style.display = "";
      hero.innerHTML =
        '<div class="hero-img">' + (heroItem.image ? '<img src="' + esc(heroItem.image) + '" alt="" loading="lazy">' : '<div class="hero-fallback">WORLD WAR 3<br>NEWS</div>') + '</div>' +
        '<div class="hero-body"><span><span class="badge">' + t("featured") + " • " + esc(heroItem.category) + "</span>" + newBadge(heroItem.published) + "</span>" +
        '<h2><a href="' + esc(articleUrl(heroItem)) + '">' + esc(heroItem.title) + "</a></h2>" +
        "<p>" + esc(heroItem.summary || "") + "</p>" +
        '<div class="meta">' + metaLine(heroItem) + "</div>" +
        '<a class="read-btn" href="' + esc(articleUrl(heroItem)) + '">' + t("readFull") + "</a></div>";
    } else {
      hero.style.display = "none";
    }
    // Clean UI: no separate top-stories row in v6 - hero + grid only.
    var grid = document.getElementById("grid");
    var show = rest.slice(0, state.shown);
    grid.innerHTML = show.map(function (it) {
      var tags = '<span class="tag">' + esc(it.category) + "</span>" + langTag(it) +
        (it.countries || []).map(function (c) { return '<span class="tag country">' + esc(c) + "</span>"; }).join("");
      var thumb = it.image
        ? '<div class="card-img"><img src="' + esc(it.image) + '" alt="" loading="lazy"></div>'
        : "";
      var actions = '<button class="mini-btn' + (isSaved(it.link) ? " saved" : "") + '" type="button" data-save="' + esc(it.link) + '">' + (isSaved(it.link) ? t("savedLabel") : t("save")) + "</button>" +
        '<button class="mini-btn" type="button" data-share="' + esc(articleUrl(it)) + '" data-title="' + esc(it.title) + '">↗ ' + t("share") + "</button>";
      if (it.lang !== "my") {
        actions += '<a class="mini-btn" href="' + esc(translateUrl(it.link)) + '">' + t("translate") + "</a>";
      }
      return '<article class="card">' + thumb +
        '<div class="card-body"><div class="tag-row">' + tags + "</div>" +
        '<h3><a href="' + esc(articleUrl(it)) + '">' + esc(it.title) + "</a></h3>" +
        "<p>" + esc(it.summary || "") + "</p>" +
        '<div class="meta">' + metaLine(it) + "</div>" +
        '<div class="card-actions">' + actions + "</div></div></article>";
    }).join("");
    document.getElementById("empty").hidden = list.length !== 0;
    document.getElementById("resultLine").textContent =
      list.length + " " + t("results") + " " + t("found") +
      (state.country ? " • " + state.country : "") +
      (state.cat ? " • " + state.cat : "") +
      (state.newsLang === "my" ? " • " + t("burmeseNews") : state.newsLang === "en" ? " • English" : "") +
      (state.day === "today" ? " • " + t("today") : state.day === "yesterday" ? " • " + t("yesterday") : "") +
      (state.warOnly ? " • " + t("warOnly") : "");
    var more = document.getElementById("moreBtn");
    more.disabled = rest.length <= state.shown;
    more.style.display = rest.length > 24 ? "" : "none";
    document.getElementById("statCount").textContent = data.count;
    document.getElementById("statMy").textContent = (data.languages && data.languages.my) || 0;
    document.getElementById("statCountries").textContent = data.countries.length;
    document.getElementById("statUpdated").textContent = data.updated_yangon || "—";
    document.getElementById("sourceList").textContent = "Sources: " + data.sources.join(" • ");
    var sc = document.getElementById("savedCount");
    if (sc) { sc.hidden = savedStore.length === 0; sc.textContent = savedStore.length; }
    if (state.view === "saved" && savedStore.length === 0) {
      document.getElementById("empty").textContent = t("savedEmpty");
    }
    var tapName = "home";
    if (state.view === "saved") tapName = "saved";
    else if (state.country) tapName = "countries";
    else if (state.newsLang === "my") tapName = "my";
    else if (state.day === "today") tapName = "latest";
    document.querySelectorAll("[data-tap]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tap") === tapName);
    });
  }

  function pill(label, active, attr, val) {
    return '<button class="chip' + (active ? " active" : "") + '" data-' + attr + '="' + esc(val) + '">' + label + "</button>";
  }

  function renderChips() {
    var data = state.data;
    var catEl = document.getElementById("catChips");
    catEl.innerHTML = '<button class="chip' + (state.warOnly ? " active" : "") + '" id="warChipBtn">' + t("warOnly") + "</button>" +
      pill(t("all"), !state.cat, "cat", "") +
      data.categories.map(function (c) { return pill(esc(c), state.cat === c, "cat", c); }).join("");
    catEl.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.id === "warChipBtn") {
          state.warOnly = !state.warOnly;
        } else {
          state.cat = b.getAttribute("data-cat");
        }
        state.shown = 24;
        renderChips();
        render();
      });
    });
    var sel = document.getElementById("countrySelect");
    sel.innerHTML = '<option value="">🌍 ' + (state.lang === "my" ? "နိုင်ငံအားလုံး" : "All countries") + "</option>" +
      data.countries.map(function (pair) {
        return '<option value="' + esc(pair[0]) + '"' + (state.country === pair[0] ? " selected" : "") + ">" + esc(pair[0]) + " (" + pair[1] + ")</option>";
      }).join("");
    var cEl = document.getElementById("countryChips");
    if (cEl) {
      cEl.innerHTML = pill(t("all"), !state.country, "country", "") +
        data.countries.slice(0, 8).map(function (pair) {
          return pill(esc(pair[0]) + " (" + pair[1] + ")", state.country === pair[0], "country", pair[0]);
        }).join("");
      cEl.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          state.country = b.getAttribute("data-country");
          sel.value = state.country;
          state.shown = 24;
          renderChips();
          render();
        });
      });
    }
    var langEl = document.getElementById("langPills");
    langEl.innerHTML = pill(t("all"), !state.newsLang, "nlang", "") +
      pill(t("burmeseNews"), state.newsLang === "my", "nlang", "my") +
      pill(t("englishNews"), state.newsLang === "en", "nlang", "en");
    langEl.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.newsLang = b.getAttribute("data-nlang");
        state.shown = 24;
        renderChips();
        render();
      });
    });
    var dayEl = document.getElementById("dayPills");
    dayEl.innerHTML = pill(t("allDays"), !state.day, "day", "") +
      pill(t("today"), state.day === "today", "day", "today") +
      pill(t("yesterday"), state.day === "yesterday", "day", "yesterday");
    dayEl.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.day = b.getAttribute("data-day");
        state.shown = 24;
        renderChips();
        render();
      });
    });
  }

  function setTicker() {
    var heads = state.data.items.slice(0, 8).map(function (it) { return "<span>• " + esc(it.title) + "</span>"; }).join("");
    document.getElementById("tickerMove").innerHTML = heads + heads;
  }

  function tickClock() {
    try {
      document.getElementById("clock").textContent =
        new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Yangon", hour: "2-digit", minute: "2-digit" }) + " Yangon";
    } catch (e) {
      document.getElementById("clock").textContent = "";
    }
  }

  function bindOnce() {
    document.getElementById("search").addEventListener("input", function (e) {
      state.q = e.target.value;
      state.shown = 24;
      render();
    });
    document.getElementById("countrySelect").addEventListener("change", function (e) {
      state.country = e.target.value;
      state.shown = 24;
      renderChips();
      render();
    });
    document.getElementById("moreBtn").addEventListener("click", function () {
      state.shown += 24;
      render();
    });
    document.getElementById("langBtn").addEventListener("click", function () {
      state.lang = state.lang === "my" ? "en" : "my";
      applyLang();
      renderChips();
      render();
    });
    document.getElementById("grid").addEventListener("click", function (e) {
      var saveBtn = e.target.closest("[data-save]");
      if (saveBtn) {
        var slink = saveBtn.getAttribute("data-save");
        var idx = savedStore.indexOf(slink);
        if (idx === -1) savedStore.push(slink); else savedStore.splice(idx, 1);
        persistSaved();
        render();
        return;
      }
      var btn = e.target.closest("[data-share]");
      if (!btn) return;
      var link = btn.getAttribute("data-share");
      try { link = new URL(link, location.href).href; } catch (e) {}
      var title = btn.getAttribute("data-title") || "";
      if (navigator.share) {
        navigator.share({ title: title, url: link }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(function () {
          var old = btn.textContent;
          btn.textContent = t("copied");
          setTimeout(function () { btn.textContent = old; }, 1500);
        });
      }
    });
    var toastClose = document.getElementById("toastClose");
    if (toastClose) toastClose.addEventListener("click", function () { document.getElementById("toast").hidden = true; });
    document.getElementById("toastBtn").addEventListener("click", function () {
      function applyFresh(fresh) {
        state.data = fresh;
        state.pending = null;
        document.getElementById("toast").hidden = true;
        setTicker();
        renderChips();
        render();
      }
      if (state.pending) { applyFresh(state.pending); return; }
      fetch("news.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (fresh) {
        if (fresh.updated !== state.data.updated) applyFresh(fresh);
        else document.getElementById("toast").hidden = true;
      }).catch(function () { document.getElementById("toast").hidden = true; });
    });
    document.querySelectorAll("[data-tap]").forEach(function (b) {
      b.addEventListener("click", function () {
        var kind = b.getAttribute("data-tap");
        var searchEl = document.getElementById("search");
        if (kind === "home") {
          state.view = "all"; state.cat = ""; state.country = ""; state.newsLang = ""; state.day = ""; state.warOnly = false; state.q = ""; searchEl.value = ""; state.shown = 24;
          renderChips(); render(); window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (kind === "latest") {
          state.view = "all"; state.cat = ""; state.country = ""; state.newsLang = ""; state.day = "today"; state.warOnly = false; state.q = ""; searchEl.value = ""; state.shown = 24;
          renderChips(); render(); window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (kind === "my") {
          state.view = "all"; state.newsLang = "my"; state.shown = 24;
          renderChips(); render(); document.getElementById("grid").scrollIntoView({ behavior: "smooth" });
        } else if (kind === "countries") {
          state.view = "all";
          var adv = document.querySelector(".adv-filters"); if (adv) adv.open = true;
          if (adv) adv.scrollIntoView({ behavior: "smooth", block: "start" });
          render();
        } else if (kind === "saved") {
          state.view = "saved"; state.shown = 24;
          render(); document.getElementById("grid").scrollIntoView({ behavior: "smooth" });
        }
      });
    });
    var toTop = document.getElementById("toTop");
    window.addEventListener("scroll", function () {
      if (window.scrollY > 600) toTop.classList.add("show"); else toTop.classList.remove("show");
    });
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    setInterval(function () {
      fetch("news.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (fresh) {
        if (fresh.updated && state.data && fresh.updated !== state.data.updated) {
          state.pending = fresh;
          document.getElementById("toast").hidden = false;
        }
      }).catch(function () {});
    }, 600000);
  }

  fetch("news.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (data) {
    state.data = data;
    applyLang();
    setTicker();
    renderChips();
    render();
    bindOnce();
    tickClock();
    setInterval(tickClock, 30000);
  }).catch(function () {
    document.getElementById("grid").innerHTML = "<p>News could not load. Please refresh.</p>";
  });
})();
