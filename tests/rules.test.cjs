const assert = require("node:assert/strict");
const rules = require("../extension/src/rules.js");

function analyze(input) {
  return rules.analyzeMessage(input);
}

function assertBelowDefaultThreshold(input, label) {
  const result = analyze(input);
  assert.equal(
    rules.meetsThreshold(result.risk.key, "medium"),
    false,
    `${label} expected below default threshold, got ${result.risk.key} (${result.score})`
  );
  return result;
}

function assertVisibleRisk(input, label) {
  const result = analyze(input);
  assert.equal(
    rules.meetsThreshold(result.risk.key, "medium"),
    true,
    `${label} expected visible risk, got ${result.risk.key} (${result.score})`
  );
  return result;
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
  const result = assertVisibleRisk({
    sender: "Google Support <security@google-account-support.xyz>",
    subject: "帳號即將停用，請立即登入驗證",
    snippet: "Your account will be suspended. Verify password now."
  }, "google lookalike credential phish");
  assert.ok(result.score >= 45, `expected high score, got ${result.score}`);
  assert.match(result.issues.map((issue) => issue.title).join(" "), /Google|急迫/);
}

{
  const result = assertVisibleRisk({
    sender: "PayPal Billing <billing.paypal@secure-payment.shop>",
    subject: "Final notice: confirm your account",
    snippet: "Payment is on hold. Login to verify your password."
  }, "paypal suspicious payment phish");
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
  assertBelowDefaultThreshold(
    {
      sender: "Shopee <no-reply@shopee.tw>",
      subject: "蝦皮購買發票證明",
      snippet: "您的電子發票已開立，登入即可查看訂單紀錄。"
    },
    "trusted shopee invoice"
  );
}

{
  const result = assertBelowDefaultThreshold(
    {
      sender: "蝦皮購物",
      subject: "蝦皮購買發票證明",
      snippet: "請登入查看您的電子發票與訂單紀錄。"
    },
    "unknown sender routine shopee invoice"
  );
  assert.equal(result.senderConfidence, "unknown");
}

{
  assertBelowDefaultThreshold(
    {
      sender: "momo購物網 <service@momo.com.tw>",
      subject: "momo 訂單發票通知",
      snippet: "您的發票與訂單明細已成立，登入會員中心即可查看。"
    },
    "trusted momo invoice"
  );
}

{
  assertBelowDefaultThreshold(
    {
      sender: "銀行通知 <notice@ctbcbank.com>",
      subject: "信用卡帳單通知",
      snippet: "本期帳單已產生，請登入網銀查看明細。"
    },
    "trusted bank billing notice"
  );
}

{
  assertBelowDefaultThreshold(
    {
      sender: "DHL Express <notice@dhl.com>",
      subject: "Shipment receipt",
      snippet: "Your receipt and order shipment details are available to view."
    },
    "trusted logistics receipt"
  );
}

const multilingualBenignTransactionalCases = [
  {
    label: "trusted simplified chinese order receipt",
    input: {
      sender: "Amazon <shipment@amazon.com>",
      subject: "订单收据",
      snippet: "登录即可查看您的发票和配送信息。"
    }
  },
  {
    label: "trusted japanese delivery receipt",
    input: {
      sender: "Amazon <shipment@amazon.co.jp>",
      subject: "注文の領収書",
      snippet: "ログインして配送状況を確認できます。"
    }
  },
  {
    label: "trusted spanish invoice routine access",
    input: {
      sender: "DHL Express <notice@dhl.com>",
      subject: "Recibo de envio",
      snippet: "Inicie sesion para ver su factura y los detalles de su pedido."
    }
  },
  {
    label: "trusted french invoice routine access",
    input: {
      sender: "DHL Express <notice@dhl.com>",
      subject: "Facture de livraison",
      snippet: "Connectez-vous pour consulter votre commande."
    }
  }
];

for (const { input, label } of multilingualBenignTransactionalCases) {
  assertBelowDefaultThreshold(input, label);
}

{
  assertVisibleRisk(
    {
      sender: "Shopee <service@notice.shop>",
      subject: "蝦皮購買發票證明",
      snippet: "請登入查看您的電子發票。"
    },
    "shopee suspicious domain invoice"
  );
}

