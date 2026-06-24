import { useState } from "react";

const PROTOCOLS = {
  MCP: { name: "MCP", full: "Model Context Protocol", color: "#818cf8", always: true, walletOk: true, desc: "Universal tool-call standard. Lets any AI agent call the platform's payment-enabled API using a standardised schema — built once, callable by every agent." },
  ACP: { name: "ACP", full: "Agent Commerce Protocol", color: "#a78bfa", always: true, walletOk: true, desc: "Checkout handshake between agent and merchant. Governs item selection, price confirmation, and payment intent — no human touches a form." },
  KYA: { name: "KYA", full: "Know Your Agent", color: "#c084fc", always: true, walletOk: true, desc: "Identity + authorization layer. Verifies which agent is calling, whether the consumer delegated authority, and whether spend limits are being honored." },
  TAP: { name: "Visa TAP", full: "Visa Trusted Agent Protocol", color: "#60a5fa", always: false, walletOk: false, network: "visa", desc: "Visa's agent credential. Verifies the AI agent holds a trusted credential for the consumer's Visa card. Fraud-liability shifts to the network — seller is protected." },
  MC: { name: "MC Agent Token", full: "Mastercard Agent Pay", color: "#f87171", always: false, walletOk: false, network: "mc", desc: "Single-use token bound to agent identity + merchant + transaction amount. Buyer's real card number never travels through the flow. Token expires after this transaction." },
  ONCHAIN_SIG: { name: "On-chain Signature", full: "Wallet Auth — EIP-712 / SIWE", color: "#22d3ee", always: false, walletOk: true, network: "wallet", desc: "Buyer's crypto wallet signs the payment intent directly using EIP-712 structured data (or Sign-In With Ethereum). No card network involved — the wallet signature is the authorization. Replaces Visa TAP and MC Agent Token entirely." },
  ONCHAIN_KYW: { name: "KYW", full: "Know Your Wallet", color: "#34d399", always: false, walletOk: true, network: "wallet", desc: "On-chain identity check: verifies the Buyer's wallet address is not sanctioned, has sufficient USDC balance, and passes AML screening. The on-chain equivalent of KYC — no card issuer required." },
};

const STABLECOIN = {
  traditional: {
    label: "Traditional rail",
    icon: "🏦",
    color: "#64748b",
    settlement: "T+1 to T+2",
    cost: "Card network fees + interchange",
    fx: "FX spread applied at settlement",
    desc: "Standard card network or ACH settlement. Authorization flows through Visa/Mastercard network. Settlement arrives T+1 domestic, T+2 to T+5 cross-border.",
    isvNote: "Seller DDA funded via ACH. Working capital eligibility based on settled volume.",
    isoNote: "Seller's existing DDA funded on their normal settlement cycle. ISO has no influence on timing.",
    directNote: "Platform batch-settles to sellers on T+1 or T+2 cycle. Sellers wait for payout.",
  },
  stablecoin: {
    label: "Stablecoin rail (USDC)",
    icon: "🔵",
    color: "#22d3ee",
    settlement: "Near-instant (< 30 seconds)",
    cost: "Gas fees only — no interchange",
    fx: "No FX spread — USDC is USD-pegged",
    desc: "Settlement routed to on-chain USDC rail after authorization clears. Auth protocols (MCP, ACP, KYA, Visa TAP / MC Token) fire identically — stablecoin sits downstream of authorization, replacing the traditional settlement rail only.",
    isvNote: "Seller receives USDC to embedded wallet instantly. Can auto-convert to local currency or hold as USDC. ISV offers stablecoin-denominated working capital.",
    isoNote: "Opt-in only — Seller chooses USDC payout alongside or instead of existing DDA. ISO routes stablecoin settlement for participating merchants. Non-participating merchants unchanged.",
    directNote: "Platform settles to Sellers globally in USDC. No correspondent banking, no SWIFT, no FX spread. Seller in any geography receives USDC instantly and converts locally at their discretion.",
  },
};

