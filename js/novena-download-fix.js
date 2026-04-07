/**
 * Novena PDF Download Fix
 * Intercepts the jsPDF-based download for variant C and serves the
 * pre-generated professional PDF from GitHub instead.
 */
(function() {
  'use strict';

  var NOVENA_PDF_URL = 'https://raw.githubusercontent.com/dudyfarias/minuto-da-oracao-data/main/novena-9-dias-intercessao-gracas.pdf';

  function patchDownloadButtons() {
    var buttons = document.querySelectorAll('.mo-lead-download[data-variant="c"]');
    buttons.forEach(function(btn) {
      // Remove existing listeners by cloning
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // GA4 tracking
        if (typeof gtag === 'function') {
          gtag('event', 'lead_capture_download', {
            lead_magnet: 'c',
            experiment: 'lead_magnet_ab',
            pdf_type: 'hosted'
          });
        }

        // Direct download from GitHub
        var a = document.createElement('a');
        a.href = NOVENA_PDF_URL;
        a.download = 'novena-9-dias-intercessao-gracas.pdf';
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { document.body.removeChild(a); }, 100);
      });
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchDownloadButtons);
  } else {
    // Small delay to ensure the original script has already bound
    setTimeout(patchDownloadButtons, 500);
  }
})();
