// Comitai LinkedIn extension — content script.
//
// Runs on https://www.linkedin.com/in/* pages. Scrapes best-effort profile
// data and relays it to the background service worker, which makes the
// actual authenticated call to POST /v1/linkedin/observe.
//
// [PRECISA SER VALIDADO] The selectors in readProfile() below are
// LinkedIn's long-documented profile markup as of this writing, but
// LinkedIn changes its DOM often and this could not be checked against a
// live page from this sandbox (no browser available here). If
// observations stop matching or come back empty, open a real profile page,
// inspect it with DevTools, and update the selectors below — every attempt
// logs what it captured to the console (filter DevTools for "[Comitai]").

function textOf(selector, root = document) {
  const el = root.querySelector(selector);
  return el ? el.textContent.trim() : null;
}

// Many LinkedIn headlines follow "Role at Company" / "Role @ Company" —
// splitting that text is more robust than crawling the Experience
// section's deeply-nested, frequently-restructured markup for the same
// information.
function splitHeadline(headline) {
  if (!headline) return { role: null, company: null };
  const match = /^(.*?)\s+(?:at|@|na|em)\s+(.+)$/i.exec(headline);
  if (!match) return { role: headline, company: null };
  return { role: match[1].trim(), company: match[2].trim() };
}

// LinkedIn shows a "1st"/"2nd"/"3rd" degree badge near the name for
// accepted/pending/unconnected profiles — this is how item 11's "wait for
// connection accepted" gate ever gets satisfied, since LinkedIn has no
// webhook for it. `.dist-value` is the long-standing class for this badge;
// unverified against a live page, same caveat as the rest of this file.
function readConnectionDegree() {
  const text = textOf('.dist-value');
  if (!text) return null;
  const match = /^(1st|2nd|3rd)$/i.exec(text.trim());
  return match ? match[1].toLowerCase() : null;
}

function readProfile() {
  const name = textOf('h1.text-heading-xlarge') || textOf('h1');
  const headline = textOf('.text-body-medium.break-words');
  const { role, company } = splitHeadline(headline);
  const connectionDegree = readConnectionDegree();
  return { name, role, company, headline, connectionDegree };
}

function showBadge(text, ok) {
  document.getElementById('comitai-sync-badge')?.remove();

  const badge = document.createElement('div');
  badge.id = 'comitai-sync-badge';
  badge.textContent = text;
  badge.style.cssText = `
    position: fixed; bottom: 16px; right: 16px; z-index: 999999;
    padding: 8px 14px; border-radius: 8px;
    font: 13px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
    color: #fff; background: ${ok ? '#1f7a4d' : '#8a1f1f'};
    box-shadow: 0 2px 8px rgba(0,0,0,.2);
  `;
  document.body.appendChild(badge);
  setTimeout(() => badge.remove(), 4000);
}

let lastSyncedUrl = null;

function syncCurrentProfile() {
  const url = location.href;
  if (url === lastSyncedUrl) return;

  const profile = readProfile();
  console.debug('[Comitai] Perfil capturado em', url, ':', profile);

  if (!profile.name) {
    console.debug(
      '[Comitai] Nome não encontrado — os seletores podem estar desatualizados.',
    );
    return;
  }

  lastSyncedUrl = url;

  chrome.runtime.sendMessage(
    {
      type: 'OBSERVE_PROFILE',
      payload: {
        linkedinUrl: url,
        currentRole: profile.role || undefined,
        currentCompanyName: profile.company || undefined,
        connectionDegree: profile.connectionDegree || undefined,
      },
    },
    (response) => {
      if (!response) return; // extension context invalidated (reload) — ignore
      if (!response.success) {
        if (response.error === 'not_authenticated') {
          showBadge('Comitai: faça login na extensão', false);
        }
        console.debug('[Comitai] Falha ao sincronizar:', response.error);
        return;
      }
      const { result } = response;
      if (!result.matched) return; // this profile isn't linked to a Comitai contact
      if (result.changed) {
        showBadge(
          `Comitai: ${result.changed === 'role' ? 'cargo' : 'empresa'} atualizado`,
          true,
        );
      } else if (result.connectionJustAccepted) {
        showBadge('Comitai: conexão aceita registrada', true);
      }
    },
  );
}

// LinkedIn is a single-page app — moving between profiles doesn't reload
// the page, so poll for URL changes instead of relying only on load events.
setInterval(syncCurrentProfile, 2000);
syncCurrentProfile();
