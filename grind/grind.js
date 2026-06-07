(function () {
  const app = document.querySelector("[data-grind-app]");
  if (!app) return;

  const login = app.querySelector("[data-login]");
  const logout = app.querySelector("[data-logout]");
  const refresh = app.querySelector("[data-refresh]");
  const authLabel = app.querySelector("[data-auth-label]");
  const authTitle = app.querySelector("[data-auth-title]");
  const authCopy = app.querySelector("[data-auth-copy]");
  const statusRegion = app.querySelector("[data-status-region]");
  const statusTitle = app.querySelector("[data-status-title]");
  const statusUpdated = app.querySelector("[data-status-updated]");
  const frame = app.querySelector("[data-status-frame]");
  let refreshTimer = null;

  function setAccessState(state, title, copy) {
    authLabel.textContent = state;
    authTitle.textContent = title;
    authCopy.textContent = copy;
  }

  function stripRefresh(html) {
    return html.replace(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*>/gi, "");
  }

  function setSignedOut() {
    if (refreshTimer) {
      window.clearInterval(refreshTimer);
      refreshTimer = null;
    }
    login.hidden = false;
    logout.hidden = true;
    refresh.hidden = true;
    statusRegion.hidden = true;
    setAccessState(
      "Locked",
      "Passkey sign-in required",
      "Continue with GitHub auth, then choose your passkey in the GitHub prompt.",
    );
  }

  function setSignedIn(name) {
    login.hidden = true;
    logout.hidden = false;
    refresh.hidden = false;
    statusRegion.hidden = false;
    setAccessState(
      "Unlocked",
      name ? `Signed in as ${name}` : "Signed in",
      "The grinder pane below is loaded through a protected proxy. It refreshes every minute.",
    );
  }

  function setDenied() {
    if (refreshTimer) {
      window.clearInterval(refreshTimer);
      refreshTimer = null;
    }
    login.hidden = true;
    logout.hidden = false;
    refresh.hidden = false;
    statusRegion.hidden = false;
    setAccessState(
      "Denied",
      "Signed in, but this account is not allowed",
      "Sign out and use the GitHub account on the grinder allowlist.",
    );
    statusTitle.textContent = "Access denied";
    statusUpdated.textContent = "The private proxy rejected this GitHub account.";
    frame.srcdoc =
      "<!doctype html><html><body style=\"font-family: system-ui; padding: 24px; color: #241c17;\"><h1>Access denied</h1><p>This GitHub account is not allowed to view the grinder status.</p></body></html>";
  }

  async function getSession() {
    const response = await fetch("/.auth/me", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.clientPrincipal || null;
  }

  async function loadStatus() {
    statusTitle.textContent = "Refreshing grinder pane";
    statusUpdated.textContent = "Contacting the private proxy...";

    try {
      const response = await fetch("/api/grind", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (response.status === 401) {
        setSignedOut();
        return;
      }

      if (response.status === 403) {
        setDenied();
        return;
      }

      if (!response.ok) {
        throw new Error(`Status proxy returned ${response.status}`);
      }

      const html = stripRefresh(await response.text());
      frame.srcdoc = html;
      statusTitle.textContent = "Live grinder pane";
      statusUpdated.textContent = `Updated ${new Date().toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "medium",
      })}`;
    } catch (error) {
      statusTitle.textContent = "Status unavailable";
      statusUpdated.textContent = error.message;
      frame.srcdoc =
        "<!doctype html><html><body style=\"font-family: system-ui; padding: 24px; color: #241c17;\"><h1>Unable to load grinder status</h1><p>The protected proxy could not reach the status service. Try refreshing in a moment.</p></body></html>";
    }
  }

  async function init() {
    try {
      const principal = await getSession();
      if (!principal) {
        setSignedOut();
        return;
      }

      setSignedIn(principal.userDetails);
      await loadStatus();
      refreshTimer = window.setInterval(loadStatus, 60000);
    } catch (error) {
      setSignedOut();
    }
  }

  refresh.addEventListener("click", loadStatus);
  init();
})();
