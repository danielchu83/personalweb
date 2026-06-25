window.personalWeb = {
  canonicalHost: {
    primary: "danielchu.dev",
    redirectFrom: ["calm-plant-09f98420f.7.azurestaticapps.net"],
  },
  analytics: {
    googleAnalyticsId: "G-S0R68PPJ54",
    clarityProjectId: "",
  },
};

(() => {
  const canonicalHost = window.personalWeb?.canonicalHost;
  const primaryHost = canonicalHost?.primary;
  const currentHost = window.location.hostname.toLowerCase();
  const redirectHosts = new Set(
    (canonicalHost?.redirectFrom || []).map((host) => host.toLowerCase()),
  );

  if (!primaryHost || !redirectHosts.has(currentHost)) return;

  const target = new URL(window.location.href);
  target.protocol = "https:";
  target.hostname = primaryHost;
  target.port = "";

  window.location.replace(target.toString());
})();
