// Diagnostic error banner + global error handlers
(function installDiagnostics() {
  function showErrorBanner(message, stack) {
    try {
      const root = document.querySelector('.app-shell') || document.body;
      const existing = document.getElementById('diagnosticErrorBanner');
      if (existing) existing.remove();

      const banner = document.createElement('div');
      banner.id = 'diagnosticErrorBanner';
      banner.style.background = '#fff6f6';
      banner.style.border = '1px solid #f5c2c2';
      banner.style.color = '#7a2a2a';
      banner.style.padding = '12px';
      banner.style.margin = '12px';
      banner.style.borderRadius = '8px';
      banner.style.fontWeight = '700';
      banner.innerHTML = `<div><strong>Diagnostics:</strong> ${message}</div><pre style="white-space:pre-wrap;margin-top:8px">${stack || ''}</pre>`;
      root.insertBefore(banner, root.firstChild);
    } catch (e) {
      // ignore
    }
  }

  window.addEventListener('error', (ev) => {
    const msg = ev?.message || 'Uncaught error';
    const stack = ev?.error?.stack || ev?.filename + ':' + ev?.lineno + ':' + ev?.colno;
    console.error('Global error captured', msg, stack);
    showErrorBanner(msg, stack);
  });

  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev?.reason ? (ev.reason.message || String(ev.reason)) : 'Unhandled rejection';
    const stack = ev?.reason?.stack || '';
    console.error('Unhandled rejection', reason, stack);
    showErrorBanner(reason, stack);
  });
})();

// append to top of script.js content
