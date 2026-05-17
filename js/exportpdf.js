// ============================================================
// exportpdf.js — Ekspor Hasil ke PDF
// FIX CANVAS: Convert semua <canvas> → <img> sebelum screenshot
// FIX COLORS: Inject CSS vars sebagai inline style
// ============================================================

const CSS_VARS = {
  '--gold':        '#c9a84c',
  '--gold-light':  '#e8c97a',
  '--deep':        '#0a0f1e',
  '--panel':       '#111827',
  '--panel2':      '#1a2235',
  '--panel3':      '#0f1624',
  '--text':        '#e8e6e0',
  '--muted':       '#7a8499',
  '--border':      'rgba(201,168,76,0.2)',
  '--success':     '#4ade80',
  '--danger':      '#f87171',
  '--warn':        '#fbbf24',
};

// ─────────────────────────────────────────────────────────────
// KUNCI UTAMA: Ganti semua <canvas> dengan <img> di dalam clone
// Canvas hanya ada di memori GPU — saat di-clone isinya hilang.
// Solusi: toDataURL() dulu dari canvas ASLI, lalu inject ke img.
// ─────────────────────────────────────────────────────────────
function replaceCanvasWithImages(sourceEl, cloneEl) {
  const sourceCanvases = sourceEl.querySelectorAll('canvas');
  const cloneCanvases  = cloneEl.querySelectorAll('canvas');

  sourceCanvases.forEach((srcCanvas, i) => {
    const cloneCanvas = cloneCanvases[i];
    if (!cloneCanvas) return;

    try {
      // Ambil gambar dari canvas ASLI (yang sudah ada isinya)
      const dataUrl = srcCanvas.toDataURL('image/png');

      // Buat <img> pengganti
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.width  = srcCanvas.offsetWidth  + 'px';
      img.style.height = srcCanvas.offsetHeight + 'px';
      img.style.display = 'block';
      img.style.borderRadius = getComputedStyle(srcCanvas).borderRadius || '0';
      img.style.background = '#080e1a';

      // Ganti canvas di clone dengan img
      cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
    } catch (e) {
      console.warn('Canvas toDataURL gagal:', e);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Inject CSS vars ke semua elemen
// ─────────────────────────────────────────────────────────────
function injectCSSVars(el) {
  Object.entries(CSS_VARS).forEach(([k, v]) => el.style.setProperty(k, v));
  el.querySelectorAll('*').forEach(child => {
    Object.entries(CSS_VARS).forEach(([k, v]) => child.style.setProperty(k, v));
  });
}

// ─────────────────────────────────────────────────────────────
// Patch warna inline (untuk elemen yang pakai CSS class-based color)
// ─────────────────────────────────────────────────────────────
function patchColors(root) {
  const map = {
    'step-block':       { background:'#111827', border:'1px solid rgba(201,168,76,0.2)' },
    'sub-block':        { background:'#1a2235', border:'1px solid rgba(201,168,76,0.12)' },
    'math-box':         { background:'rgba(0,0,0,0.25)', border:'1px solid rgba(201,168,76,0.1)' },
    'mbox':             { background:'#1a2235', borderLeft:'3px solid rgba(201,168,76,0.35)' },
    'result-summary':   { background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.35)' },
    'res-var':          { background:'#111827', border:'1px solid rgba(201,168,76,0.2)' },
    'step-header':      { color:'#c9a84c', borderBottom:'1px solid rgba(201,168,76,0.2)' },
    'step-block':       { background:'#111827', border:'1px solid rgba(201,168,76,0.2)' },
    'sub-header':       { color:'#e8e6e0' },
    'sub-badge':        { background:'#c9a84c', color:'#0a0f1e' },
    'res-title':        { color:'#c9a84c' },
    'res-z':            { color:'#e8e6e0' },
    's-explain':        { color:'#7a8499' },
    'mb-goal':          { color:'#e8c97a', fontWeight:'600' },
    'goal':             { color:'#e8c97a', fontWeight:'600' },
    'mb-label':         { color:'#c9a84c', fontWeight:'600' },
    'lbl':              { color:'#c9a84c', fontWeight:'700' },
    'mb-con':           { color:'#e8e6e0' },
    'con':              { color:'#e8e6e0' },
    'mb-note':          { color:'#7a8499' },
    'note':             { color:'#7a8499' },
    'con-num':          { color:'#c9a84c', fontWeight:'600' },
    'ineq':             { color:'#e8c97a', fontWeight:'700' },
    'iq':               { color:'#c9a84c', fontWeight:'700' },
    'rhs':              { color:'#e8e6e0', fontWeight:'600' },
    'rv':               { color:'#e8c97a', fontWeight:'600' },
    'verify-ok':        { color:'#4ade80', fontWeight:'600' },
    'ok':               { color:'#4ade80', fontWeight:'600' },
    'slk-add':          { color:'#4ade80', fontWeight:'600' },
    'slk-sub':          { color:'#fb923c', fontWeight:'600' },
    'hvar':             { background:'rgba(201,168,76,0.2)', color:'#c9a84c' },
    'optimal-note':     { color:'#4ade80', background:'rgba(74,222,128,0.08)' },
    'not-optimal-note': { color:'#fb923c', background:'rgba(251,146,60,0.08)' },
    'no-sol':           { color:'#f87171', background:'rgba(220,53,69,0.1)' },
    'tableau-note':     { color:'#7a8499' },
    'basis-cell':       { color:'#e8c97a', background:'rgba(201,168,76,0.06)' },
    'pivot-cell':       { background:'rgba(201,168,76,0.4)', color:'#0a0f1e', fontWeight:'700' },
    'piv-col':          { background:'rgba(201,168,76,0.08)' },
    'piv-row':          { background:'rgba(201,168,76,0.05)' },
    'zcell':            { background:'#1a2235', border:'1px solid rgba(201,168,76,0.15)' },
    'zcell-pivot':      { background:'rgba(201,168,76,0.25)', border:'1px solid #c9a84c' },
    'zcell-var':        { color:'#7a8499' },
    'zcell-val':        { color:'#e8e6e0' },
    'min-tag':          { color:'#c9a84c', fontWeight:'700' },
    'op-section-title': { color:'#e8c97a', fontWeight:'600' },
    'opt-badge':        { color:'#c9a84c', fontWeight:'700' },
    'opt-row':          { background:'rgba(201,168,76,0.12)' },
    'g-hist-z':         { color:'#c9a84c' },
    'history-item-z':   { color:'#c9a84c' },
    'noneg':            { color:'#7a8499', fontStyle:'italic' },
    'graph-wrap':       { background:'#080e1a', borderRadius:'14px' },
    'legend-item':      { background:'#1a2235', color:'#7a8499' },
    'corner-table':     {},
    'xfer-panel':       { background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.22)' },
    'xfer-title':       { color:'#c9a84c', fontWeight:'700' },
  };

  root.querySelectorAll('*').forEach(el => {
    el.classList.forEach(cls => {
      if (map[cls]) Object.assign(el.style, map[cls]);
    });

    if (el.tagName === 'TABLE') { el.style.borderCollapse = 'collapse'; el.style.width = '100%'; }
    if (el.tagName === 'TH') {
      if (!el.style.background) el.style.background = '#1a2235';
      if (!el.style.color) el.style.color = '#c9a84c';
      el.style.padding = '8px 12px';
      el.style.border = '1px solid rgba(201,168,76,0.15)';
      el.style.textAlign = 'center';
    }
    if (el.tagName === 'TD') {
      if (!el.style.padding) el.style.padding = '7px 12px';
      if (!el.style.border) el.style.border = '1px solid rgba(201,168,76,0.1)';
      el.style.textAlign = 'center';
      if (!el.style.color) el.style.color = '#e8e6e0';
    }
    if (el.classList.contains('tr-before')) el.querySelectorAll('td').forEach(td => { td.style.color = '#7a8499'; td.style.background = 'rgba(0,0,0,0.15)'; });
    if (el.classList.contains('tr-op'))     el.querySelectorAll('td').forEach(td => { td.style.color = '#fb923c'; td.style.background = 'rgba(251,146,60,0.06)'; });
    if (el.classList.contains('tr-after'))  el.querySelectorAll('td').forEach(td => { td.style.color = '#4ade80'; td.style.fontWeight = '600'; td.style.background = 'rgba(74,222,128,0.06)'; });
    if (el.classList.contains('tr-win'))    el.querySelectorAll('td').forEach(td => { td.style.background = 'rgba(201,168,76,0.12)'; td.style.color = '#e8e6e0'; });
    if (el.classList.contains('obj-row'))   el.querySelectorAll('td').forEach(td => { td.style.background = 'rgba(201,168,76,0.06)'; td.style.color = '#e8c97a'; });
    if (el.classList.contains('opt-row'))   el.querySelectorAll('td').forEach(td => { td.style.background = 'rgba(201,168,76,0.12)'; td.style.color = '#e8c97a'; td.style.fontWeight = '600'; });
  });
}

// ─────────────────────────────────────────────────────────────
// FUNGSI UTAMA EXPORT PDF
// ─────────────────────────────────────────────────────────────
async function exportToPDF(resultId, method, subtitle, filename, btnId) {
  const resultEl = document.getElementById(resultId);
  if (!resultEl || !resultEl.innerHTML.trim()) {
    alert('Belum ada hasil untuk diekspor. Selesaikan perhitungan terlebih dahulu.');
    return;
  }
  if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
    alert('Library PDF belum siap. Pastikan koneksi internet aktif dan coba lagi.');
    return;
  }

  const btn = btnId
    ? document.getElementById(btnId)
    : document.querySelector('[id^="btnPdf"]');
  const origText = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '⏳ Membuat PDF...'; btn.disabled = true; }

  try {
    const { jsPDF } = window.jspdf;

    // Buat wrapper clone di luar layar
    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'position:fixed', 'left:-9999px', 'top:0',
      'width:960px', 'padding:24px', 'box-sizing:border-box',
      'font-family:DM Sans,sans-serif', 'font-size:14px', 'line-height:1.6',
      'background-color:#0a0f1e', 'color:#e8e6e0', 'z-index:-9999',
    ].join(';');
    Object.entries(CSS_VARS).forEach(([k, v]) => wrapper.style.setProperty(k, v));

    // Clone konten
    const clone = resultEl.cloneNode(true);
    clone.style.cssText = 'background:transparent;color:#e8e6e0;';

    // ★ KUNCI: Ganti canvas di clone dengan gambar dari canvas asli
    replaceCanvasWithImages(resultEl, clone);

    injectCSSVars(clone);
    patchColors(clone);

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Tunggu semua <img> dari canvas selesai load
    await waitImagesLoaded(wrapper);
    await new Promise(r => setTimeout(r, 150));

    // Screenshot
    const canvas = await html2canvas(wrapper, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#0a0f1e', logging: false,
      width: 960, windowWidth: 960,
    });

    document.body.removeChild(wrapper);

    if (canvas.height === 0) {
      alert('Konten tidak terdeteksi. Coba selesaikan perhitungan ulang.');
      return;
    }

    // Build PDF
    await buildPDF(canvas, pdf => pdf.save(`${filename}_${_dateTag()}.pdf`),
      method, subtitle);

  } catch (err) {
    console.error('PDF Error:', err);
    alert('Gagal membuat PDF.\nError: ' + err.message);
  } finally {
    const stray = document.body.querySelector('div[style*="-9999px"]');
    if (stray) document.body.removeChild(stray);
    if (btn) { btn.innerHTML = origText; btn.disabled = false; }
  }
}

