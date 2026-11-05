// In-site article reader. Shows the feed's full official description
// (the longest excerpt the source itself publishes), plus related stories
// from this site. The full copyrighted article itself is NOT copied here;
// the button at the bottom opens the original outlet for the complete text.
(function () {
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function fmtYangon(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Yangon", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return iso.slice(0, 16).replace("T", " ");
    }
  }

  function timeAgo(iso) {
    if (!iso) return "";
    var mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return mins + " မိနစ်က";
    if (mins < 1440) return Math.floor(mins / 60) + " နာရီက";
    return Math.floor(mins / 1440) + " ရက်က";
  }

  function articleUrl(it) {
    return "article.html?link=" + encodeURIComponent(it.link) + "&t=" + encodeURIComponent(it.title);
  }

  function params() {
    var q = new URLSearchParams(location.search);
    return { link: q.get("link") || "", title: q.get("t") || "" };
  }

  // Dark mode, shared with the home page (localStorage ww3theme)
  (function () {
    var btn = document.getElementById("themeBtn");
    function applyTheme(th) {
      document.documentElement.setAttribute("data-theme", th);
      try { localStorage.setItem("ww3theme", th); } catch (e) {}
      if (btn) btn.textContent = th === "dark" ? "☀️" : "🌙";
    }
    if (btn) btn.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    applyTheme(document.documentElement.getAttribute("data-theme") || "light");
  })();
  var p = params();
  var box = document.getElementById("article");
  var relBox = document.getElementById("related");

  function notFound() {
    box.innerHTML =
      '<a class="back-btn" href="./">← ပင်မစာမျက်နှာ ပြန်သွားရန်</a>' +
      "<h1 class=\"article-title\">" + esc(p.title || "ဒီသတင်း မတွေ့တော့ပါ") + "</h1>" +
      '<p class="article-body">ဒီသတင်းက နောက်ဆုံး အပ်ဒိတ်မှာ ပါတော့မည် (သတင်းအသစ်တွေနဲ့ အစားထိုးသွားလို့ ဖြစ်နိုင်ပါတယ်)။ မူရင်းလင့်ခ်ကနေတော့ ဆက်ဖတ်လို့ရပါသေးတယ်။</p>' +
      (p.link ? '<a class="origin-btn" href="' + esc(p.link) + '" target="_blank" rel="noopener">မူရင်းမှာ ဖတ်ရန် →</a>' : "");
    document.title = "သတင်း မတွေ့ပါ — World War 3 News";
  }

  // ---------- In-site Burmese translation (no external tab) ----------
  // MyMemory first (CORS-friendly), then Google gtx, then Pollinations.
  function translateChunk(text) {
    var q = encodeURIComponent(text);
    return fetch("https://api.mymemory.translated.net/get?q=" + q + "&langpair=en|my-MM")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var out = d && d.responseData && d.responseData.translatedText;
        if (!out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) throw new Error("mymemory");
        return out;
      })
      .catch(function () {
        return fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=my&dt=t&q=" + q)
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var out = (d[0] || []).map(function (part) { return part[0]; }).join("");
            if (!out) throw new Error("gtx");
            return out;
          });
      })
      .catch(function () {
        return fetch("https://text.pollinations.ai/" + encodeURIComponent("Translate the following English news text to Burmese. Output only the Burmese translation, no explanation: " + text))
          .then(function (r) { return r.text(); })
          .then(function (out) { if (!out) throw new Error("poll"); return out.trim(); });
      });
  }
  function translateLong(text) {
    var parts = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
    var chunks = [], cur = "";
    parts.forEach(function (part) {
      if ((cur + part).length > 420 && cur) { chunks.push(cur.trim()); cur = part; }
      else cur += part;
    });
    if (cur.trim()) chunks.push(cur.trim());
    var out = [];
    return chunks.reduce(function (chain, chunk) {
      return chain.then(function () { return translateChunk(chunk); }).then(function (t) { out.push(t); });
    }, Promise.resolve()).then(function () { return out.join(" "); });
  }

  Promise.all([
    fetch("news.json?v=" + Date.now()).then(function (r) { return r.json(); }),
    fetch("archive.json?v=" + Date.now()).then(function (r) { return r.json(); }).catch(function () { return { items: [] }; })
  ]).then(function (results) {
    var data = results[0];
    var archItems = results[1].items || [];
    var it = null;
    if (p.link) {
      for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].link === p.link) { it = data.items[i]; break; }
      }
      if (!it) {
        for (var j = 0; j < archItems.length; j++) {
          if (archItems[j].link === p.link) { it = archItems[j]; break; }
        }
      }
    }
    if (!it) { notFound(); return; }
    document.title = it.title + " — World War 3 News";
    var tags = '<span class="tag">' + esc(it.category) + "</span>" +
      (it.lang === "my" ? '<span class="tag lang-my">မြန်မာ</span>' : "") +
      (it.countries || []).map(function (c) { return '<span class="tag country">' + esc(c) + "</span>"; }).join("");
    var img = it.image ? '<div class="article-img"><img src="' + esc(it.image) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></div>' : "";
    var body = it.body || it.summary || "";
    var paragraphs = body.split(/\n+/).filter(function (x) { return x.trim(); });
    var bodyHtml = paragraphs.length
      ? paragraphs.map(function (para) { return "<p>" + esc(para) + "</p>"; }).join("")
      : "<p>ဒီသတင်းအတွက် အကျဉ်းချုပ် မပါလာပါ။ မူရင်းလင့်ခ်ကနေ ဖတ်ပေးပါ။</p>";
    box.innerHTML =
      '<a class="back-btn" href="./">← သတင်းအားလုံး ပြန်ကြည့်ရန်</a>' +
      '<div class="tag-row">' + tags + "</div>" +
      '<h1 class="article-title">' + esc(it.title) + "</h1>" +
      '<div class="meta"><b><a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + esc(it.source) + "</a></b> • " + timeAgo(it.published) + " • " + fmtYangon(it.published) + " Yangon</div>" +
      img + '<div class="article-body">' + bodyHtml + "</div>" +
      '<div class="note-box">ℹ️ ဒီမှာ ပြထားတာက မူရင်းဌာနက အကျဉ်းချုပ် အပြည့်အစုံပါ။ အပြည့်အစုံ ဖတ်ချင်ရင် မူရင်းလင့်ခ်ကို နှိပ်ပါ။</div>' +
      '<p class="origin-small">ဆောင်းပါး အပြည့်အစုံ: <a href="' + esc(it.link) + '" target="_blank" rel="noopener">မူရင်း လင့်ခ် →</a></p>' +
      '<div class="card-actions" style="margin-top:14px"><button class="mini-btn" type="button" id="saveBtn">★ သိမ်းရန်</button><button class="mini-btn" type="button" id="shareBtn">↗ မျှဝေရန်</button>' +
      (it.lang !== "my" ? '<button class="mini-btn my-toggle" type="button" id="myToggleBtn">မြန်မာလို ဖတ်ရန်</button>' : "") + "</div>";
    var saveBtn = document.getElementById("saveBtn");
    function refreshSaveBtn() {
      if (!saveBtn) return;
      var saved = [];
      try { saved = JSON.parse(localStorage.getItem("ww3saved") || "[]"); } catch (e) {}
      var on = saved.indexOf(it.link) !== -1;
      saveBtn.textContent = on ? "★ သိမ်းပြီး ✓" : "★ သိမ်းရန်";
      saveBtn.classList.toggle("saved", on);
    }
    refreshSaveBtn();
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var saved = [];
        try { saved = JSON.parse(localStorage.getItem("ww3saved") || "[]"); } catch (e) {}
        var idx = saved.indexOf(it.link);
        if (idx === -1) saved.push(it.link); else saved.splice(idx, 1);
        try { localStorage.setItem("ww3saved", JSON.stringify(saved)); } catch (e) {}
        refreshSaveBtn();
      });
    }
    var shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        var url = location.href;
        if (navigator.share) {
          navigator.share({ title: it.title, url: url }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () { shareBtn.textContent = "ကူးပြီးပြီ ✓"; });
        }
      });
    }
    // In-site Burmese toggle (works on the article already rendered above)
    var myBtn = document.getElementById("myToggleBtn");
    if (myBtn) {
      var titleEl = box.querySelector(".article-title");
      var bodyEl = box.querySelector(".article-body");
      var origTitle = titleEl.textContent, origBodyHTML = bodyEl.innerHTML;
      var origParas = Array.prototype.slice.call(bodyEl.querySelectorAll("p")).map(function (pp) { return pp.textContent; });
      var myOn = false, myCache = null, myBusy = false;
      myBtn.addEventListener("click", function () {
        if (myBusy) return;
        if (myOn) {
          titleEl.textContent = origTitle; bodyEl.innerHTML = origBodyHTML;
          myOn = false; myBtn.textContent = "မြန်မာလို ဖတ်ရန်";
          var note = document.getElementById("myNote"); if (note) note.remove();
          return;
        }
        myBusy = true; myBtn.disabled = true; myBtn.textContent = "ဘာသာပြန်နေသည်…";
        var doTranslate = myCache ? Promise.resolve(myCache) : Promise.all([translateChunk(it.title), translateLong(origParas.join(" "))])
          .then(function (res) { myCache = res; return res; });
        doTranslate.then(function (res) {
          titleEl.textContent = res[0];
          bodyEl.innerHTML = res[1].split(/(?<=\.)\s+/).map(function (para) {
            return "<p>" + para.replace(/</g, "&lt;") + "</p>";
          }).join("");
          var noteEl = document.createElement("div");
          noteEl.id = "myNote"; noteEl.className = "my-note";
          noteEl.textContent = "⚠️ စက်ဘာသာပြန် — အတိအကျ စကားလုံးအတွက် မူရင်း English ကို ပြန်ကြည့်ပါ";
          bodyEl.parentNode.insertBefore(noteEl, bodyEl);
          myOn = true; myBtn.textContent = "English ပြန်ကြည့်ရန်";
        }).catch(function () {
          alert("ဘာသာပြန်လို့ မရသေးပါ — ကွန်နက်ရှင် စစ်ပြီး ပြန်နှိပ်ပေးပါ");
          myBtn.textContent = "မြန်မာလို ဖတ်ရန်";
        }).finally(function () { myBusy = false; myBtn.disabled = false; });
      });
      if (new URLSearchParams(location.search).get("my") === "1") myBtn.click();
    }
    var related = data.items.filter(function (x) {
      if (x.link === it.link) return false;
      if (x.category === it.category) return true;
      return (x.countries || []).some(function (c) { return (it.countries || []).indexOf(c) !== -1; });
    }).slice(0, 6);
    if (related.length) {
      relBox.innerHTML = "<h2>ဆက်စပ်သတင်းများ</h2><div class=\"related-grid\">" +
        related.map(function (x) {
          return '<a class="rel-card" href="' + esc(articleUrl(x)) + '"><span class="tag">' + esc(x.category) + "</span><strong>" + esc(x.title) + "</strong><span class=\"meta\">" + esc(x.source) + " • " + timeAgo(x.published) + "</span></a>";
        }).join("") + "</div>";
    }
  }).catch(function () {
    box.innerHTML = "<p>သတင်း ဖွင့်လို့ မရပါ။ စာမျက်နှာကို ပြန်ဖွင့်ကြည့်ပါ။ <a href=\"./\">ပင်မသို့</a></p>";
  });
})();
