(function registerRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.GmailUnreadPhishingGuardRules = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createRules() {
  const suspiciousTlds = new Set([
    "click",
    "country",
    "download",
    "icu",
    "info",
    "loan",
    "mom",
    "rest",
    "shop",
    "support",
    "top",
    "win",
    "work",
    "xyz",
    "zip"
  ]);

  const freeMailDomains = new Set([
    "gmail.com",
    "googlemail.com",
    "hotmail.com",
    "icloud.com",
    "live.com",
    "outlook.com",
    "proton.me",
    "protonmail.com",
    "yahoo.com"
  ]);

  const brandRules = [
    {
      brand: "Google",
      keywords: ["google", "gmail", "workspace", "googIe"],
      allowedDomains: ["google.com", "gmail.com", "googlemail.com", "accounts.google.com"]
    },
    {
      brand: "Microsoft",
      keywords: ["microsoft", "office 365", "outlook", "onedrive", "teams", "azure"],
      allowedDomains: ["microsoft.com", "office.com", "outlook.com", "live.com", "microsoftonline.com"]
    },
    {
      brand: "Apple",
      keywords: ["apple", "icloud", "app store"],
      allowedDomains: ["apple.com", "icloud.com"]
    },
    {
      brand: "PayPal",
      keywords: ["paypal", "paypaI"],
      allowedDomains: ["paypal.com", "paypalobjects.com"]
    },
    {
      brand: "Amazon",
      keywords: ["amazon"],
      allowedDomains: ["amazon.com", "amazon.co.jp"]
    },
    {
      brand: "Meta",
      keywords: ["facebook", "instagram", "meta"],
      allowedDomains: ["facebook.com", "facebookmail.com", "instagram.com", "meta.com"]
    },
    {
      brand: "LINE",
      keywords: ["line", "line pay"],
      allowedDomains: ["line.me", "linecorp.com"]
    },
    {
      brand: "Netflix",
      keywords: ["netflix"],
      allowedDomains: ["netflix.com"]
    },
    {
      brand: "DHL",
      keywords: ["dhl"],
      allowedDomains: ["dhl.com"]
    },
    {
      brand: "FedEx",
      keywords: ["fedex"],
      allowedDomains: ["fedex.com"]
    },
    {
      brand: "UPS",
      keywords: ["ups"],
      allowedDomains: ["ups.com"]
    },
    {
      brand: "Shopee",
      keywords: ["shopee", "蝦皮"],
      allowedDomains: ["shopee.tw", "shopee.com"]
    },
    {
      brand: "Momo",
      keywords: ["momo", "富邦媒"],
      allowedDomains: ["momo.com.tw"]
    },
    {
      brand: "Chunghwa Post",
      keywords: ["中華郵政", "郵局", "post office"],
      allowedDomains: ["post.gov.tw"]
    },
    {
      brand: "Taiwan Motor Vehicle Services",
      keywords: ["交通部公路局", "交通部公路總局", "公路總局", "公路局", "監理服務網", "公路養管費", "汽燃費", "mvdis"],
      allowedDomains: ["mvdis.gov.tw", "thb.gov.tw", "motc.gov.tw"]
    },
    {
      brand: "Taiwan Banks",
      keywords: ["中國信託", "國泰世華", "台新銀行", "玉山銀行", "台灣銀行", "銀行通知"],
      allowedDomains: [
        "ctbcbank.com",
        "cathaybk.com.tw",
        "taishinbank.com.tw",
        "esunbank.com.tw",
        "bot.com.tw"
      ]
    }
  ];

  const signalTerms = {
    urgent: [
      "立即",
      "馬上",
      "限時",
      "最後通知",
      "帳號即將",
      "即將停用",
      "緊急",
      "逾期",
      "马上",
      "最后通知",
      "账号即将",
      "即将停用",
      "紧急",
      "暂停",
      "锁定",
      "至急",
      "最終通知",
      "本日中",
      "停止されます",
      "ロックされました",
      "期限切れ",
      "urgent",
      "immediately",
      "final notice",
      "action required",
      "expires today",
      "suspended",
      "locked",
      "urgente",
      "inmediatamente",
      "aviso final",
      "ultimo aviso",
      "último aviso",
      "vence hoy",
      "suspendida",
      "suspendido",
      "bloqueada",
      "bloqueado",
      "acción requerida",
      "dernier avis",
      "immédiatement",
      "expire aujourd'hui",
      "suspendu",
      "suspendue",
      "bloqué",
      "bloquée",
      "action requise"
    ],
    accountAccess: [
      "登入",
      "帳號",
      "身分",
      "身份",
      "登录",
      "账号",
      "账户",
      "ログイン",
      "サインイン",
      "アカウント",
      "本人確認",
      "login",
      "log in",
      "sign in",
      "account",
      "iniciar sesión",
      "acceder",
      "cuenta",
      "identidad",
      "connexion",
      "connecter",
      "compte",
      "identité"
    ],
    routineAccess: [
      "登入查看",
      "登入後查看",
      "登入以查看",
      "登入即可查看",
      "登录查看",
      "登录后查看",
      "登录以查看",
      "登录即可查看",
      "查看订单",
      "查看发票",
      "ログインして確認",
      "ログインして表示",
      "サインインして確認",
      "請求書を確認",
      "注文を確認",
      "配送状況を確認",
      "sign in to view",
      "login to view",
      "log in to view",
      "view your invoice",
      "view your order",
      "view your receipt",
      "view your shipment",
      "inicie sesión para ver",
      "iniciar sesión para ver",
      "acceda para ver",
      "ver su factura",
      "ver su pedido",
      "consulte su factura",
      "consultar pedido",
      "connectez-vous pour consulter",
      "connectez vous pour voir",
      "voir votre facture",
      "consulter votre facture",
      "voir votre commande",
      "consulter votre commande"
    ],
    credentialTheft: [
      "密碼",
      "驗證帳號",
      "確認帳號",
      "驗證您的帳號",
      "確認您的帳號",
      "重新啟用",
      "安全性警告",
      "輸入密碼",
      "更新密碼",
      "密码",
      "验证账号",
      "确认账号",
      "验证您的账号",
      "确认您的账号",
      "验证账户",
      "确认账户",
      "验证您的账户",
      "重新启用",
      "安全警告",
      "输入密码",
      "更新密码",
      "パスワード",
      "認証情報",
      "アカウントを確認",
      "アカウント確認",
      "再有効化",
      "セキュリティ警告",
      "パスワードを入力",
      "パスワードを更新",
      "verify",
      "password",
      "credential",
      "confirm your account",
      "security alert",
      "update your password",
      "enter your password",
      "reactivate",
      "verifique su cuenta",
      "confirmar su cuenta",
      "contraseña",
      "clave",
      "reactivar",
      "reactive su cuenta",
      "actualice su contraseña",
      "ingrese su contraseña",
      "vérifier votre compte",
      "confirmer votre compte",
      "mot de passe",
      "identifiants",
      "réactiver",
      "alerte de sécurité",
      "saisir votre mot de passe",
      "mettre à jour votre mot de passe"
    ],
    transactional: [
      "付款",
      "匯款",
      "繳費",
      "繳款",
      "繳納",
      "繳款單",
      "線上繳費",
      "電子繳款單",
      "發票",
      "退款",
      "帳單",
      "信用卡",
      "訂單",
      "收據",
      "汇款",
      "发票",
      "账单",
      "订单",
      "收据",
      "物流",
      "配送",
      "支払い",
      "送金",
      "請求書",
      "返金",
      "領収書",
      "注文",
      "クレジットカード",
      "請求",
      "payment",
      "payments",
      "invoice",
      "invoices",
      "refund",
      "refunds",
      "receipt",
      "receipts",
      "order",
      "orders",
      "shipment",
      "shipments",
      "wire transfer",
      "bank transfer",
      "billing",
      "pago",
      "transferencia",
      "factura",
      "reembolso",
      "recibo",
      "pedido",
      "envío",
      "tarjeta de crédito",
      "facturación",
      "paiement",
      "virement",
      "facture",
      "remboursement",
      "reçu",
      "commande",
      "livraison",
      "carte bancaire"
    ],
    lure: [
      "中獎",
      "抽獎",
      "禮品卡",
      "免費領取",
      "中奖",
      "抽奖",
      "礼品卡",
      "免费领取",
      "赠品",
      "当選",
      "抽選",
      "ギフトカード",
      "無料で受け取る",
      "賞品",
      "プレゼント",
      "gift card",
      "lottery",
      "winner",
      "prize",
      "giveaway",
      "tarjeta regalo",
      "lotería",
      "ganador",
      "premio",
      "sorteo",
      "regalo gratis",
      "carte cadeau",
      "loterie",
      "gagnant",
      "prix",
      "cadeau gratuit",
      "tirage"
    ],
    dangerousFile: [
      ".exe",
      ".scr",
      ".jse",
      ".vbs",
      ".wsf",
      ".bat",
      ".cmd",
      ".iso",
      ".img",
      ".html",
      ".htm",
      ".zip",
      ".rar",
      ".7z",
      "啟用巨集",
      "启用宏",
      "マクロを有効",
      "マクロ有効化",
      "enable macros",
      "habilitar macros",
      "activar macros",
      "activer les macros"
    ],
    taiwanTransportGovernment: [
      "交通部公路局",
      "交通部公路總局",
      "公路總局",
      "公路局",
      "監理服務網",
      "監理站",
      "監理所",
      "mvdis",
      "公路養管費",
      "汽燃費",
      "燃料使用費",
      "汽機車燃料費",
      "牌照稅",
      "交通罰鍰",
      "罰單"
    ],
    governmentPayment: [
      "電子繳款單",
      "線上繳費",
      "前往線上繳費",
      "繳費",
      "繳款",
      "繳納",
      "繳款單",
      "信用卡繳費",
      "超商補單",
      "超商繳費"
    ],
    identityData: [
      "身分證字號",
      "身份證字號",
      "統一編號",
      "識別碼",
      "證號",
      "車牌號碼",
      "車號",
      "信用卡卡號",
      "金融卡"
    ]
  };

  function normalizeText(value) {
    const text = String(value || "");
    const normalized = typeof text.normalize === "function" ? text.normalize("NFKC") : text;
    return normalized.replace(/\s+/g, " ").trim();
  }

  function normalizeForMatch(value) {
    return normalizeText(value).toLowerCase();
  }

  function foldLatinAccents(value) {
    const text = normalizeForMatch(value);
    const decomposed = typeof text.normalize === "function" ? text.normalize("NFD") : text;
    return decomposed.replace(/[\u0300-\u036f]/g, "");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function usesAsciiWordBoundaries(term) {
    const folded = foldLatinAccents(term);
    return /^[a-z0-9][a-z0-9\s'.-]*[a-z0-9]$/i.test(folded) && /[a-z]/i.test(folded);
  }

  function termMatches(normalizedText, foldedText, term) {
    const normalizedTerm = normalizeForMatch(term);
    if (!normalizedTerm) return false;

    const foldedTerm = foldLatinAccents(term);
    if (usesAsciiWordBoundaries(term)) {
      return new RegExp(`(^|[^a-z0-9])${escapeRegExp(foldedTerm)}(?=$|[^a-z0-9])`, "i").test(foldedText);
    }

    return normalizedText.includes(normalizedTerm) || foldedText.includes(foldedTerm);
  }

  function parseEmail(value) {
    const text = normalizeText(value);
    const angleMatch = text.match(/<([^<>@\s]+@[^<>\s]+)>/);
    if (angleMatch) return angleMatch[1].toLowerCase();

    const emailMatch = text.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    return emailMatch ? emailMatch[0].toLowerCase() : "";
  }

  function getEmailDomain(value) {
    const email = parseEmail(value);
    const parts = email.split("@");
    return parts.length === 2 ? parts[1].toLowerCase() : "";
  }

  function getTld(host) {
    const clean = String(host || "").toLowerCase();
    const parts = clean.split(".").filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : "";
  }

  function baseDomain(host) {
    const clean = String(host || "").replace(/^www\./i, "").toLowerCase();
    const parts = clean.split(".").filter(Boolean);
    if (parts.length <= 2) return clean;

    const lastThree = parts.slice(-3).join(".");
    if (/\.com\.tw$|\.gov\.tw$|\.org\.tw$|\.co\.jp$|\.com\.au$|\.co\.uk$/.test(lastThree)) {
      return lastThree;
    }

    return parts.slice(-2).join(".");
  }

  function domainAllowed(host, allowedDomains) {
    const cleanHost = String(host || "").toLowerCase();
    const hostBase = baseDomain(cleanHost);
    return allowedDomains.some((allowed) => {
      const cleanAllowed = allowed.toLowerCase();
      return cleanHost === cleanAllowed || cleanHost.endsWith(`.${cleanAllowed}`) || hostBase === baseDomain(cleanAllowed);
    });
  }

  function urlHost(value) {
    try {
      return new URL(String(value || "")).hostname.replace(/\.$/, "").toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function isTaiwanGovDomain(host) {
    const clean = String(host || "").replace(/\.$/, "").toLowerCase();
    return clean === "gov.tw" || clean.endsWith(".gov.tw");
  }

  function containsAny(text, terms) {
    const normalizedText = normalizeForMatch(text);
    const foldedText = foldLatinAccents(text);
    return terms.filter((term) => termMatches(normalizedText, foldedText, term));
  }

  function skeleton(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/[0]/g, "o")
      .replace(/[1l|]/g, "i")
      .replace(/[5$]/g, "s")
      .replace(/[3]/g, "e")
      .replace(/[4@]/g, "a")
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
  }

  function findMentionedBrands(text) {
    const lower = normalizeForMatch(text);
    return brandRules.filter((rule) => rule.keywords.some((keyword) => lower.includes(normalizeForMatch(keyword))));
  }

  function hasRoutineAccessContext(text) {
    return containsAny(text, signalTerms.routineAccess).length > 0;
  }

  function threatDetails(threats) {
    return (Array.isArray(threats) ? threats : [])
      .flatMap((threat) => {
        if (!threat) return [];
        if (Array.isArray(threat.threatTypes)) return threat.threatTypes;
        if (Array.isArray(threat.fullHashDetails)) {
          return threat.fullHashDetails.map((detail) => detail && detail.threatType).filter(Boolean);
        }
        return threat.threatType ? [threat.threatType] : [];
      })
      .filter(Boolean)
      .slice(0, 4);
  }

  function severityWeight(severity) {
    if (severity === "critical") return 45;
    if (severity === "high") return 30;
    if (severity === "medium") return 16;
    return 6;
  }

  function riskFromScore(score) {
    if (score >= 70) return { key: "critical", label: "極高風險" };
    if (score >= 45) return { key: "high", label: "高風險" };
    if (score >= 20) return { key: "medium", label: "中度風險" };
    return { key: "low", label: "低風險" };
  }

  function addIssue(issues, severity, title, detail) {
    issues.push({ severity, title, detail });
  }

  function uniqueIssues(issues) {
    const seen = new Set();
    const result = [];
    for (const issue of issues) {
      const key = `${issue.severity}|${issue.title}|${issue.detail}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(issue);
      }
    }
    return result;
  }

  function analyzeMessage(input) {
    const sender = normalizeText(input && input.sender);
    const subject = normalizeText(input && input.subject);
    const snippet = normalizeText(input && input.snippet);
    const urls = Array.isArray(input && input.urls) ? input.urls.filter(Boolean).slice(0, 10) : [];
    const safeBrowsingThreats = Array.isArray(input && input.safeBrowsingThreats) ? input.safeBrowsingThreats : [];
    const senderDomain = getEmailDomain(sender);
    const fullText = normalizeText(`${sender} ${subject} ${snippet}`);
    const issues = [];
    const brands = findMentionedBrands(fullText);
    const senderSignals = {
      hasParseableDomain: Boolean(senderDomain),
      allowedBrandDomain: false,
      suspiciousDomain: false,
      untrustedBrandDomain: false
    };

    if (senderDomain) {
      if (senderDomain.includes("xn--")) {
        addIssue(issues, "high", "寄件者網域疑似混淆", `${senderDomain} 使用 punycode`);
        senderSignals.suspiciousDomain = true;
      }

      if (suspiciousTlds.has(getTld(senderDomain))) {
        addIssue(issues, "medium", "寄件者使用高風險網域", senderDomain);
        senderSignals.suspiciousDomain = true;
      }

      if (freeMailDomains.has(baseDomain(senderDomain)) && brands.length > 0) {
        addIssue(issues, "medium", "品牌通知使用免費信箱", `${brands[0].brand} 相關信件卻來自 ${senderDomain}`);
        senderSignals.untrustedBrandDomain = true;
      }

      const senderSkeleton = skeleton(baseDomain(senderDomain));
      for (const brand of brands) {
        const allowed = domainAllowed(senderDomain, brand.allowedDomains);
        const brandLooksPresent = brand.keywords.some((keyword) => senderSkeleton.includes(skeleton(keyword)));

        if (allowed) {
          senderSignals.allowedBrandDomain = true;
        } else if (brandLooksPresent) {
          addIssue(issues, "high", `疑似冒充 ${brand.brand}`, `寄件網域 ${senderDomain} 看起來像品牌但不是官方網域`);
          senderSignals.suspiciousDomain = true;
          senderSignals.untrustedBrandDomain = true;
        } else if (brands.length === 1) {
          addIssue(issues, "medium", `疑似冒充 ${brand.brand}`, `寄件網域 ${senderDomain} 不在常見官方網域清單`);
          senderSignals.untrustedBrandDomain = true;
        }
      }
    } else if (brands.length > 0) {
      addIssue(issues, "low", "無法確認寄件網域", "目前郵件列表未提供可解析的寄件者 email");
    }

    const urgentHits = containsAny(fullText, signalTerms.urgent);
    const accountAccessHits = containsAny(fullText, signalTerms.accountAccess);
    const credentialTheftHits = containsAny(fullText, signalTerms.credentialTheft);
    const transactionalHits = containsAny(fullText, signalTerms.transactional);
    const lureHits = containsAny(fullText, signalTerms.lure);
    const fileHits = containsAny(fullText, signalTerms.dangerousFile);
    const taiwanTransportGovernmentHits = containsAny(fullText, signalTerms.taiwanTransportGovernment);
    const governmentPaymentHits = containsAny(fullText, signalTerms.governmentPayment);
    const identityDataHits = containsAny(fullText, signalTerms.identityData);
    const routineAccess = hasRoutineAccessContext(fullText);

    if (taiwanTransportGovernmentHits.length > 0 && governmentPaymentHits.length > 0) {
      const detail = [taiwanTransportGovernmentHits[0], governmentPaymentHits[0], identityDataHits[0]]
        .filter(Boolean)
        .join(" / ");
      addIssue(issues, "high", "政府機關繳費信需人工確認", detail);
    }

    const offsiteGovernmentPaymentHosts =
      taiwanTransportGovernmentHits.length > 0 && governmentPaymentHits.length > 0
        ? urls.map(urlHost).filter((host) => host && !isTaiwanGovDomain(host))
        : [];
    if (offsiteGovernmentPaymentHosts.length > 0) {
      addIssue(issues, "high", "政府繳費連結不在 .gov.tw 網域", offsiteGovernmentPaymentHosts[0]);
    }

    if (urgentHits.length > 0 && (credentialTheftHits.length > 0 || accountAccessHits.length > 0)) {
      addIssue(
        issues,
        "high",
        "急迫要求處理帳號",
        `${urgentHits[0]} / ${(credentialTheftHits[0] || accountAccessHits[0])}`
      );
    } else if (urgentHits.length > 0) {
      addIssue(issues, "medium", "強烈急迫語氣", urgentHits.slice(0, 3).join(", "));
    }

    if (transactionalHits.length > 0 && credentialTheftHits.length > 0) {
      const severity = senderSignals.suspiciousDomain || senderSignals.untrustedBrandDomain || urgentHits.length > 0 ? "medium" : "low";
      addIssue(issues, severity, "交易通知包含敏感帳號要求", `${transactionalHits[0]} / ${credentialTheftHits[0]}`);
    } else if (
      transactionalHits.length > 0 &&
      accountAccessHits.length > 0 &&
      !routineAccess &&
      (senderSignals.suspiciousDomain || urgentHits.length > 0)
    ) {
      addIssue(issues, "medium", "交易通知搭配可疑帳號操作", `${transactionalHits[0]} / ${accountAccessHits[0]}`);
    }

    if (lureHits.length > 0) {
      addIssue(issues, "medium", "中獎或禮品卡話術", lureHits.slice(0, 3).join(", "));
    }

    if (fileHits.length > 0) {
      const macroHit = fileHits.some((hit) => /巨集|宏|マクロ|macro/i.test(hit));
      addIssue(
        issues,
        macroHit || fileHits.length > 1 ? "high" : "medium",
        "提到高風險檔案或巨集",
        fileHits.slice(0, 3).join(", ")
      );
    }

    const safeBrowsingDetails = threatDetails(safeBrowsingThreats);
    if (safeBrowsingThreats.length > 0) {
      addIssue(
        issues,
        "high",
        "Safe Browsing API 回報潛在風險 URL",
        safeBrowsingDetails.length > 0 ? safeBrowsingDetails.join(", ") : "Google Safe Browsing API threat match"
      );
    }

    const issuesOut = uniqueIssues(issues);
    const rawScore = issuesOut.reduce((total, issue) => total + severityWeight(issue.severity), 0);
    const score = Math.min(100, rawScore);
    const senderConfidence = senderSignals.suspiciousDomain
      ? "suspicious"
      : senderSignals.allowedBrandDomain
        ? "trusted"
        : senderSignals.hasParseableDomain
          ? "untrusted"
          : "unknown";

    return {
      score,
      risk: riskFromScore(score),
      issues: issuesOut.slice(0, 8),
      senderConfidence,
      senderDomain,
      urls,
      scannedFields: {
        sender: Boolean(sender),
        subject: Boolean(subject),
        snippet: Boolean(snippet)
      }
    };
  }

  function meetsThreshold(riskKey, threshold) {
    const order = { low: 0, medium: 1, high: 2, critical: 3 };
    return order[riskKey] >= order[threshold || "medium"];
  }

  return {
    analyzeMessage,
    baseDomain,
    getEmailDomain,
    meetsThreshold,
    normalizeText,
    parseEmail,
    riskFromScore
  };
});
