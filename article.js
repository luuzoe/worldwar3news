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

  fetch("news.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (data) {
    var it = null;
    if (p.link) {
      for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].link === p.link) { it = data.items[i]; break; }
      }
    }
    if (!it) { notFound(); return; }
    document.title = it.title + " — World War 3 News";
    var tags = '<span class="tag">' + esc(it.category) + "</span>" +
      (it.lang === "my" ? '<span class="tag lang-my">မြန်မာ</span>' : "") +
      (it.countries || []).map(function (c) { return '<span class="tag country">' + esc(c) + "</span>"; }).join("");
    var img = it.image ? '<div class="article-img"><img src="' + esc(it.image) + '" alt="" loading="lazy"></div>' : "";
    var body = it.body || it.summary || "";
    var paragraphs = body.split(/\n+/).filter(function (x) { return x.trim(); });
    var bodyHtml = paragraphs.length
      ? paragraphs.map(function (para) { return "<p>" + esc(para) + "</p>"; }).join("")
      : "<p>ဒီသတင်းအတွက် အကျဉ်းချုပ် မပါလာပါ။ မူရင်းလင့်ခ်ကနေ ဖတ်ပေးပါ။</p>";
    box.innerHTML =
      '<a class="back-btn" href="./">← သတင်းအားလုံး ပြန်ကြည့်ရန်</a>' +
      '<div class="tag-row">' + tags + "</div>" +
      '<h1 class="article-title">' + esc(it.title) + "</h1>" +
      '<div class="meta"><b>' + esc(it.source) + "</b> • " + timeAgo(it.published) + " • " + fmtYangon(it.published) + " Yangon</div>" +
      img + '<div class="article-body">' + bodyHtml + "</div>" +
      '<div class="note-box">ℹ️ ဒီမှာ ပြထားတာက မူရင်းသတင်းဌာနက ထုတ်ပြန်တဲ့ အကျဉ်းချုပ် အပြည့်အစုံပါ။ ဆောင်းပါး အပြည့်အစုံကို ဒီ site ထဲ ကူးယူဖော်ပြလို့ မရလို့၊ အပြည့်အစုံ ဖတ်ချင်ရင် အောက်က ခလုတ်နဲ့ မူရင်းမှာ ဆက်ဖတ်ပါ။</div>' +
      '<a class="origin-btn" href="' + esc(it.link) + '" target="_blank" rel="noopener">' + esc(it.source) + " မှာ အပြည့်အစုံ ဖတ်ရန် →</a>" +
      '<div class="card-actions" style="margin-top:14px"><button class="mini-btn" type="button" id="shareBtn">↗ မျှဝေရန်</button>' +
      (it.lang !== "my" ? '<a class="mini-btn" href="https://translate.google.com/translate?sl=en&tl=my&u=' + encodeURIComponent(it.link) + '" target="_blank" rel="noopener">မြန်မာလို ဖတ်ရန်</a>' : "") + "</div>";
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