const CHANNEL_DATA = {
  isv: {
    label: "ISV", full: "Independent Software Vendor",
    ownership: "Owns Seller",
    primaryAsset: "Seller Network",
    control: "High",
    gtmModels: ["Platform PayFac", "PayFac-as-a-Service", "Embedded Finance"],
    outcome: "Own seller relationship and financial lifecycle.",
    desc: "A SaaS platform that embeds payments into its product. One ISV integration makes every sub-merchant on the platform agent-accessible — sub-merchants do nothing themselves.",
    mcpCaller: "ISV SaaS platform", mcpTool: "isv_book_service",
    mcpNote: "The ISV built and owns this MCP tool. It lives inside their SaaS product. Every agent calls the ISV directly — the ISV is the merchant endpoint.",
    step0: {
      title: "ISV onboards Seller as a sub-merchant via PayFac API",
      note: "The ISV is the registered PayFac. It onboards Seller on their behalf — Seller never integrates anything directly.",
      items: [
        { step: "KYB check", desc: "ISV submits Seller's business identity via PayFac API. Risk assessed. AML screening passed on Seller's behalf.", color: "#fbbf24" },
        { step: "DDA provisioned", desc: "Seller's bank account opened on the ISV's embedded finance ledger. Settlement flows here automatically.", color: "#34d399" },
        { step: "MID assigned", desc: "Merchant ID issued under the ISV's PayFac umbrella. Card network routing and fraud stack configured.", color: "#818cf8" },
        { step: "MCP tool registered", desc: "Seller's services automatically published to the ISV's MCP tool. No action needed from Seller — they are now agent-discoverable.", color: "#c084fc" },
      ],
      insight: "Seller is now agent-discoverable without doing anything themselves. The ISV's single PayFac registration made it possible for all 500+ sub-merchants simultaneously.",
    },
    step3: {
      title: "ISV matches Seller from its own sub-merchant graph",
      note: "The ISV owns the supply side. It queries its own sub-merchant index — not a third-party directory.",
      items: [
        "Queries ISV's own sub-merchant index — 500+ sellers evaluated in milliseconds",
        "Seller / Service Provider — 4.9★ · available Saturday 9am · verified sub-merchant",
        "Slot locked inside ISV's scheduling system — Seller's calendar updated in real time",
        "ISV calls payment layer directly as registered PayFac — no intermediary",
      ],
      callInitiator: "Payment API call initiated by: ISV platform (as registered PayFac)",
    },
    step6: {
      title: "Seller's financial layer unlocks — inside the ISV",
      note: "Seller banks inside the ISV's embedded finance layer. This is the closed-loop economic moat.",
      itemsTraditional: [
        { label: "DDA balance", val: "+$120", sub: "Settled to ISV's embedded ledger · T+1", color: "#34d399" },
        { label: "Working capital", val: "Eligible", sub: "ISV offers advance based on settled volume", color: "#818cf8" },
        { label: "Branded card", val: "Active", sub: "ISV-branded card, spending power grows with volume", color: "#fbbf24" },
      ],
      itemsStablecoin: [
        { label: "USDC balance", val: "+120 USDC", sub: "Settled to Seller's embedded wallet · < 30 sec", color: "#22d3ee" },
        { label: "Working capital", val: "Eligible", sub: "Stablecoin-denominated advance available instantly", color: "#818cf8" },
        { label: "Branded card", val: "Active", sub: "Card funded from USDC wallet balance", color: "#fbbf24" },
      ],
      flywheelTraditional: [
        "More AI agents discover Seller via ISV's MCP tool",
        "More bookings flow through the ISV platform",
        "Seller's DDA engagement deepens inside the ISV",
        "ISV offers working capital advance",
        "ISV-branded card issued — Seller spends on platform",
        "Seller's entire financial life embedded in the ISV",
        "Switching cost becomes structural — Seller never leaves",
      ],
      flywheelStablecoin: [
        "More AI agents discover Seller via ISV's MCP tool",
        "More bookings flow — Seller receives USDC instantly",
        "Faster settlement → higher Seller satisfaction → lower churn",
        "ISV offers USDC-denominated working capital — no bank required",
        "Seller holds USDC balance in ISV wallet — spends on platform",
        "Seller's financial life fully programmable inside the ISV",
        "Stablecoin switching cost is even deeper — no legacy rail to fall back on",
      ],
    },
  },
  iso: {
    label: "ISO", full: "Independent Sales Organisation",
    ownership: "Owns Access",
    primaryAsset: "Access Network",
    control: "Medium",
    gtmModels: ["ISO Gateway", "Agentic Gateway"],
    outcome: "Extend reach to existing merchant portfolios.",
    desc: "A reseller with an existing merchant portfolio. The ISO adds an MCP gateway on top of merchants already processing through their channel — no stack change for merchants.",
    mcpCaller: "ISO MCP gateway", mcpTool: "iso_merchant_gateway",
    mcpNote: "The ISO operates a middleware MCP gateway. It sits between the AI agent and the merchant's existing terminal. Merchants don't change anything — the ISO adds the agentic layer.",
    step0: {
      title: "ISO maps existing merchant portfolio to MCP-discoverable endpoints",
      note: "Sellers already have MIDs and existing DDA accounts. The ISO doesn't provision new ones — it maps existing relationships to its MCP gateway.",
      items: [
        { step: "Portfolio mapping", desc: "ISO maps existing merchant MIDs to MCP endpoint identifiers. No new MID issued — existing processing relationship preserved.", color: "#fbbf24" },
        { step: "Capability registration", desc: "Each merchant's service categories and availability registered in ISO's MCP gateway index. Merchant confirms scope only.", color: "#34d399" },
        { step: "Gateway routing configured", desc: "ISO's middleware routing table updated — agent calls routed to the right merchant terminal based on MCP tool call parameters.", color: "#818cf8" },
        { step: "MCP gateway published", desc: "ISO's MCP gateway endpoint published. AI agents call the ISO gateway — the ISO routes internally to the right merchant.", color: "#c084fc" },
      ],
      insight: "Sellers keep everything they have — their existing MID, their existing DDA, their existing processor. The ISO adds an MCP gateway layer on top. Zero disruption to the merchant.",
    },
    step3: {
      title: "ISO routes to Seller via its merchant terminal routing table",
      note: "The ISO does not own the matching logic — it owns the routing table. It finds the right merchant from its portfolio and routes the transaction.",
      items: [
        "ISO gateway queries its merchant routing table — matches by service type, location, availability",
        "Seller / Service Provider — 4.9★ · available Saturday 9am · existing ISO merchant",
        "ISO middleware sends booking instruction to Seller's existing terminal",
        "ISO calls payment layer on merchant's behalf — using merchant's existing MID",
      ],
      callInitiator: "Payment API call initiated by: ISO middleware (on behalf of existing merchant MID)",
    },
    step6: {
      title: "Seller receives payout — their existing DDA, unchanged",
      note: "This is the key ISO difference: Seller keeps their existing bank account and payment relationship. No embedded finance, no new DDA.",
      itemsTraditional: [
        { label: "Existing DDA", val: "+$120", sub: "Settled to Seller's existing bank account · T+2", color: "#34d399" },
        { label: "Existing processor", val: "Unchanged", sub: "No stack change — same processor, same reporting", color: "#818cf8" },
        { label: "ISO relationship", val: "Strengthened", sub: "ISO adds value without disrupting the merchant", color: "#fbbf24" },
      ],
      itemsStablecoin: [
        { label: "USDC payout", val: "+120 USDC", sub: "Opt-in · Seller receives USDC alongside or instead of DDA", color: "#22d3ee" },
        { label: "Existing DDA", val: "Fallback", sub: "Non-opt-in merchants unchanged — ISO routes traditionally", color: "#818cf8" },
        { label: "ISO differentiation", val: "New lever", sub: "ISO offers stablecoin settlement as premium feature", color: "#fbbf24" },
      ],
      flywheelTraditional: [
        "More AI agents discover Seller via ISO's MCP gateway",
        "More transactions flow through ISO's routing layer",
        "ISO volume grows — stronger network position",
        "ISO can offer premium MCP placement to high-volume merchants",
        "Merchants depend on ISO for agentic commerce access",
        "ISO switching cost deepens — merchants can't replicate the gateway alone",
        "ISO becomes the agentic commerce layer for its entire portfolio",
      ],
      flywheelStablecoin: [
        "More AI agents discover Seller via ISO's MCP gateway",
        "ISO routes stablecoin settlement to opt-in merchants — instant payout",
        "Stablecoin merchants see faster cash flow — higher loyalty to ISO",
        "ISO attracts cross-border merchants who benefit most from USDC settlement",
        "ISO's stablecoin capability becomes a competitive moat vs other ISOs",
        "ISO portfolio shifts toward higher-value stablecoin-enabled merchants",
        "ISO becomes the stablecoin gateway for its vertical",
      ],
    },
  },
  direct: {
    label: "Marketplace (MOR)", full: "Marketplace operating as Merchant of Record",
    ownership: "Owns Transaction",
    primaryAsset: "Transaction Network",
    control: "High",
    gtmModels: ["Marketplace", "Platform MOR"],
    outcome: "Own transaction and payout experience.",
    desc: "A marketplace or platform that operates as Merchant of Record (MOR) for all sellers on it. The platform owns both the supply side and the payment layer.",
    mcpCaller: "Platform MCP endpoint", mcpTool: "platform_marketplace_search",
    mcpNote: "The platform owns the MCP endpoint and is the MOR. The AI agent transacts with the platform directly — not with individual sellers. The platform settles to sellers via its own payout logic.",
    step0: {
      title: "Platform onboards Seller under its Merchant of Record umbrella",
      note: "The platform is the MOR — Seller does not have their own MID. All transactions run under the platform's MID. Seller is a payee, not a sub-merchant.",
      items: [
        { step: "Seller identity check", desc: "Platform verifies Seller identity for payout compliance — KYC/KYB light. No MID issued to Seller.", color: "#fbbf24" },
        { step: "Payout account set", desc: "Seller's payout destination configured — bank account or platform wallet. This is a payout rail, not a merchant DDA.", color: "#34d399" },
        { step: "Platform MID covers all", desc: "All transactions run under the platform's own MID. Seller has no direct card network relationship.", color: "#818cf8" },
        { step: "Seller listed on platform MCP", desc: "Seller's services added to the platform's MCP-discoverable catalogue. Platform controls discoverability and ranking.", color: "#c084fc" },
      ],
      insight: "The platform is the merchant — Seller is a supplier. AI agents transact with the platform, not with Seller directly. This gives the platform maximum control over the commerce experience.",
    },
    step3: {
      title: "Platform matches Seller from its own catalogue and transacts as MOR",
      note: "The platform owns both the inventory and the payment. It transacts as MOR — Seller is not in the payment flow at all.",
      items: [
        "Platform queries its own seller catalogue — full inventory visibility, real-time availability",
        "Seller / Service Provider — 4.9★ · available Saturday 9am · listed on platform",
        "Platform books the slot and confirms the transaction under its own MID as MOR",
        "Platform calls payment layer as MOR — Seller receives a payout, not a merchant settlement",
      ],
      callInitiator: "Payment API call initiated by: Platform (as Merchant of Record — platform's own MID)",
    },
    step6: {
      title: "Seller receives a payout from the platform",
      note: "This is the key Marketplace (MOR) difference: Seller has no DDA, no MID, no card network relationship. They receive a payout from the platform's ledger.",
      itemsTraditional: [
        { label: "Platform payout", val: "+$108", sub: "Platform nets $12 fee · Seller receives $108 · T+2", color: "#34d399" },
        { label: "Platform wallet", val: "Optional", sub: "Seller can hold balance in platform wallet", color: "#818cf8" },
        { label: "Platform control", val: "Maximum", sub: "Platform controls pricing, ranking, and payout timing", color: "#fbbf24" },
      ],
      itemsStablecoin: [
        { label: "USDC payout", val: "+108 USDC", sub: "Platform nets fee · Seller receives USDC globally · < 30 sec", color: "#22d3ee" },
        { label: "No correspondent bank", val: "Eliminated", sub: "No SWIFT, no FX spread, no T+5 cross-border delay", color: "#818cf8" },
        { label: "Global reach", val: "Any geo", sub: "Platform pays any Seller anywhere in the world instantly", color: "#fbbf24" },
      ],
      flywheelTraditional: [
        "More AI agents transact with the platform as MOR",
        "Platform volume and take-rate grows",
        "Sellers depend on platform for all agentic commerce access",
        "Platform controls discoverability — high-volume sellers get priority",
        "Platform wallet adoption grows — Sellers keep funds on-platform",
        "Platform becomes the financial and commerce OS for Sellers",
        "Lock-in is structural — Sellers cannot replicate MOR status independently",
      ],
      flywheelStablecoin: [
        "More AI agents transact with the platform as MOR globally",
        "Platform settles to any Seller, anywhere, in USDC — instantly",
        "No correspondent banking cost — platform margin improves",
        "Cross-border Sellers flock to platform — best payout experience globally",
        "Platform wallet holds USDC — programmable, composable, no bank required",
        "Platform becomes the global financial OS for Sellers in its vertical",
        "Stablecoin lock-in is deeper than any traditional payout rail",
      ],
    },
  },
};

