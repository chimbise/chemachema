(function setupSubscriptionBanner() {
  const STYLE_ID = "subscription-banner-style";
  const BANNER_ID = "subscription-banner";
  const DAYS_THRESHOLD = 5;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      "#" +
      BANNER_ID +
      " {" +
      "position:fixed;" +
      "top:10px;" +
      "left:50%;" +
      "transform:translate(-50%,-120%);" +
      "z-index:10000;" +
      "padding:8px 12px;" +
      "border-radius:999px;" +
      'font-family:"Segoe UI",Tahoma,sans-serif;' +
      "font-size:12px;" +
      "font-weight:600;" +
      "letter-spacing:0.01em;" +
      "border:1px solid transparent;" +
      "opacity:0;" +
      "transition:transform 180ms ease,opacity 180ms ease;" +
      "pointer-events:none;" +
      "color:#8b6914;" +
      "background:#fff8e7;" +
      "border-color:rgba(180,130,20,0.35);" +
      "}" +
      "#" +
      BANNER_ID +
      ".show {" +
      "transform:translate(-50%,0);" +
      "opacity:1;" +
      "pointer-events:auto;" +
      "}";

    document.head.appendChild(style);
  }

  function ensureBanner() {
    var banner = document.getElementById(BANNER_ID);
    if (banner) {
      return banner;
    }

    banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.setAttribute("role", "alert");
    banner.setAttribute("aria-live", "assertive");
    document.body.appendChild(banner);
    return banner;
  }

  function showBanner(text) {
    var banner = ensureBanner();
    banner.textContent = text;
    banner.classList.add("show");
  }

  window.showSubscriptionWarning = function (daysRemaining) {
    ensureStyle();

    var dayText = daysRemaining === 1 ? "1 day" : daysRemaining + " days";
    var message =
      "Your subscription expires in " +
      dayText +
      ". Call/whatsapp 78282260 for renewal.";

    showBanner(message);
  };
})();