// ─────────────────────────────────────────────────────────────
// Export PDF dari elemen modal (untuk history grafik)
// ─────────────────────────────────────────────────────────────
async function exportFromModal(modalBodyId, method, subtitle, filename, btn, timestamp) {
  const bodyEl = document.getElementById(modalBodyId);
  if (!bodyEl) { alert('Konten modal tidak ditemukan.'); return; }
  if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
    alert('Library PDF belum siap. Pastikan koneksi internet aktif.'); return;
  }

  const origText = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '⏳ Membuat PDF...'; btn.disabled = true; }

  try {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;padding:24px;box-sizing:border-box;font-family:DM Sans,sans-serif;background-color:#0a0f1e;color:#e8e6e0;z-index:-9999;';
    Object.entries(CSS_VARS).forEach(([k, v]) => wrapper.style.setProperty(k, v));

    const clone = bodyEl.cloneNode(true);
    clone.style.cssText = 'background:transparent;color:#e8e6e0;';

    // ★ Ganti canvas di clone dengan gambar dari canvas di modal body (asli)
    replaceCanvasWithImages(bodyEl, clone);

    injectCSSVars(clone);
    patchColors(clone);

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await waitImagesLoaded(wrapper);
    await new Promise(r => setTimeout(r, 150));

    const canvas = await html2canvas(wrapper, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#0a0f1e', logging: false,
      width: 960, windowWidth: 960,
    });

    document.body.removeChild(wrapper);

    await buildPDF(canvas, pdf => pdf.save(`${filename}_${_dateTag()}.pdf`), method, subtitle);

  } catch (err) {
    console.error(err);
    alert('Gagal membuat PDF.\n' + err.message);
  } finally {
    const stray = document.body.querySelector('div[style*="-9999px"]');
    if (stray) document.body.removeChild(stray);
    if (btn) { btn.innerHTML = origText; btn.disabled = false; }
  }
}