const STEPS = [
  { id: 0, label: "Seller onboarding" },
  { id: 1, label: "Buyer intent" },
  { id: 2, label: "MCP fires" },
  { id: 3, label: "Matching & routing" },
  { id: 4, label: "Auth protocols" },
  { id: 5, label: "Agent confirms" },
  { id: 6, label: "Financial layer" },
];

const SETTLEMENT = {
  domestic_traditional:   { label: "Domestic · Traditional",   flag: "🇺🇸", icon: "🏦", fx: false, stable: false, currency: "USD",                   rail: "ACH / card network",  color: "#64748b", desc: "Standard card / ACH settlement. T+1 domestic. Interchange fees apply." },
  crossborder_traditional:{ label: "Cross-border · Traditional",flag: "🌐", icon: "🏦", fx: true,  stable: false, currency: "Local + USD settlement", rail: "Local rail + FX layer", color: "#fbbf24", desc: "Local payment rail with FX conversion. T+2–5. Correspondent banking fees and FX spread apply." },
  domestic_stablecoin:    { label: "Domestic · USDC",           flag: "🇺🇸", icon: "🔵", fx: false, stable: true,  currency: "USDC (USD-pegged)",       rail: "On-chain USDC",       color: "#22d3ee", desc: "Near-instant on-chain settlement. Gas fees only. No interchange, no FX spread." },
  crossborder_stablecoin: { label: "Cross-border · USDC",       flag: "🌐", icon: "🔵", fx: true,  stable: true,  currency: "USDC · any geography",    rail: "On-chain USDC global", color: "#22d3ee", desc: "Near-instant global USDC settlement. No correspondent bank, no SWIFT, no FX spread. Seller converts locally." },
};

