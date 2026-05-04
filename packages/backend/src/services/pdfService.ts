import puppeteer from "puppeteer";

export interface QuotePdfData {
  // Testata
  quoteNumber:    string;
  revisionNumber: number;
  issueDate:      string;
  validityDays:   number;

  // Azienda emittente
  companyName:    string;
  companyAddress: string;
  companyVat:     string;
  companyEmail:   string;

  // Cliente
  clientName:     string;
  clientAddress:  string;
  clientVat:      string;

  // Corpo preventivo
  description:    string;
  items:          PdfLineItem[];

  // Totali
  subtotalNet:    number;
  appliedPrice:   number;
  appliedMargin:  number;

  // Condizioni
  paymentTerms:   string;
  exclusions:     string[];
  notes:          string;
}

export interface PdfLineItem {
  description: string;
  unit:        string;
  quantity:    number;
  unitPrice:   number;
  total:       number;
}

export async function generateQuotePdf(data: QuotePdfData): Promise<Buffer> {
  const html = buildHtml(data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "18mm", bottom: "20mm", left: "18mm" },
      printBackground: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function fmt(n: number) {
  return "€ " + n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildHtml(d: QuotePdfData): string {
  const itemRows = d.items.map((item) => `
    <tr>
      <td class="desc">${esc(item.description)}</td>
      <td class="center">${esc(item.unit)}</td>
      <td class="right">${item.quantity.toLocaleString("it-IT")}</td>
      <td class="right">${fmt(item.unitPrice)}</td>
      <td class="right bold">${fmt(item.total)}</td>
    </tr>`).join("");

  const exclusionList = d.exclusions.length > 0
    ? `<strong>Non incluso:</strong> ${d.exclusions.join(", ")}.`
    : "";

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;700&display=swap');

  :root {
    --accent: #cc6333;
    --text:   #1a1a1a;
    --muted:  #6b7280;
    --border: #e5e7eb;
    --bg-alt: #f9fafb;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', sans-serif;
    font-size: 10pt;
    color: var(--text);
    background: #fff;
    line-height: 1.5;
  }

  /* ─── HEADER ─── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--accent);
    margin-bottom: 24px;
  }
  .company-name {
    font-family: 'Playfair Display', serif;
    font-size: 22pt;
    color: var(--text);
    letter-spacing: -0.5px;
  }
  .company-accent { color: var(--accent); }
  .company-meta {
    font-size: 8.5pt;
    color: var(--muted);
    margin-top: 4px;
    line-height: 1.6;
  }
  .quote-meta {
    text-align: right;
  }
  .quote-label {
    font-size: 8pt;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }
  .quote-number {
    font-family: 'Playfair Display', serif;
    font-size: 14pt;
    font-weight: 700;
  }
  .quote-date {
    font-size: 8.5pt;
    color: var(--muted);
    margin-top: 4px;
  }

  /* ─── PARTI ─── */
  .parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }
  .party-box {
    background: var(--bg-alt);
    padding: 12px 14px;
    border-left: 3px solid var(--accent);
  }
  .party-label {
    font-size: 8pt;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
    font-weight: 700;
  }
  .party-name {
    font-weight: 700;
    font-size: 11pt;
    margin-bottom: 3px;
  }
  .party-detail {
    font-size: 8.5pt;
    color: var(--muted);
    line-height: 1.5;
  }

  /* ─── TITOLO OGGETTO ─── */
  .subject-label {
    font-size: 8pt;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
    font-weight: 700;
  }
  .subject-text {
    font-size: 10.5pt;
    line-height: 1.6;
    margin-bottom: 20px;
    color: var(--text);
  }

  /* ─── TABELLA VOCI ─── */
  .items-section { margin-bottom: 20px; }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead {
    background: var(--text);
    color: #fff;
  }
  thead th {
    padding: 8px 10px;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  thead th.right { text-align: right; }
  thead th.center { text-align: center; }
  tbody tr {
    border-bottom: 1px solid var(--border);
  }
  tbody tr:nth-child(even) {
    background: var(--bg-alt);
  }
  tbody td {
    padding: 8px 10px;
    font-size: 9.5pt;
    vertical-align: top;
  }
  td.desc   { min-width: 200px; }
  td.center { text-align: center; }
  td.right  { text-align: right; }
  td.bold   { font-weight: 700; }

  /* ─── TOTALE ─── */
  .totals {
    margin-top: 6px;
    display: flex;
    justify-content: flex-end;
  }
  .totals-box {
    width: 260px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid var(--border);
    font-size: 9.5pt;
  }
  .total-row.grand {
    border-bottom: none;
    padding: 12px 14px;
    background: var(--accent);
    color: #fff;
    font-weight: 700;
    font-size: 12pt;
    margin-top: 4px;
  }
  .total-label { color: var(--muted); }
  .total-row.grand .total-label { color: rgba(255,255,255,0.8); }

  /* ─── CONDIZIONI ─── */
  .conditions {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    font-size: 8.5pt;
    color: var(--muted);
    line-height: 1.7;
  }
  .conditions strong { color: var(--text); }

  /* ─── FOOTER ─── */
  .footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: var(--muted);
  }
  .signature-box {
    text-align: center;
    width: 160px;
  }
  .signature-line {
    border-top: 1px solid var(--text);
    margin-top: 32px;
    padding-top: 4px;
    font-size: 7.5pt;
    color: var(--muted);
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div>
    <div class="company-name">
      ${esc(d.companyName.replace("24", '<span class="company-accent">24</span>'))}
    </div>
    <div class="company-meta">
      ${esc(d.companyAddress)}<br>
      P.IVA ${esc(d.companyVat)} &nbsp;·&nbsp; ${esc(d.companyEmail)}
    </div>
  </div>
  <div class="quote-meta">
    <div class="quote-label">Offerta n°</div>
    <div class="quote-number">${esc(d.quoteNumber)} — Rev.${d.revisionNumber}</div>
    <div class="quote-date">
      Data: ${esc(d.issueDate)}<br>
      Validità: ${d.validityDays} giorni
    </div>
  </div>
</div>

<!-- PARTI -->
<div class="parties">
  <div class="party-box">
    <div class="party-label">Emessa da</div>
    <div class="party-name">${esc(d.companyName)}</div>
    <div class="party-detail">${esc(d.companyAddress)}</div>
  </div>
  <div class="party-box">
    <div class="party-label">Offerta a</div>
    <div class="party-name">${esc(d.clientName)}</div>
    <div class="party-detail">
      ${d.clientAddress ? esc(d.clientAddress) + "<br>" : ""}
      ${d.clientVat ? "P.IVA " + esc(d.clientVat) : ""}
    </div>
  </div>
</div>

<!-- DESCRIZIONE -->
<div class="subject-label">Oggetto dell'offerta</div>
<div class="subject-text">${esc(d.description).replace(/\n/g, "<br>")}</div>

<!-- VOCI (solo se ci sono righe) -->
${d.items.length > 0 ? `
<div class="items-section">
  <table>
    <thead>
      <tr>
        <th>Descrizione</th>
        <th class="center">UM</th>
        <th class="right">Qtà</th>
        <th class="right">Prezzo unit.</th>
        <th class="right">Totale</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
</div>
` : ""}

<!-- TOTALE -->
<div class="totals">
  <div class="totals-box">
    <div class="total-row">
      <span class="total-label">Imponibile</span>
      <span>${fmt(d.appliedPrice)}</span>
    </div>
    <div class="total-row">
      <span class="total-label">IVA</span>
      <span>a carico del cliente</span>
    </div>
    <div class="total-row grand">
      <span class="total-label">TOTALE OFFERTA</span>
      <span>${fmt(d.appliedPrice)}</span>
    </div>
  </div>
</div>

<!-- CONDIZIONI -->
<div class="conditions">
  ${exclusionList ? `<p>${exclusionList}</p>` : ""}
  <p><strong>Modalità di pagamento:</strong> ${esc(d.paymentTerms)}.</p>
  <p><strong>Validità dell'offerta:</strong> ${d.validityDays} giorni dalla data di emissione.</p>
  ${d.notes ? `<p><strong>Note:</strong> ${esc(d.notes)}</p>` : ""}
  <p style="margin-top:8px;">I prezzi indicati sono da intendersi IVA esclusa. L'offerta è soggetta a variazioni in caso di modifiche sostanziali rispetto alla richiesta iniziale.</p>
</div>

<!-- FOOTER / FIRMA -->
<div class="footer">
  <div style="line-height:1.6;">
    <strong>${esc(d.companyName)}</strong><br>
    ${esc(d.companyAddress)}<br>
    ${esc(d.companyEmail)}
  </div>
  <div class="signature-box">
    <div class="signature-line">Firma e timbro per accettazione</div>
  </div>
</div>

</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
