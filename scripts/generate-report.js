/**
 * generate-report.js
 * Reads reports/results.json (Playwright JSON output) and produces:
 *   reports/summary/report.html  — Smoke Test Summary Report (matches team format)
 *   reports/summary/report.json  — compact machine-readable summary
 *
 * Run: node scripts/generate-report.js
 */

const fs   = require('fs');
const path = require('path');
require('dotenv').config();

const RESULTS_FILE    = path.resolve(__dirname, '../reports/results.json');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../reports/screenshots');
const SUMMARY_DIR     = path.resolve(__dirname, '../reports/summary');

if (!fs.existsSync(RESULTS_FILE)) {
  console.error('❌ reports/results.json not found. Run playwright tests first.');
  process.exit(1);
}

fs.mkdirSync(SUMMARY_DIR, { recursive: true });

// ── Parse results ─────────────────────────────────────────────────────────────
const raw     = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
const now     = new Date();
const runDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
const runTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

let totalPassed  = 0;
let totalFailed  = 0;
let totalSkipped = 0;

const pages = {}; // group by spec file

for (const suite of raw.suites || []) {
  for (const spec of collectSpecs(suite)) {
    const file = path.basename(spec.file || '');
    const page = file.replace('.spec.ts', '');
    if (!pages[page]) pages[page] = { passed: [], failed: [], skipped: [] };

    for (const test of spec.tests || []) {
      const result = test.results?.[0] || {};
      const status = result.status || test.status || 'unknown';
      const entry  = {
        title:    test.title || spec.title || '(unknown)',
        status,
        duration: Math.round((result.duration || 0) / 1000 * 10) / 10 + 's',
        error:    result.error?.message?.split('\n')[0] || '',
      };
      if (status === 'passed') { totalPassed++; pages[page].passed.push(entry); }
      else if (status === 'failed' || status === 'timedOut') { totalFailed++; pages[page].failed.push(entry); }
      else { totalSkipped++; pages[page].skipped.push(entry); }
    }
  }
}

const total    = totalPassed + totalFailed + totalSkipped;
const passRate = total > 0 ? Math.round((totalPassed / total) * 100) : 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
function collectSpecs(suite, out = []) {
  if (suite.specs) out.push(...suite.specs);
  for (const s of suite.suites || []) collectSpecs(s, out);
  return out;
}

// ── Build compact JSON summary ────────────────────────────────────────────────
const summary = {
  runDate, runTime, total, totalPassed, totalFailed, totalSkipped, passRate,
  pages: Object.entries(pages).map(([page, data]) => ({
    page,
    passed:   data.passed.length,
    failed:   data.failed.length,
    skipped:  data.skipped.length,
    failures: data.failed.map(t => ({ title: t.title, error: t.error })),
  })),
};
fs.writeFileSync(path.join(SUMMARY_DIR, 'report.json'), JSON.stringify(summary, null, 2));

// ── Build page-level detail rows ──────────────────────────────────────────────
function pageLabel(key) {
  return key
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

const detailRows = Object.entries(pages).map(([page, data]) => {
  const total   = data.passed.length + data.failed.length + data.skipped.length;
  const statusDot = data.failed.length > 0 ? '🔴' : data.skipped.length === total ? '⏭️' : '🟢';
  return `
    <tr>
      <td>${statusDot} ${pageLabel(page)}</td>
      <td style="text-align:center;">${total}</td>
      <td style="text-align:center;color:#16a34a;font-weight:600;">${data.passed.length}</td>
      <td style="text-align:center;color:#dc2626;font-weight:600;">${data.failed.length}</td>
      <td style="text-align:center;color:#d97706;font-weight:600;">${data.skipped.length}</td>
    </tr>`;
}).join('');

// ── Build failure detail section ──────────────────────────────────────────────
const failedTests = Object.entries(pages)
  .flatMap(([page, data]) => data.failed.map(t => ({ page, ...t })));

const skippedTests = Object.entries(pages)
  .flatMap(([page, data]) => data.skipped.map(t => ({ page, ...t })));

const failureRows = failedTests.length === 0
  ? '<tr><td colspan="3" style="text-align:center;color:#16a34a;padding:12px;">✅ No failures — all executed tests passed!</td></tr>'
  : failedTests.map(t => `
    <tr>
      <td style="color:#dc2626;font-weight:600;">❌ ${t.title}</td>
      <td>${pageLabel(t.page)}</td>
      <td style="font-size:12px;color:#6b7280;font-family:monospace;">${t.error.substring(0, 120) || '—'}</td>
    </tr>`).join('');

const skipRows = skippedTests.length === 0
  ? '<tr><td colspan="2" style="text-align:center;color:#6b7280;padding:12px;">No skipped tests.</td></tr>'
  : skippedTests.map(t => `
    <tr>
      <td style="color:#d97706;">⏭️ ${t.title}</td>
      <td>${pageLabel(t.page)}</td>
    </tr>`).join('');

// ── Screenshots collected ─────────────────────────────────────────────────────
let screenshotCount = 0;
if (fs.existsSync(SCREENSHOTS_DIR)) {
  screenshotCount = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).length;
}