// ─────────────────────────────────────────────────────────────
// Build PDF dari canvas screenshot
// ─────────────────────────────────────────────────────────────
async function buildPDF(canvas, saveFn, method, subtitle) {
  const { jsPDF } = window.jspdf;
  const imgW = canvas.width, imgH = canvas.height;
  const pdfW = 210, pdfH = 297, margin = 12, headerH = 26;
  const contentW = pdfW - margin * 2;
  const contentH = pdfH - headerH - margin * 2;
  const scaledH = (imgH / imgW) * contentW;
  const totalPages = Math.max(1, Math.ceil(scaledH / contentH));
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();
    _drawHeader(pdf, method, subtitle, page + 1, totalPages, pdfW, margin, headerH);

    const pxPerMm = imgW / contentW;
    const srcY = Math.floor(page * contentH * pxPerMm);
    const srcH = Math.min(Math.ceil(contentH * pxPerMm), imgH - srcY);
    if (srcH <= 0) continue;

    const pc = document.createElement('canvas');
    pc.width = imgW; pc.height = srcH;
    const pCtx = pc.getContext('2d');
    pCtx.fillStyle = '#0a0f1e';
    pCtx.fillRect(0, 0, imgW, srcH);
    pCtx.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);

    const renderH = Math.min(srcH / pxPerMm, contentH);
    pdf.addImage(pc.toDataURL('image/png'), 'PNG', margin, headerH + margin, contentW, renderH);
    _drawFooter(pdf, page + 1, totalPages, pdfW, pdfH, margin);
  }

  saveFn(pdf);
}