{
  assertVisibleRisk(
    {
      sender: "Bank Notice <security@billing-alert.info>",
      subject: "最後通知：帳號即將停用",
      snippet: "請立即驗證您的帳號並輸入密碼以恢復付款功能。"
    },
    "urgent credential theft"
  );
}

const multilingualCredentialPhishingCases = [
  {
    label: "simplified chinese credential pressure",
    input: {
      sender: "系统通知 <notice@system-alert.info>",
      subject: "最后通知：账号即将停用",
      snippet: "请立即验证您的账号并输入密码。"
    }
  },
  {
    label: "japanese credential pressure",
    input: {
      sender: "Security <notice@system-alert.info>",
      subject: "最終通知: アカウントが停止されます",
      snippet: "パスワードを確認してアカウントを再有効化してください。"
    }
  },
  {
    label: "spanish credential pressure without accent",
    input: {
      sender: "Soporte <notice@system-alert.info>",
      subject: "Aviso final: su cuenta sera suspendida",
      snippet: "Verifique su contrasena para reactivar su cuenta."
    }
  },
  {
    label: "french credential pressure without accent",
    input: {
      sender: "Securite <notice@system-alert.info>",
      subject: "Dernier avis: votre compte sera suspendu",
      snippet: "Veuillez verifier votre compte pour reactiver votre compte."
    }
  }
];

for (const { input, label } of multilingualCredentialPhishingCases) {
  const result = assertVisibleRisk(input, label);
  assert.ok(result.score >= 45, `${label} expected high score, got ${result.score}`);
}

const mixedLanguageCredentialCases = [
  {
    label: "paypal spanish credential impersonation",
    input: {
      sender: "PayPal Support <security@paypal-secure.xyz>",
      subject: "PayPal aviso final",
      snippet: "Verifique su contrasena para reactivar su cuenta."
    }
  },
  {
    label: "google japanese credential impersonation",
    input: {
      sender: "Google Security <alert@google-account-support.xyz>",
      subject: "Google 最終通知",
      snippet: "アカウントを確認し、パスワードを更新してください。"
    }
  }
];

for (const { input, label } of mixedLanguageCredentialCases) {
  const result = assertVisibleRisk(input, label);
  assert.match(result.issues.map((issue) => issue.title).join(" "), /Google|PayPal|急迫/);
}

{
  assertVisibleRisk(
    {
      sender: "Netflix Prize <winner@streaming-gift.xyz>",
      subject: "You are a gift card winner",
      snippet: "Claim your prize now. Login to confirm your account."
    },
    "lure with suspicious domain"
  );
}

{
  assertVisibleRisk(
    {
      sender: "Netflix Promo <winner@streaming-gift.xyz>",
      subject: "Ganador de tarjeta regalo",
      snippet: "Reclame su premio gratis ahora."
    },
    "spanish lure with suspicious domain"
  );
}

{
  assertVisibleRisk(
    {
      sender: "IT Support <support@company.example>",
      subject: "請開啟附件 invoice.zip",
      snippet: "Enable macros to view the billing document."
    },
    "dangerous file and macro"
  );
}

{
  assertVisibleRisk(
    {
      sender: "IT Support <support@company.example>",
      subject: "請求書.zip",
      snippet: "マクロを有効にして表示してください。"
    },
    "japanese dangerous file and macro"
  );
}

{
  assertVisibleRisk(
    {
      sender: "Unknown <notice@example.com>",
      subject: "請檢查連結",
      snippet: "這封信包含可疑連結。",
      safeBrowsingThreats: [{ url: "https://bad.example", threatTypes: ["SOCIAL_ENGINEERING"] }]
    },
    "safe browsing threat"
  );
}

{
  assertBelowDefaultThreshold(
    {
      sender: "Newsletter <notice@example.com>",
      subject: "Final notice about accounting newsletter",
      snippet: "No user action is requested."
    },
    "latin boundary avoids account inside accounting"
  );
}

{
  assert.equal(rules.getEmailDomain("Name <person@example.com>"), "example.com");
  assert.equal(rules.baseDomain("mail.google.com"), "google.com");
  assert.equal(rules.baseDomain("service.momo.com.tw"), "momo.com.tw");
  assert.equal(rules.normalizeText("ＡＢＣ　パスワード"), "ABC パスワード");
}

console.log("Rule tests passed.");