// ── Overall status ────────────────────────────────────────────────────────────
const overallStatus = totalFailed === 0
  ? '<span style="color:#16a34a;font-weight:700;">✅ PASS</span>'
  : `<span style="color:#dc2626;font-weight:700;">❌ FAIL (${totalFailed} failed)</span>`;

// ── Remarks auto-generated ───────────────────────────────────────────────────
const remarks = [];
remarks.push('This smoke report covers the overall happy flow tested by Playwright automation.');
if (totalFailed > 0) {
  remarks.push(`${totalFailed} test(s) failed and have been flagged for developer review.`);
}
if (totalSkipped > 0) {
  remarks.push(`${totalSkipped} test(s) were skipped — includes flows requiring unique codes or referral codes.`);
}
remarks.push('WhatsApp Bot flows are not automated (manual testing required).');
remarks.push(`Screenshots captured: ${screenshotCount} | Videos & Traces saved in reports/test-results/.`);

// ── HTML Report ───────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smoke Test Summary Report — ${runDate}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f0f4f8;
      color: #111827;
      padding: 32px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      overflow: hidden;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #0f4c1e 0%, #16a34a 100%);
      color: #fff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header .subtitle { font-size: 13px; opacity: 0.85; margin-top: 6px; }

    /* ── Meta info ── */
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .meta-item {
      padding: 10px 36px;
      font-size: 13px;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .meta-item:nth-child(even) { border-right: none; }
    .meta-item strong { color: #374151; }

    /* ── Section header ── */
    .section-title {
      background: #f9fafb;
      border-top: 2px solid #e5e7eb;
      border-bottom: 2px solid #e5e7eb;
      padding: 10px 36px;
      font-size: 14px;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Summary banner ── */
    .summary-banner {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #e5e7eb;
    }
    .stat-box {
      flex: 1;
      text-align: center;
      padding: 20px 10px;
      border-right: 1px solid #e5e7eb;
    }
    .stat-box:last-child { border-right: none; }
    .stat-box .num { font-size: 38px; font-weight: 900; line-height: 1; }
    .stat-box .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-top: 5px; }
    .num-total   { color: #1e3a5f; }
    .num-pass    { color: #16a34a; }
    .num-fail    { color: #dc2626; }
    .num-skip    { color: #d97706; }
    .num-rate    { color: #6366f1; }

    /* ── Tables ── */
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #1e3a5f;
      color: #ffffff;
      padding: 10px 16px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
    }
    th:not(:first-child) { text-align: center; }
    td { padding: 9px 16px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background: #f9fafb; }
    tr:hover { background: #eff6ff; }

    /* ── Remarks ── */
    .remarks {
      padding: 20px 36px;
      border-top: 2px solid #e5e7eb;
    }
    .remarks h3 { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .remarks ul { padding-left: 20px; }
    .remarks li { font-size: 13px; color: #4b5563; margin-bottom: 6px; line-height: 1.5; }

    /* ── Footer ── */
    .footer {
      background: #1e3a5f;
      color: rgba(255,255,255,0.7);
      text-align: center;
      padding: 14px;
      font-size: 11px;
    }
    .footer a { color: #86efac; text-decoration: none; }

    .wa-note {
      padding: 14px 36px;
      background: #fffbeb;
      border-top: 1px solid #fde68a;
      font-size: 13px;
      color: #92400e;
    }
  </style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <h1>🧪 Smoke Test Summary Report — Web / MWeb</h1>
    <div class="subtitle">Sprite Joke-In-A-Bottle &nbsp;|&nbsp; Automated Playwright Suite</div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-item"><strong>Date:</strong> ${runDate}</div>
    <div class="meta-item"><strong>Time:</strong> ${runTime} IST</div>
    <div class="meta-item"><strong>Tested By:</strong> Aman Kamal (Automation)</div>
    <div class="meta-item"><strong>Platform:</strong> Chrome (Desktop)</div>
    <div class="meta-item"><strong>OS:</strong> Windows</div>
    <div class="meta-item"><strong>Environment:</strong> Production</div>
    <div class="meta-item"><strong>Overall Status:</strong> ${overallStatus}</div>
    <div class="meta-item"><strong>Pass Rate:</strong> <span style="color:#6366f1;font-weight:700;">${passRate}%</span></div>
  </div>

  <!-- WEB Summary -->
  <div class="section-title">🌐 WEB Smoke Test Report</div>
  <div class="summary-banner">
    <div class="stat-box"><div class="num num-total">${total}</div><div class="lbl">Total Test Cases</div></div>
    <div class="stat-box"><div class="num num-pass">${totalPassed}</div><div class="lbl">Pass</div></div>
    <div class="stat-box"><div class="num num-fail">${totalFailed}</div><div class="lbl">Fail</div></div>
    <div class="stat-box"><div class="num num-skip">${totalSkipped}</div><div class="lbl">Skip</div></div>
    <div class="stat-box"><div class="num num-rate">${passRate}%</div><div class="lbl">Pass Rate</div></div>
  </div>

  <!-- Per-page breakdown -->
  <div class="section-title">📄 Page-wise Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Page / Feature</th>
        <th>Total</th>
        <th>Pass</th>
        <th>Fail</th>
        <th>Skip</th>
      </tr>
    </thead>
    <tbody>${detailRows}</tbody>
  </table>

  <!-- Failed Tests -->
  <div class="section-title">❌ Failed Test Cases</div>
  <table>
    <thead>
      <tr>
        <th>Test Case</th>
        <th>Page</th>
        <th>Error</th>
      </tr>
    </thead>
    <tbody>${failureRows}</tbody>
  </table>

  <!-- Skipped Tests -->
  <div class="section-title">⏭️ Skipped Test Cases</div>
  <table>
    <thead>
      <tr>
        <th>Test Case</th>
        <th>Page</th>
      </tr>
    </thead>
    <tbody>${skipRows}</tbody>
  </table>

  <!-- WhatsApp section -->
  <div class="section-title">💬 WhatsApp Smoke Report</div>
  <div class="wa-note">
    ⚠️ WhatsApp Bot flows are <strong>not automated</strong> in this suite.
    Manual testing is required. WhatsApp Bot is currently not responding — flows skipped.
  </div>
  <table>
    <thead>
      <tr><th>Total Flows</th><th>Pass</th><th>Fail</th><th>Skip</th></tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align:center;">6</td>
        <td style="text-align:center;color:#16a34a;font-weight:600;">0</td>
        <td style="text-align:center;color:#dc2626;font-weight:600;">0</td>
        <td style="text-align:center;color:#d97706;font-weight:600;">6</td>
      </tr>
    </tbody>
  </table>

  <!-- Remarks -->
  <div class="remarks">
    <h3>📝 Remarks</h3>
    <ul>
      ${remarks.map(r => `<li>${r}</li>`).join('\n      ')}
    </ul>
  </div>

  <!-- Footer -->
  <div class="footer">
    Generated automatically by Playwright Automation Suite &nbsp;|&nbsp;
    <a href="https://sprite-joke-in-a-bottle.coke2home.com">Sprite Joke-In-A-Bottle</a> &nbsp;|&nbsp;
    Sprite QA Team © ${now.getFullYear()}
  </div>

</div>
</body>
</html>`;

const htmlPath = path.join(SUMMARY_DIR, 'report.html');
fs.writeFileSync(htmlPath, html);

console.log(`\n✅ Smoke Test Report generated:`);
console.log(`   HTML → ${htmlPath}`);
console.log(`   JSON → ${path.join(SUMMARY_DIR, 'report.json')}`);
console.log(`\n📊 Results: ${totalPassed} passed | ${totalFailed} failed | ${totalSkipped} skipped | ${passRate}% pass rate`);
if (totalFailed > 0) {
  console.log(`\n❌ Failed tests:`);
  failedTests.forEach(t => console.log(`   [${t.page}] ${t.title}`));
}
