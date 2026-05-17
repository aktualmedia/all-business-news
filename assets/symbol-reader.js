(() => {
  const root = document.querySelector('[data-symbol-pdf]');
  if (!root) return;

  const pdfUrl = root.dataset.symbolPdf;
  const canvas = root.querySelector('canvas');
  const status = root.querySelector('[data-pdf-status]');
  const pageInfo = root.querySelector('[data-pdf-info]');
  const prev = root.querySelector('[data-pdf-prev]');
  const next = root.querySelector('[data-pdf-next]');
  const zoomIn = root.querySelector('[data-pdf-zoom-in]');
  const zoomOut = root.querySelector('[data-pdf-zoom-out]');
  const fallback = root.querySelector('[data-pdf-fallback]');

  let pdfDoc = null;
  let pageNo = 1;
  let scale = Math.max(0.8, Math.min(1.35, window.innerWidth / 620));
  let rendering = false;

  function setStatus(text) { if (status) status.textContent = text; }

  async function renderPage() {
    if (!pdfDoc || !canvas || rendering) return;
    rendering = true;
    setStatus('Učitavanje stranice...');
    try {
      const page = await pdfDoc.getPage(pageNo);
      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext('2d');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (pageInfo) pageInfo.textContent = `STRANICA ${pageNo} / ${pdfDoc.numPages} · ${Math.round(scale * 100)}%`;
      if (prev) prev.disabled = pageNo <= 1;
      if (next) next.disabled = pageNo >= pdfDoc.numPages;
      setStatus('Pregled spreman. Listaj bez preuzimanja PDF-a.');
      if (fallback) fallback.hidden = true;
    } catch (e) {
      console.warn('SYMBOL PDF render error', e);
      setStatus('Pregled nije učitan. Koristi rezervni prikaz ispod.');
      if (fallback) fallback.hidden = false;
    } finally {
      rendering = false;
    }
  }

  async function init() {
    try {
      setStatus('Pokrećem preglednik...');
      if (!window.pdfjsLib) throw new Error('PDF.js nije dostupan');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfDoc = await window.pdfjsLib.getDocument(pdfUrl).promise;
      prev?.addEventListener('click', () => { pageNo = Math.max(1, pageNo - 1); renderPage(); });
      next?.addEventListener('click', () => { pageNo = Math.min(pdfDoc.numPages, pageNo + 1); renderPage(); });
      zoomIn?.addEventListener('click', () => { scale = Math.min(2.4, Number((scale + 0.15).toFixed(2))); renderPage(); });
      zoomOut?.addEventListener('click', () => { scale = Math.max(0.55, Number((scale - 0.15).toFixed(2))); renderPage(); });
      await renderPage();
    } catch (e) {
      console.warn('SYMBOL PDF viewer failed', e);
      setStatus('Preglednik se nije učitao. Rezervni prikaz je ispod.');
      if (fallback) fallback.hidden = false;
    }
  }

  init();
})();
