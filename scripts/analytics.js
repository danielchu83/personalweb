(() => {
  const config = window.personalWeb?.analytics || {};
  const clarityProjectId = config.clarityProjectId;

  if (!clarityProjectId) {
    return;
  }

  window.clarity =
    window.clarity ||
    function clarity() {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${clarityProjectId}`;
  document.head.append(script);
})();
