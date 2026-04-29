(() => {
  const config = window.personalWeb?.analytics || {};
  const googleAnalyticsId = config.googleAnalyticsId;
  const clarityProjectId = config.clarityProjectId;

  if (googleAnalyticsId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    window.gtag("js", new Date());
    window.gtag("config", googleAnalyticsId);

    const googleScript = document.createElement("script");
    googleScript.async = true;
    googleScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      googleAnalyticsId,
    )}`;
    document.head.append(googleScript);
  }

  if (clarityProjectId) {
    window.clarity =
      window.clarity ||
      function clarity() {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };

    const clarityScript = document.createElement("script");
    clarityScript.async = true;
    clarityScript.src = `https://www.clarity.ms/tag/${clarityProjectId}`;
    document.head.append(clarityScript);
  }
})();
