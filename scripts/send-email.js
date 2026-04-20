/**
 * send-email.js
 * Reads reports/summary/report.html and emails it to the configured recipients.
 *
 * Required .env variables:
 *   EMAIL_FROM       — sender Gmail address
 *   EMAIL_PASSWORD   — Gmail App Password (not your login password)
 *   EMAIL_TO         — comma-separated recipient emails
 *
 * Run: node scripts/send-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

const REPORT_HTML = path.resolve(__dirname, '../reports/summary/report.html');
const REPORT_JSON = path.resolve(__dirname, '../reports/summary/report.json');

// ── Validate env ──────────────────────────────────────────────────────────────
const { EMAIL_FROM, EMAIL_PASSWORD, EMAIL_TO } = process.env;

if (!EMAIL_FROM || !EMAIL_PASSWORD || !EMAIL_TO) {
  console.error('❌ Missing email config in .env');
  console.error('   Set EMAIL_FROM, EMAIL_PASSWORD, EMAIL_TO');
  process.exit(1);
}

if (!fs.existsSync(REPORT_HTML)) {
  console.error('❌ reports/summary/report.html not found. Run: node scripts/generate-report.js first.');
  process.exit(1);
}

// ── Load summary for subject line ─────────────────────────────────────────────
let summary = { totalPassed: '?', totalFailed: '?', passRate: '?', runDate: new Date().toLocaleString() };
if (fs.existsSync(REPORT_JSON)) {
  summary = { ...summary, ...JSON.parse(fs.readFileSync(REPORT_JSON, 'utf-8')) };
}

const statusLabel = summary.totalFailed === 0
  ? `✅ ALL PASSED (${summary.totalPassed} tests)`
  : `❌ ${summary.totalFailed} FAILED — ${summary.totalPassed} passed`;

const subject = `[Sprite QA] Test Report — ${statusLabel} | ${summary.runDate}`;

// ── Collect screenshot attachments (only failed test screenshots) ──────────────
const SCREENSHOTS_DIR = path.resolve(__dirname, '../reports/screenshots');
const attachments = [];

if (fs.existsSync(SCREENSHOTS_DIR)) {
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  for (const file of files) {
    attachments.push({
      filename: file,
      path: path.join(SCREENSHOTS_DIR, file),
      cid: file, // for inline references if needed
    });
  }
}

// ── Plain-text fallback body ───────────────────────────────────────────────────
const textBody = `
Sprite Joke-In-A-Bottle — Automation Test Report
=================================================
Run Date  : ${summary.runDate}
Total     : ${summary.total}
Passed    : ${summary.totalPassed}
Failed    : ${summary.totalFailed}
Skipped   : ${summary.totalSkipped}
Pass Rate : ${summary.passRate}%

${summary.totalFailed > 0 ? 'FAILURES:\n' + (summary.pages || [])
  .flatMap(p => p.failures.map(f => `  [${p.page}] ${f.title}\n  → ${f.error}`))
  .join('\n\n') : 'All tests passed!'}

See attached HTML report for full details with screenshots.
`.trim();

// ── Send email ─────────────────────────────────────────────────────────────────
async function sendEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_FROM, pass: EMAIL_PASSWORD },
  });

  const recipients = EMAIL_TO.split(',').map(e => e.trim()).join(', ');

  const mailOptions = {
    from:        `"Sprite QA Bot" <${EMAIL_FROM}>`,
    to:          recipients,
    subject,
    text:        textBody,
    html:        fs.readFileSync(REPORT_HTML, 'utf-8'),
    attachments: [
      // Attach the HTML report as a file too
      {
        filename: `sprite-test-report-${new Date().toISOString().slice(0,10)}.html`,
        path:     REPORT_HTML,
      },
      // Attach all screenshots
      ...attachments,
    ],
  };

  console.log(`\n📧 Sending report to: ${recipients}`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent! Message ID: ${info.messageId}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Attachments: ${attachments.length} screenshot(s)`);
}

sendEmail().catch(err => {
  console.error('❌ Email send failed:', err.message);
  process.exit(1);
});