// ─────────────────────────────────────────────────────────────
// Tunggu semua <img> dalam elemen selesai load
// ─────────────────────────────────────────────────────────────
function waitImagesLoaded(el) {
  const imgs = Array.from(el.querySelectorAll('img'));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(imgs.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(res => { img.onload = res; img.onerror = res; });
  }));
}

// ─────────────────────────────────────────────────────────────
// Header & Footer PDF
// ─────────────────────────────────────────────────────────────
function _drawHeader(pdf, method, subtitle, page, total, pdfW, margin, headerH) {
  pdf.setFillColor(10, 15, 30);
  pdf.rect(0, 0, pdfW, headerH, 'F');
  pdf.setDrawColor(201, 168, 76);
  pdf.setLineWidth(0.4);
  pdf.line(0, headerH, pdfW, headerH);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(201, 168, 76);
  pdf.text('TRO', margin, 9);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(200, 196, 188);
  pdf.text(`Metode ${method}${subtitle ? ' — ' + subtitle : ''}`, margin + 13, 9);
  pdf.setFontSize(7.5); pdf.setTextColor(100, 110, 130);
  pdf.text(new Date().toLocaleString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }), pdfW - margin, 9, { align: 'right' });
  pdf.text(`Halaman ${page} / ${total}`, pdfW - margin, 17, { align: 'right' });
  pdf.text('Teknik Riset Operasi — Platform Komputasi', margin, 21);
}

function _drawFooter(pdf, page, total, pdfW, pdfH, margin) {
  pdf.setDrawColor(201, 168, 76); pdf.setLineWidth(0.25);
  pdf.line(margin, pdfH - 9, pdfW - margin, pdfH - 9);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(100, 110, 130);
  pdf.text('Platform TRO — Teknik Riset Operasi', margin, pdfH - 5);
  pdf.text(`Halaman ${page} dari ${total}`, pdfW - margin, pdfH - 5, { align: 'right' });
}

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────
function _dateTag() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─────────────────────────────────────────────────────────────
// Shortcut per metode — dipanggil dari tombol di HTML
// ─────────────────────────────────────────────────────────────
function exportSimplexPDF() {
  const isMin = typeof simplexState !== 'undefined' && simplexState.objective === 'min';
  exportToPDF('simplexResult', 'Simplex', isMin ? 'Minimasi' : 'Maksimasi', 'TRO_Simplex', 'btnPdfSimplex');
}

function exportPersamaanPDF() {
  const method = typeof pState !== 'undefined'
    ? (pState.method === 'gauss' ? 'Eliminasi Gauss' : 'Gauss-Jordan')
    : 'Persamaan';
  exportToPDF('persamaanResult', 'Persamaan', method, 'TRO_Persamaan', 'btnPdfPersamaan');
}

function exportGrafikPDFLive() {
  const isMin = typeof GS !== 'undefined' && GS.objective === 'min';
  exportToPDF('grafikResult', 'Grafik', isMin ? 'Minimasi' : 'Maksimasi', 'TRO_Grafik', 'btnPdfGrafik');
}