export default function App() {
  const [screen, setScreen] = useState("opening");
  const [channel, setChannel] = useState("isv");
  const [network, setNetwork] = useState("visa");
  const [settlement, setSettlement] = useState("domestic_traditional");
  const [step, setStep] = useState(0);
  const [protocolsRevealed, setProtocolsRevealed] = useState([]);

  const ch = CHANNEL_DATA[channel];
  const sv = SETTLEMENT[settlement];
  const isStable = sv.stable;
  const g = sv;

  const isWallet = network === "wallet";
  const activeProtocols = Object.values(PROTOCOLS).filter(p => {
    if (isWallet) return p.walletOk || p.network === "wallet";
    return p.always || p.network === network;
  });

  function resetFlow() { setStep(0); setProtocolsRevealed([]); setScreen("flow"); }
  const sc = isStable ? STABLECOIN.stablecoin : STABLECOIN.traditional;

  const s = {
    app: { minHeight: "100vh", background: "#080b14", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" },
    container: { width: "100%", maxWidth: 820, padding: "0 20px 60px" },
    tag: (color = "#818cf8") => ({ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", marginBottom: 10 }),
    card: (border = "#1e293b") => ({ background: "#0f1623", border: `1px solid ${border}`, borderRadius: 14, padding: "22px 26px", marginBottom: 16 }),
    h2: { fontSize: 22, fontWeight: 700, letterSpacing: "-.01em", marginBottom: 8 },
    p: { fontSize: 14, color: "#94a3b8", lineHeight: 1.65, marginBottom: 12 },
    btn: (active, color = "#6366f1") => ({ padding: "9px 20px", borderRadius: 8, border: active ? `1.5px solid ${color}` : "1px solid #1e293b", background: active ? `${color}18` : "transparent", color: active ? color : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }),
    primaryBtn: { padding: "12px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 },
    ghostBtn: { padding: "10px 22px", borderRadius: 8, border: "1px solid #1e293b", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    stepDot: (active, done) => ({ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: active ? "#6366f122" : "transparent", border: active ? "1.5px solid #6366f1" : done ? "1px solid #1e2940" : "1px solid #0f1623", color: active ? "#818cf8" : done ? "#334155" : "#1e293b", cursor: done || active ? "pointer" : "default" }),
    hl: (color = "#6366f1") => ({ background: `${color}10`, border: `1px solid ${color}33`, borderRadius: 10, padding: "14px 18px", marginBottom: 12 }),
    diffBadge: { display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", background: "#fbbf2418", border: "1px solid #fbbf2444", color: "#fbbf24", borderRadius: 4, padding: "2px 8px", marginBottom: 8 },
    stableBadge: { display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", background: "#22d3ee18", border: "1px solid #22d3ee44", color: "#22d3ee", borderRadius: 4, padding: "2px 8px", marginBottom: 8, marginLeft: 6 },
    protoCard: (color, revealed) => ({ background: revealed ? `${color}0f` : "#0a0f1a", border: `1px solid ${revealed ? color + "44" : "#0f1623"}`, borderRadius: 10, padding: "14px 18px", transition: "all .3s", opacity: revealed ? 1 : 0.35, cursor: "pointer" }),
    bubble: (align) => ({ display: "flex", alignItems: "flex-start", gap: 12, flexDirection: align === "right" ? "row-reverse" : "row", marginBottom: 16 }),
    avatar: (color) => ({ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0, color: "#fff" }),
    msg: (align) => ({ background: align === "right" ? "#1e1b4b" : "#0f1623", border: `1px solid ${align === "right" ? "#312e81" : "#1e293b"}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.55, maxWidth: 480, color: align === "right" ? "#c7d2fe" : "#cbd5e1" }),
    fxBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "#0c1a2e", border: "1px solid #1e3a5f", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#60a5fa", marginTop: 8 },
    finCard: (color) => ({ background: `${color}0a`, border: `1px solid ${color}33`, borderRadius: 10, padding: "14px 16px", flex: 1, minWidth: 140 }),
    flyItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #0f1623", fontSize: 13, color: "#94a3b8" },
    railBtn: (active, color) => ({ padding: "10px 18px", borderRadius: 8, border: active ? `1.5px solid ${color}` : "1px solid #1e293b", background: active ? `${color}15` : "#080b14", color: active ? color : "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }),
  };

  if (screen === "opening") return (
    <div style={s.app}>
      <div style={{ ...s.container, paddingTop: 60 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15, marginBottom: 12, background: "linear-gradient(135deg, #e2e8f0, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            The Merchant Endpoint<br />for Agent-Driven Commerce Flow
          </h1>
          <p style={{ ...s.p, fontSize: 15, maxWidth: 560, margin: "0 auto 32px" }}>
            The purchase funnel is being replaced. AI agents are the new storefront.
            The platform that becomes the merchant endpoint owns the next decade of commerce infrastructure.
          </p>
        </div>
        <div style={{ ...s.card("#1e293b"), marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {["Search", "Browse", "Checkout form", "Card entry"].map((item, i, arr) => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ padding: "6px 14px", background: "#0f1623", border: "1px solid #1e293b", borderRadius: 6, fontSize: 13, color: "#475569" }}>{item}</span>
                {i < arr.length - 1 && <span style={{ color: "#1e293b", fontWeight: 700 }}>→</span>}
              </span>
            ))}
          </div>
          <div style={{ textAlign: "center", margin: "12px 0 8px", fontSize: 12, color: "#334155", letterSpacing: ".06em", textTransform: "uppercase" }}>is being replaced by</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {["Buyer intent", "AI agent", "Merchant endpoint"].map((item, i, arr) => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ padding: "6px 14px", background: "#1a1040", border: "1px solid #4c1d95", borderRadius: 6, fontSize: 13, color: "#a78bfa", fontWeight: 600 }}>{item}</span>
                {i < arr.length - 1 && <span style={{ color: "#6366f1", fontWeight: 700 }}>→</span>}
              </span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <button style={s.primaryBtn} onClick={() => setScreen("config")}>Walk through the flow →</button>
        </div>
      </div>
    </div>
  );

  if (screen === "config") {
    const ch2 = CHANNEL_DATA[channel];
    return (
      <div style={s.app}>
        <div style={{ ...s.container, paddingTop: 48 }}>
          <div style={s.tag()}>Configure your scenario</div>
          <h2 style={s.h2}>Choose your channel, settlement, and payment method</h2>
          <p style={{ ...s.p, marginBottom: 28 }}>Three choices — channel, settlement (geography + rail combined), and how the Buyer pays.</p>

          <div style={s.card("#1e293b")}>
            <div style={{ ...s.tag("#34d399"), marginBottom: 4 }}>Channel = Ownership Model</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>Changes Steps 0, 2, 3, and 6</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {Object.entries(CHANNEL_DATA).map(([k, v]) => {
                const active = channel === k;
                return (
                  <button key={k} onClick={() => setChannel(k)} style={{ padding: "14px 14px", borderRadius: 10, cursor: "pointer", background: active ? "#34d39912" : "#080b14", border: active ? "1.5px solid #34d39966" : "1px solid #1e293b", textAlign: "left", transition: "all .15s" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#34d399" : "#cbd5e1", marginBottom: 4 }}>{v.label}</div>
                    <div style={{ fontSize: 11, color: active ? "#34d399" : "#64748b", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700, marginBottom: 8 }}>{v.ownership}</div>
                    <div style={{ fontSize: 11, color: active ? "#94a3b8" : "#475569", lineHeight: 1.5 }}>{v.outcome}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ ...s.hl("#34d399"), marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#34d399", marginBottom: 4 }}>{ch2.full}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{ch2.desc}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <div style={{ background: "#0a0d16", border: "1px solid #1e293b", borderRadius: 6, padding: "6px 10px", textAlign: "center", minWidth: 80 }}>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Control</div>
                    <div style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>{ch2.control}</div>
                  </div>
                  <div style={{ background: "#0a0d16", border: "1px solid #1e293b", borderRadius: 6, padding: "6px 10px", textAlign: "center", minWidth: 110 }}>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Primary asset</div>
                    <div style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>{ch2.primaryAsset}</div>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #34d39922", paddingTop: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#34d399", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700, marginBottom: 6 }}>Typical GTM models</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ch2.gtmModels.map(model => (
                    <span key={model} style={{ background: "#34d39915", border: "1px solid #34d39933", borderRadius: 4, padding: "3px 9px", fontSize: 11, color: "#34d399", fontWeight: 600 }}>{model}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, borderTop: "1px solid #34d39922", paddingTop: 10 }}>
                {["Seller onboarding", "MCP entry point", "Matching logic", "Financial layer"].map((label, i) => {
                  const diffs = {
                    isv: ["PayFac API — ISV onboards Seller", "ISV's own MCP tool", "ISV's sub-merchant graph", "Sub-merchant DDA + embedded banking"],
                    iso: ["Portfolio mapping — existing MIDs", "ISO MCP gateway (middleware)", "ISO's merchant routing table", "Seller's existing DDA — unchanged"],
                    direct: ["MOR onboarding — no Seller MID", "Platform MCP endpoint (MOR)", "Platform's own catalogue", "Payout rail — no sub-merchant DDA"],
                  };
                  return (
                    <div key={label} style={{ background: "#080b14", borderRadius: 6, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 600, lineHeight: 1.4 }}>{diffs[channel][i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={s.card("#1e293b")}>
            <div style={{ ...s.tag("#22d3ee"), marginBottom: 12 }}>Settlement — geography + rail · changes Steps 3 and 6</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {Object.entries(SETTLEMENT).map(([k, v]) => {
                const isTraditional = !v.stable;
                const lockedOut = isWallet && isTraditional;
                return (
                  <button key={k} disabled={lockedOut}
                    style={{ ...s.railBtn(settlement === k, v.color), justifyContent: "flex-start", flexDirection: "column", alignItems: "flex-start", padding: "12px 14px", opacity: lockedOut ? 0.25 : 1, cursor: lockedOut ? "not-allowed" : "pointer", position: "relative" }}
                    onClick={() => {
                      if (lockedOut) return;
                      setSettlement(k);
                      if (isTraditional && network === "wallet") setNetwork("visa");
                    }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span>{v.flag}</span><span>{v.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{v.label}</span>
                      {lockedOut && <span style={{ fontSize: 10, color: "#f87171", fontWeight: 700, marginLeft: 4 }}>unavailable with wallet</span>}
                    </div>
                    <div style={{ fontSize: 11, color: settlement === k ? v.color + "cc" : "#334155", lineHeight: 1.4, textAlign: "left" }}>{v.desc}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ ...s.hl(sv.color), marginBottom: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: isStable ? 10 : 0 }}>
                {[
                  { label: "Currency", val: sv.currency },
                  { label: "Rail", val: sv.rail },
                  { label: "FX", val: isStable ? "No spread — USDC is USD-pegged" : sv.fx ? "FX spread at settlement" : "No FX — domestic USD" },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, color: sv.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#cbd5e1" }}>{item.val}</div>
                  </div>
                ))}
              </div>
              {isStable && <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55, borderTop: "1px solid #22d3ee22", paddingTop: 10 }}>
                ⚡ Auth protocols (MCP, ACP, KYA, Visa TAP / MC Token) fire identically — stablecoin replaces the settlement rail only, downstream of authorization.
              </div>}
            </div>
          </div>

          <div style={s.card("#1e293b")}>
            <div style={{ ...s.tag("#60a5fa"), marginBottom: 6 }}>Payment method — drives auth protocol stack in Step 4</div>
            {isStable && (
              <div style={{ fontSize: 11, color: "#22d3ee", marginBottom: 12 }}>
                USDC settlement is selected — all three payment methods are valid. Card auth and USDC settlement are independent layers.
              </div>
            )}
            {!isStable && (
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
                Traditional settlement selected — Visa and Mastercard available. Crypto wallet requires USDC settlement.
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <button style={s.btn(network === "visa", "#60a5fa")} onClick={() => setNetwork("visa")}>💳 Visa</button>
              <button style={s.btn(network === "mc", "#f87171")} onClick={() => setNetwork("mc")}>💳 Mastercard</button>
              <button
                style={{ ...s.btn(network === "wallet", "#22d3ee"), opacity: !isStable ? 0.3 : 1, cursor: !isStable ? "not-allowed" : "pointer" }}
                onClick={() => { if (!isStable) return; setNetwork("wallet"); }}>
                🔵 Crypto wallet (USDC)
                {!isStable && <span style={{ fontSize: 10, marginLeft: 6, color: "#94a3b8" }}>select USDC settlement first</span>}
              </button>
            </div>
            <div style={{ ...s.hl(network === "visa" ? "#60a5fa" : network === "mc" ? "#f87171" : "#22d3ee"), marginBottom: 0 }}>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                {network === "visa" && (<><span style={{ color: "#60a5fa", fontWeight: 600 }}>Visa TAP fires</span> — Trusted Agent Protocol issues credential. MC Agent Token does not fire.{isStable && <span style={{ color: "#22d3ee" }}> Card auth is independent of settlement rail — Visa TAP fires even when Seller is paid in USDC.</span>}</>)}
                {network === "mc" && (<><span style={{ color: "#f87171", fontWeight: 600 }}>MC Agent Token fires</span> — single-use scoped token issued. Visa TAP does not fire.{isStable && <span style={{ color: "#22d3ee" }}> Card auth is independent of settlement rail — MC Agent Token fires even when Seller is paid in USDC.</span>}</>)}
                {network === "wallet" && (<><span style={{ color: "#22d3ee", fontWeight: 600 }}>Visa TAP and MC Agent Token do not fire.</span> Buyer pays directly from USDC wallet — funds are already on-chain. On-chain Signature + KYW replace card network auth entirely. No interchange. No card issuer involved.</>)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button style={s.ghostBtn} onClick={() => setScreen("opening")}>← Back</button>
            <button style={s.primaryBtn} onClick={resetFlow}>Start the flow →</button>
          </div>
        </div>
      </div>
    );
  }

  function ScenarioBadge() {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <span style={{ ...s.tag("#34d399"), marginBottom: 0 }}>{ch.label}</span>
        <span style={{ ...s.tag("#fbbf24"), marginBottom: 0 }}>{g.flag} {g.label}</span>
        <span style={{ ...s.tag(sv.color), marginBottom: 0 }}>{sv.flag} {sv.icon} {sv.label}</span>
        {!isWallet && <span style={{ ...s.tag(network === "visa" ? "#60a5fa" : "#f87171"), marginBottom: 0 }}>{network === "visa" ? "Visa" : "Mastercard"}</span>}
        {isWallet && <span style={{ ...s.tag("#22d3ee"), marginBottom: 0 }}>🔵 USDC wallet</span>}
        <button style={{ ...s.ghostBtn, padding: "3px 10px", fontSize: 11 }} onClick={() => setScreen("config")}>Change →</button>
      </div>
    );
  }

  function StepNav() {
    return (
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {STEPS.map((st) => (
          <div key={st.id} style={s.stepDot(st.id === step, st.id < step)}
            onClick={() => { if (st.id <= step) { setStep(st.id); if (st.id < 4) setProtocolsRevealed([]); } }}>
            {st.id < step ? "✓ " : `${st.id + 1} `}{st.label}
          </div>
        ))}
      </div>
    );
  }

  const d = ch;
  const step6Items = isStable ? d.step6.itemsStablecoin : d.step6.itemsTraditional;
  const step6Flywheel = isStable ? d.step6.flywheelStablecoin : d.step6.flywheelTraditional;

  const CHANNEL_COMPARE = {
    0: {
      label: "How Seller gets onboarded",
      isv:    { summary: "PayFac API — ISV onboards on Seller's behalf", detail: "New DDA · New MID under ISV umbrella · MCP auto-registered" },
      iso:    { summary: "Portfolio mapping — existing MIDs registered", detail: "No new DDA · No new MID · MCP gateway mapped to existing terminal" },
      direct: { summary: "MOR onboarding — no MID issued to Seller", detail: "No MID · No DDA · Seller is a payee, not a sub-merchant" },
    },
    2: {
      label: "Where the MCP tool lives",
      isv:    { summary: "ISV's own MCP tool", detail: "Agent calls ISV directly · ISV is the merchant endpoint" },
      iso:    { summary: "ISO MCP gateway (middleware)", detail: "Agent calls ISO gateway · ISO routes to merchant terminal" },
      direct: { summary: "Platform MCP endpoint (MOR)", detail: "Agent calls platform · Platform is both ISV and merchant" },
    },
    3: {
      label: "Who matches Seller and initiates payment",
      isv:    { summary: "ISV matches from sub-merchant graph", detail: "Calls payment API as registered PayFac" },
      iso:    { summary: "ISO routes via merchant routing table", detail: "Calls payment API using existing merchant MID" },
      direct: { summary: "Platform matches from own catalogue", detail: "Calls payment API as MOR — Seller not in payment flow" },
    },
    6: {
      label: "What Seller receives after payment",
      isv:    { summary: "Sub-merchant DDA + embedded banking", detail: "Working capital · Branded card · Full financial flywheel" },
      iso:    { summary: "Existing DDA — unchanged", detail: "Same bank · Same processor · ISO adds no new finance layer" },
      direct: { summary: "Payout from platform — no DDA", detail: "Platform nets a fee · Seller has no card network relationship" },
    },
  };

  function ChannelComparison({ stepId }) {
    const row = CHANNEL_COMPARE[stepId];
    if (!row) return null;
    const channels = ["isv", "iso", "direct"];
    const labels = { isv: "ISV", iso: "ISO", direct: "Marketplace (MOR)" };
    const colors = { isv: "#34d399", iso: "#818cf8", direct: "#fbbf24" };
    return (
      <div style={{ background: "#080b14", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
          Channel comparison — {row.label}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {channels.map(ch2 => {
            const active = ch2 === channel;
            const col = colors[ch2];
            const data = row[ch2];
            return (
              <div key={ch2} style={{ padding: "12px 14px", borderRadius: 10, background: active ? `${col}10` : "#0a0d16", border: active ? `1.5px solid ${col}66` : "1px solid #0f1623", transition: "all .2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, display: "inline-block", flexShrink: 0 }} />}
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? col : "#334155", textTransform: "uppercase", letterSpacing: ".05em" }}>
                    {labels[ch2]}{active ? " ← active" : ""}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#e2e8f0" : "#475569", marginBottom: 4, lineHeight: 1.4 }}>{data.summary}</div>
                <div style={{ fontSize: 11, color: active ? "#94a3b8" : "#1e293b", lineHeight: 1.5 }}>{data.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={s.app}>
      <div style={{ ...s.container, paddingTop: 36 }}>
        <StepNav />
        <ScenarioBadge />

        {step === 0 && (
          <div>
            <div style={s.tag("#fbbf24")}>PayFac-as-a-Service · Step 0</div>
            <h2 style={s.h2}>{d.step0.title}</h2>
            <div style={s.diffBadge}>Channel difference</div>
            <ChannelComparison stepId={0} />
            <p style={s.p}>{d.step0.note}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {d.step0.items.map((item) => (
                <div key={item.step} style={s.card("#1e293b")}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: item.color, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{item.step}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              ))}
            </div>
            <div style={s.hl("#fbbf24")}>
              <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600, marginBottom: 4 }}>Why this matters in agentic commerce</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{d.step0.insight}</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.ghostBtn} onClick={() => setScreen("config")}>← Back to config</button>
              <button style={s.primaryBtn} onClick={() => setStep(1)}>Next: Buyer intent →</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={s.tag("#818cf8")}>Agentic trigger · Step 1</div>
            <h2 style={s.h2}>Buyer talks to their AI assistant</h2>
            <p style={s.p}>No browser. No search engine. No form. One sentence replaces the entire purchase funnel. This step is identical across all channels and rails — the differences begin at Step 2.</p>
            <div style={s.card("#1e293b")}>
              <div style={s.bubble("left")}>
                <div style={s.avatar("#0f766e")}>B</div>
                <div style={s.msg("left")}>"Book me the highest-rated available plumber near me for Saturday morning."
                  {sv.fx && <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>📍 Location: London, UK 🇬🇧</div>}
                </div>
              </div>
              <div style={s.bubble("right")}>
                <div style={s.avatar("#4f46e5")}>AI</div>
                <div style={s.msg("right")}>Got it. Finding top-rated available plumbers near you for Saturday morning…</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[{ label: "No Google search", icon: "🚫" }, { label: "No site to browse", icon: "🚫" }, { label: "No checkout form", icon: "🚫" }].map((item) => (
                <div key={item.label} style={{ ...s.card("#1e293b"), textAlign: "center", padding: "16px" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.ghostBtn} onClick={() => setStep(0)}>← Back</button>
              <button style={s.primaryBtn} onClick={() => setStep(2)}>Next: MCP fires →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={s.tag("#818cf8")}>⭐ Merchant endpoint moment · Step 2</div>
            <h2 style={s.h2}>MCP fires — AI agent calls {d.mcpCaller}</h2>
            <div style={s.diffBadge}>Channel difference</div>
            <ChannelComparison stepId={2} />
            <p style={s.p}>{d.mcpNote}</p>
            <div style={{ ...s.card("#818cf822"), border: "1px solid #818cf844", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>MCP tool call → {d.mcpCaller}</div>
              <pre style={{ fontSize: 12, color: "#a5b4fc", background: "#0a0d16", borderRadius: 8, padding: "14px 16px", overflowX: "auto", lineHeight: 1.6 }}>
{`{
  "tool": "${d.mcpTool}",
  "input": {
    "service_type": "plumbing",
    "location": "${sv.fx ? "London, UK" : "near_consumer"}",
    "date": "Saturday",
    "time_preference": "morning",
    "sort_by": "rating",
    "payment_method": "${isWallet ? 'usdc_wallet' : network === 'visa' ? 'visa_card' : 'mc_card'}",
    "settlement_rail": "${isStable || isWallet ? 'USDC' : 'traditional'}"
  }
}`}
              </pre>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {["ChatGPT", "Gemini", "Copilot"].map((agent) => (
                <div key={agent} style={{ ...s.card("#1e293b"), textAlign: "center", padding: "14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 4 }}>{agent}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>calls {d.mcpCaller} via MCP</div>
                </div>
              ))}
            </div>
            <div style={s.hl("#818cf8")}>
              <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 600, marginBottom: 4 }}>The first-mover position</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>The MCP tool was built once. Every compatible agent calls it — no custom integration per agent. The {d.mcpCaller} is now the infrastructure every AI agent touches to complete a commerce transaction in this vertical.</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.ghostBtn} onClick={() => setStep(1)}>← Back</button>
              <button style={s.primaryBtn} onClick={() => setStep(3)}>Next: Matching & routing →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={s.tag("#34d399")}>Matching & routing · Step 3</div>
            <h2 style={s.h2}>{d.step3.title}</h2>
            <div style={s.diffBadge}>Channel difference</div>
            {isStable && <span style={s.stableBadge}>Stablecoin rail active</span>}
            <ChannelComparison stepId={3} />
            <p style={s.p}>{d.step3.note}</p>
            <div style={{ ...s.card("#1e293b"), marginBottom: 16 }}>
              {d.step3.items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < d.step3.items.length - 1 ? 10 : 0, fontSize: 13, color: "#94a3b8" }}>
                  <span style={{ color: "#34d399", fontSize: 15, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
              {sv.fx && !isStable && (
                <div style={s.fxBadge}>🌐 FX layer active · £120 GBP → $156 USD · mid-market rate · settled in USD</div>
              )}
            </div>
            <div style={{ ...s.card(isStable ? "#22d3ee33" : "#1e293b"), background: isStable ? "#22d3ee08" : "#0f1623" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: isStable ? "#22d3ee" : "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                Settlement rail routing — after authorization clears
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: "12px 14px", borderRadius: 8, background: !isStable ? "#1e293b" : "#0a0d16", border: !isStable ? "1px solid #475569" : "1px solid #0f1623", opacity: !isStable ? 1 : 0.4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>🏦 Traditional rail {!isStable && "← active"}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>Card network → ACH / wire → {channel === "direct" ? "platform payout batch" : "merchant DDA"} · T+1 domestic · T+2–5 cross-border</div>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: 8, background: isStable ? "#22d3ee0a" : "#0a0d16", border: isStable ? "1px solid #22d3ee44" : "1px solid #0f1623", opacity: isStable ? 1 : 0.4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>🔵 Stablecoin rail (USDC) {isStable && "← active"}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>On-chain USDC transfer → Seller wallet · near-instant · no FX spread · no correspondent bank · any geography</div>
                </div>
              </div>
              {isStable && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#22d3ee", lineHeight: 1.55, borderTop: "1px solid #22d3ee22", paddingTop: 10 }}>
                  {channel === "isv" ? sc.isvNote : channel === "iso" ? sc.isoNote : sc.directNote}
                </div>
              )}
            </div>
            <div style={s.hl("#34d399")}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Who initiates the payment call</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>{d.step3.callInitiator}</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.ghostBtn} onClick={() => setStep(2)}>← Back</button>
              <button style={s.primaryBtn} onClick={() => setStep(4)}>Next: Auth protocols →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={s.tag("#c084fc")}>Agentic protocols · Step 4</div>
            <h2 style={s.h2}>Protocol stack fires</h2>
            <p style={s.p}>
              {isWallet
                ? "Buyer pays from a USDC wallet — no card network involved. Visa TAP and MC Agent Token do not fire. On-chain Signature and KYW replace them at the auth layer."
                : <>Same across all channels and settlement rails. These protocols fire because a non-human agent initiated the payment — they sit at the authorization layer, above settlement. {network === "visa" ? " Visa TAP active. MC Agent Token does not fire." : " MC Agent Token active. Visa TAP does not fire."}</>}
            </p>
            {isStable && !isWallet && (
              <div style={{ ...s.hl("#22d3ee"), marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#22d3ee", fontWeight: 600, marginBottom: 4 }}>🔵 Stablecoin settlement note</div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>All four protocols below fire identically whether the settlement rail is traditional or USDC (three always-on + one network protocol depending on card). Stablecoin replaces the settlement rail only — it does not replace or bypass any auth protocol. Authorization and settlement are separate layers.</div>
              </div>
            )}
            {isWallet && (
              <div style={{ ...s.hl("#22d3ee"), marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#22d3ee", fontWeight: 600, marginBottom: 4 }}>🔵 Wallet payment — auth stack changes</div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                  When Buyer pays from a USDC wallet, the card network is not involved at any layer — not for authorization, not for settlement. The three always-on protocols (MCP, ACP, KYA) still fire. Visa TAP and MC Agent Token are replaced by two on-chain protocols: On-chain Signature (wallet signs the intent) and KYW (Know Your Wallet — on-chain identity + AML check). No interchange. No card issuer. End-to-end on-chain.
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {activeProtocols.map((p) => {
                const revealed = protocolsRevealed.includes(p.name);
                return (
                  <div key={p.name} style={s.protoCard(p.color, revealed)} onClick={() => !revealed && setProtocolsRevealed(prev => [...prev, p.name])}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 3 }}>
                      {revealed ? "✓ " : "▶ "}{p.name}
                      {p.always && <span style={{ fontSize: 10, color: "#475569", marginLeft: 6, fontWeight: 400 }}>always-on</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{p.full}</div>
                    {revealed ? <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>{p.desc}</div> : <div style={{ fontSize: 12, color: "#334155" }}>Tap to reveal</div>}
                  </div>
                );
              })}
            </div>
            {sv.fx && !isStable && (
              <div style={{ ...s.card("#1e3a5f"), marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Cross-border layer</div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>FX conversion at mid-market rate · local payment rail selected · settlement in USD · compliance checks passed</div>
              </div>
            )}
            {sv.fx && isStable && (
              <div style={{ ...s.card("#22d3ee22"), border: "1px solid #22d3ee33", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#22d3ee", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Cross-border + stablecoin</div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>No FX conversion needed — USDC is USD-pegged. No correspondent banking, no SWIFT delay. Seller receives USDC in any geography instantly. Compliance checks still apply at the auth layer.</div>
              </div>
            )}
            {protocolsRevealed.length === activeProtocols.length && (
              <div style={s.hl("#34d399")}>
                <div style={{ fontSize: 13, color: "#34d399", fontWeight: 600, marginBottom: 4 }}>All protocols cleared</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  Transaction authorised. Agent verified.{" "}
                  {isWallet ? "Wallet signature verified. KYW passed. On-chain USDC transfer initiated." : isStable ? "Token issued. Payment routing to USDC settlement rail." : "Token issued. Payment routing to traditional settlement rail."}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.ghostBtn} onClick={() => setStep(3)}>← Back</button>
              <button style={{ ...s.primaryBtn, opacity: protocolsRevealed.length < activeProtocols.length ? 0.4 : 1 }}
                disabled={protocolsRevealed.length < activeProtocols.length} onClick={() => setStep(5)}>
                Next: Agent confirms →
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={s.tag("#34d399")}>Zero friction · Step 5</div>
            <h2 style={s.h2}>Agent confirms to Buyer</h2>
            <p style={s.p}>Total elapsed time: seconds. Buyer never opened a browser. Same outcome across all channels and rails — the differences are invisible to the Buyer.</p>
            <div style={s.card("#1e293b")}>
              <div style={s.bubble("right")}>
                <div style={s.avatar("#4f46e5")}>AI</div>
                <div style={s.msg("right")}>
                  Done. Seller / Service Provider (4.9★) is booked for Saturday 9am.
                  {isWallet ? " 120 USDC transferred from your wallet." : sv.fx && !isStable ? " £120 GBP" : " $120"}
                  {!isWallet && <> charged to your {network === "visa" ? "Visa" : "Mastercard"} card.</>}
                  {isStable && !isWallet ? " Settlement routed via USDC rail — Seller paid instantly." : ""}
                  {isWallet ? " On-chain settlement complete — Seller received USDC instantly. No card, no interchange." : ""} Confirmation sent to your email.
                  {sv.fx && isStable && <div style={{ marginTop: 6, fontSize: 12, color: "#22d3ee" }}>Cross-border · no FX spread · Seller receives USDC instantly in any geography</div>}
                  {sv.fx && !isStable && <div style={{ marginTop: 6, fontSize: 12, color: "#818cf8" }}>Cross-border booking confirmed · FX rate locked at time of transaction</div>}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[{ label: "No browser", icon: "✓" }, { label: "No form", icon: "✓" }, { label: isWallet ? "No card needed" : "No card typed", icon: "✓" }, { label: isWallet ? "On-chain" : isStable ? "USDC instant" : "Seconds", icon: isWallet ? "🔵" : isStable ? "🔵" : "⚡" }].map((item) => (
                <div key={item.label} style={{ ...s.card("#1e293b"), textAlign: "center", padding: "12px" }}>
                  <div style={{ fontSize: 18, color: isStable && item.label === "USDC instant" ? "#22d3ee" : "#34d399", marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.ghostBtn} onClick={() => setStep(4)}>← Back</button>
              <button style={s.primaryBtn} onClick={() => setStep(6)}>Next: Financial layer →</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <div style={s.tag("#fbbf24")}>Closed-loop economics · Step 6</div>
            <h2 style={s.h2}>{d.step6.title}</h2>
            <div style={s.diffBadge}>Channel difference</div>
            {isStable && <span style={s.stableBadge}>Stablecoin rail</span>}
            <ChannelComparison stepId={6} />
            <p style={s.p}>{d.step6.note}</p>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {step6Items.map((item) => (
                <div key={item.label} style={s.finCard(item.color)}>
                  <div style={{ fontSize: 11, color: item.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.val}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ ...s.card("#1e293b"), marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isStable ? "#22d3ee" : "#fbbf24", marginBottom: 12 }}>The flywheel {isStable ? "— stablecoin accelerated" : ""}</div>
              {step6Flywheel.map((item, i, arr) => (
                <div key={item} style={{ ...s.flyItem, borderBottom: i < arr.length - 1 ? "1px solid #0f1623" : "none" }}>
                  <span style={{ color: isStable ? "#22d3ee" : "#6366f1", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.ghostBtn} onClick={() => setStep(5)}>← Back</button>
              <button style={s.primaryBtn} onClick={() => setScreen("opening")}>Start over →</button>
              <button style={s.ghostBtn} onClick={() => setScreen("config")}>Change scenario →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
