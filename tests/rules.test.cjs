const assert = require("node:assert/strict");
const rules = require("../extension/src/rules.js");

function analyze(input) {
  return rules.analyzeMessage(input);
}

{
  const result = analyze({
    sender: "Google Security <no-reply@accounts.google.com>",
    subject: "Security alert",
    snippet: "A new sign-in was detected."
  });
  assert.equal(result.risk.key, "low");
}

{
  const result = analyze({
    sender: "Google Support <security@google-account-support.xyz>",
    subject: "帳號即將停用，請立即登入驗證",
    snippet: "Your account will be suspended. Verify password now."
  });
  assert.ok(result.score >= 45, `expected high score, got ${result.score}`);
  assert.match(result.issues.map((issue) => issue.title).join(" "), /Google|急迫/);
}

{
  const result = analyze({
    sender: "PayPal Billing <billing.paypal@secure-payment.shop>",
    subject: "Final notice: confirm your account",
    snippet: "Payment is on hold. Login to verify your password."
  });
  assert.ok(["high", "critical"].includes(result.risk.key), `expected high or critical, got ${result.risk.key}`);
}

{
  const result = analyze({
    sender: "Friend <friend@gmail.com>",
    subject: "週末聚餐照片",
    snippet: "照片整理好了，有空再看"
  });
  assert.equal(result.risk.key, "low");
}

{
  assert.equal(rules.getEmailDomain("Name <person@example.com>"), "example.com");
  assert.equal(rules.baseDomain("mail.google.com"), "google.com");
  assert.equal(rules.baseDomain("service.momo.com.tw"), "momo.com.tw");
}

console.log("Rule tests passed.");
