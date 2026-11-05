// World War 3 News - front end. Data comes only from news.json, which the
// collector rebuilds hourly from public RSS feeds. Nothing is invented here.
(function () {
  var state = { data: null, cat: "", country: "", q: "", shown: 24, lang: "my" };
  var CONFLICT = ["Ukraine / Russia", "Middle East", "Asia-Pacific", "Europe / NATO"];

  var I18N = {
    my: {
      tagline: "နိုင်ငံတကာသတင်း • ၂၄ နာရီ အပ်ဒိတ်",
      breaking: "🔴 နောက်ဆုံးရ",
      statStories: "သတင်းများ",
      statCountries: "နိုင်ငံများ",
      statSources: "သတင်းဌာနများ",
      statUpdated: "နောက်ဆုံးအပ်ဒိတ်",
      byCountry: "နိုင်ငံအလိုက်",
      loadMore: "နောက်ထပ် သတင်းများ ပြပါ",
      empty: "ဒီစစ်ထုတ်မှုနဲ့ ကိုက်ညီတဲ့ သတင်း မရှိသေးပါ။ စစ်ထုတ်မှုကို ဖြုတ်ကြည့်ပါ။",
      disclaimer: "⚠️ မှတ်ချက် — တတိယကမ္ဘာစစ် မစသေးပါ။ ဒီ site က ကမ္ဘာ့ တင်းမာမှုတွေ၊ စစ်ပွဲတွေနဲ့ နိုင်ငံတကာသတင်းတွေကို စုစည်းပြတာပါ။ ခေါင်းစဉ်တိုင်းက မူရင်းသတင်းဌာနက ဖြစ်ပြီး၊ အပြည့်အစုံ ဖတ်ဖို့ မူရင်းလင့်ခ်ကို နှိပ်ပါ။ သတင်းကို ကိုယ်တိုင် မဖန်တီးပါ။",
      autoUpdate: "နာရီတိုင်း အလိုအလျောက် အပ်ဒိတ်",
      all: "အားလုံး",
      featured: "အထူးသတင်း",
      readFull: "အပြည့်အစုံ ဖတ်ရန် →",
      results: "သတင်း",
      found: "ခု တွေ့သည်",
      searchPh: "သတင်းရှာပါ… ဥပမာ Ukraine, Iran, China"
    },
    en: {
      tagline: "World news • Updated 24 hours",
      breaking: "🔴 BREAKING",
      statStories: "stories",
      statCountries: "countries",
      statSources: "sources",
      statUpdated: "last updated",
      byCountry: "By country",
      loadMore: "Show more stories",
      empty: "No stories match these filters. Try clearing a filter.",
      disclaimer: "⚠️ Note — World War III has not started. This site collects world tensions, conflicts and international news. Every headline comes from its original news outlet; tap it to read the full story. Nothing here is invented.",
      autoUpdate: "Auto-updated every hour",
      all: "All",
      featured: "Featured",
      readFull: "Read full story →",
      results: "stories",
      found: "found",
      searchPh: "Search news… e.g. Ukraine, Iran, China"
    }
  };

  function t(key) {
    return I18N[state.lang][key] || key;
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function timeAgo(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
    if (mins < 60) return mins + " min ago";
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.floor(hrs / 24) + "d ago";
  }

  function fmtYangon(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Yangon", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return iso.slice(0, 16).replace("T", " ");
    }
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
      if (state.cat && it.category !== state.cat) return false;
      if (state.country && (it.countries || []).indexOf(state.country) === -1) return false;
      if (q) {
        var hay = (it.title + " " + (it.summary || "") + " " + it.source).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function render() {
    var data = state.data;
    var list = filtered();
    var heroItem = null;
    var rest = list;
    if (!state.cat && !state.country && !state.q) {
      heroItem = list.find(function (it) { return CONFLICT.indexOf(it.category) !== -1; }) || list[0];
      if (heroItem) rest = list.filter(function (it) { return it !== heroItem; });
    }
    var hero = document.getElementById("hero");
    if (heroItem) {
      hero.style.display = "";
      hero.innerHTML =
        '<div class="hero-img">' + (heroItem.image ? '<img src="' + esc(heroItem.image) + '" alt="" loading="lazy">' : '<div class="hero-fallback">WORLD WAR 3<br>NEWS</div>') + '</div>' +
        '<div class="hero-body"><span class="badge">' + t("featured") + " • " + esc(heroItem.category) + "</span>" +
        '<h2><a href="' + esc(heroItem.link) + '" target="_blank" rel="noopener">' + esc(heroItem.title) + "</a></h2>" +
        "<p>" + esc(heroItem.summary || "") + "</p>" +
        '<div class="meta"><b>' + esc(heroItem.source) + "</b> • " + timeAgo(heroItem.published) + " • " + fmtYangon(heroItem.published) + " Yangon</div>" +
        '<a class="read-btn" href="' + esc(heroItem.link) + '" target="_blank" rel="noopener">' + t("readFull") + "</a></div>";
    } else {
      hero.style.display = "none";
    }
    var grid = document.getElementById("grid");
    var show = rest.slice(0, state.shown);
    grid.innerHTML = show.map(function (it) {
      var tags = '<span class="tag">' + esc(it.category) + "</span>" +
        (it.countries || []).map(function (c) { return '<span class="tag country">' + esc(c) + "</span>"; }).join("");
      var thumb = it.image
        ? '<div class="card-img"><img src="' + esc(it.image) + '" alt="" loading="lazy"></div>'
        : '<div class="card-img">' + esc(it.category) + "</div>";
      return '<article class="card">' + thumb +
        '<div class="card-body"><div class="tag-row">' + tags + "</div>" +
        '<h3><a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + esc(it.title) + "</a></h3>" +
        "<p>" + esc(it.summary || "") + "</p>" +
        '<div class="meta"><b>' + esc(it.source) + "</b> • " + timeAgo(it.published) + " • " + fmtYangon(it.published) + "</div></div></article>";
    }).join("");
    document.getElementById("empty").hidden = list.length !== 0;
    document.getElementById("resultLine").textContent =
      list.length + " " + t("results") + " " + t("found") +
      (state.country ? " • " + state.country : "") +
      (state.cat ? " • " + state.cat : "");
    var more = document.getElementById("moreBtn");
    more.disabled = rest.length <= state.shown;
    more.style.display = rest.length > 24 ? "" : "none";
    document.getElementById("statCount").textContent = data.count;
    document.getElementById("statCountries").textContent = data.countries.length;
    document.getElementById("statSources").textContent = data.sources.length;
    document.getElementById("statUpdated").textContent = data.updated_yangon || "—";
    document.getElementById("sourceList").textContent = "Sources: " + data.sources.join(" • ");
  }

  function renderChips() {
    var data = state.data;
    var catEl = document.getElementById("catChips");
    var cats = [""].concat(data.categories);
    catEl.innerHTML = cats.map(function (c) {
      return '<button class="chip' + (state.cat === c ? " active" : "") + '" data-cat="' + esc(c) + '">' + (c || t("all")) + "</button>";
    }).join("");
    catEl.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.cat = b.getAttribute("data-cat");
        state.shown = 24;
        renderChips();
        render();
      });
    });
    var sel = document.getElementById("countrySelect");
    var keep = sel.value;
    sel.innerHTML = '<option value="">🌍 ' + (state.lang === "my" ? "နိုင်ငံအားလုံး" : "All countries") + "</option>" +
      data.countries.map(function (pair) {
        return '<option value="' + esc(pair[0]) + '"' + (state.country === pair[0] ? " selected" : "") + ">" + esc(pair[0]) + " (" + pair[1] + ")</option>";
      }).join("");
    if (keep && !state.country) sel.value = keep;
    var top = data.countries.slice(0, 8);
    var cEl = document.getElementById("countryChips");
    cEl.innerHTML = '<button class="chip' + (!state.country ? " active" : "") + '" data-country="">' + t("all") + "</button>" +
      top.map(function (pair) {
        return '<button class="chip' + (state.country === pair[0] ? " active" : "") + '" data-country="' + esc(pair[0]) + '">' + esc(pair[0]) + " (" + pair[1] + ")</button>";
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

  function tickClock() {
    try {
      document.getElementById("clock").textContent =
        new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Yangon", hour: "2-digit", minute: "2-digit" }) + " Yangon";
    } catch (e) {
      document.getElementById("clock").textContent = "";
    }
  }

  fetch("news.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (data) {
    state.data = data;
    var tick = document.getElementById("tickerMove");
    var heads = data.items.slice(0, 8).map(function (it) { return "<span>• " + esc(it.title) + "</span>"; }).join("");
    tick.innerHTML = heads + heads;
    applyLang();
    renderChips();
    render();
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
    tickClock();
    setInterval(tickClock, 30000);
  }).catch(function () {
    document.getElementById("grid").innerHTML = "<p>News could not load. Please refresh.</p>";
  });
})();
