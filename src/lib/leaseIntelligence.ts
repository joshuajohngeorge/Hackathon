export type ClauseCategory =
  | "renewal"
  | "fees"
  | "deposit"
  | "maintenance"
  | "entry"
  | "sublease"
  | "termination"
  | "liability"
  | "utilities"
  | "general";

export type ClauseChunk = {
  id: string;
  title: string;
  text: string;
  category: ClauseCategory;
};

export type RuleFlag = {
  clause: string;
  text: string;
  severity: "high" | "medium" | "low";
  explanation: string;
  category: ClauseCategory;
  ruleId: string;
};

export type ReferenceSnippet = {
  id: string;
  title: string;
  category: ClauseCategory;
  text: string;
};

export type LeaseIntelligenceReport = {
  chunks: ClauseChunk[];
  flags: RuleFlag[];
  references: ReferenceSnippet[];
  promptContext: string;
};

type RedFlagRule = {
  id: string;
  clause: string;
  category: ClauseCategory;
  severity: RuleFlag["severity"];
  patterns: RegExp[];
  explanation: string;
};

const MAX_CHUNKS_FOR_CONTEXT = 18;
const MAX_FLAGS = 12;
const MAX_REFERENCES = 8;

const categoryPatterns: Record<ClauseCategory, RegExp[]> = {
  renewal: [/renew/i, /automatic/i, /extension/i, /notice/i],
  fees: [/fee/i, /charge/i, /late/i, /penalt/i, /fine/i],
  deposit: [/deposit/i, /deduct/i, /damage/i, /return/i],
  maintenance: [/repair/i, /maintenance/i, /habitability/i, /condition/i, /as-is/i],
  entry: [/enter/i, /entry/i, /inspect/i, /access/i, /notice/i],
  sublease: [/sublet/i, /sublease/i, /assign/i, /assignment/i],
  termination: [/terminat/i, /break/i, /early/i, /liquidated/i, /abandon/i],
  liability: [/liability/i, /joint/i, /several/i, /waiv/i, /indemn/i, /attorney/i],
  utilities: [/utilit/i, /electric/i, /water/i, /gas/i, /internet/i, /trash/i],
  general: []
};

const redFlagRules: RedFlagRule[] = [
  {
    id: "auto-renewal",
    clause: "Automatic renewal",
    category: "renewal",
    severity: "high",
    patterns: [/automatic(?:ally)? renew/i, /renew(?:s|ed)? automatically/i, /successive term/i],
    explanation: "Automatic renewal can lock a student into another term if they miss a notice window."
  },
  {
    id: "short-renewal-window",
    clause: "Short renewal notice window",
    category: "renewal",
    severity: "medium",
    patterns: [/([1-5]?\d|60|90)\s+days?.{0,80}(notice|renew|termination)/i, /(notice|renew|termination).{0,80}([1-5]?\d|60|90)\s+days?/i],
    explanation: "Lease deadlines matter; renters should calendar opt-out dates and ask what happens if notice is late."
  },
  {
    id: "joint-several",
    clause: "Joint and several liability",
    category: "liability",
    severity: "high",
    patterns: [/joint(?:ly)? and several(?:ly)?/i],
    explanation: "This can make one roommate responsible for another roommate's unpaid rent or damages."
  },
  {
    id: "broad-waiver",
    clause: "Broad rights waiver",
    category: "liability",
    severity: "high",
    patterns: [/waiv(?:e|er).{0,120}(right|claim|defense|trial|jury)/i, /(right|claim|defense|trial|jury).{0,120}waiv(?:e|er)/i],
    explanation: "Broad waivers can reduce renter protections or make disputes harder to challenge."
  },
  {
    id: "attorney-fees",
    clause: "Attorney fee shifting",
    category: "liability",
    severity: "medium",
    patterns: [/attorney'?s? fees?/i, /legal fees?/i, /collection costs?/i],
    explanation: "Attorney-fee clauses can make even small disputes financially risky."
  },
  {
    id: "nonrefundable-fee",
    clause: "Non-refundable charge",
    category: "fees",
    severity: "medium",
    patterns: [/non-?refundable/i, /not refundable/i],
    explanation: "Non-refundable charges should be understood before signing because they may not come back even if the unit is clean."
  },
  {
    id: "excessive-late-fee",
    clause: "Late fee or penalty",
    category: "fees",
    severity: "medium",
    patterns: [/late fee/i, /late charge/i, /penalt(?:y|ies)/i, /\$[0-9,]+.{0,40}late/i],
    explanation: "Late fee terms should be clear, proportional, and tied to exact due dates and grace periods."
  },
  {
    id: "carpet-cleaning",
    clause: "Mandatory carpet cleaning",
    category: "fees",
    severity: "medium",
    patterns: [/carpet.{0,40}clean/i, /clean.{0,40}carpet/i],
    explanation: "Mandatory cleaning fees can overlap with normal wear and tear; ask when the fee applies and whether receipts matter."
  },
  {
    id: "as-is",
    clause: "As-is condition",
    category: "maintenance",
    severity: "high",
    patterns: [/as[-\s]?is/i, /present condition/i],
    explanation: "An as-is clause may shift condition problems onto the renter; document move-in issues immediately."
  },
  {
    id: "tenant-repair-duty",
    clause: "Broad tenant repair duty",
    category: "maintenance",
    severity: "medium",
    patterns: [/tenant.{0,80}(repair|maintain)/i, /(repair|maintain).{0,80}tenant/i],
    explanation: "Tenants usually should not be responsible for broad building repairs unrelated to their own damage."
  },
  {
    id: "landlord-entry",
    clause: "Landlord entry",
    category: "entry",
    severity: "medium",
    patterns: [/landlord.{0,80}(enter|access|inspect)/i, /(enter|access|inspect).{0,80}(unit|premises|apartment)/i],
    explanation: "Entry clauses should spell out notice, reasons for entry, and emergency exceptions."
  },
  {
    id: "sublease-restriction",
    clause: "Sublease restriction",
    category: "sublease",
    severity: "medium",
    patterns: [/suble(?:t|ase).{0,100}(prohibit|not|without|consent|approval)/i, /(assign|assignment).{0,100}(without|consent|approval)/i],
    explanation: "Strict sublease approval can matter if plans change over summer or study-abroad terms."
  },
  {
    id: "liquidated-damages",
    clause: "Liquidated damages",
    category: "termination",
    severity: "high",
    patterns: [/liquidated damages/i, /early termination.{0,100}(fee|charge|rent)/i, /break.{0,60}lease.{0,80}(fee|charge|rent)/i],
    explanation: "Early-termination charges can be expensive; compare them to any duty to mitigate or re-rent."
  },
  {
    id: "utility-ambiguity",
    clause: "Unclear utilities",
    category: "utilities",
    severity: "low",
    patterns: [/utilities.{0,100}(tenant|resident|responsible|pay)/i, /(electric|water|gas|trash|internet).{0,100}(tenant|resident|pay)/i],
    explanation: "Utility terms should state exactly which bills are included, separately metered, capped, or shared."
  }
];

export const leaseReferenceSnippets: ReferenceSnippet[] = [
  {
    id: "uiuc-tenant-union",
    title: "UIUC tenant resource",
    category: "general",
    text: "UIUC students can use campus tenant resources for lease review and dispute guidance before signing or escalating a landlord issue."
  },
  {
    id: "document-everything",
    title: "Documentation habit",
    category: "general",
    text: "For repair, deposit, and entry disputes, renters should keep written records, dated photos, emails, move-in forms, and receipts."
  },
  {
    id: "auto-renewal-context",
    title: "Renewal deadlines",
    category: "renewal",
    text: "Student leases often include strict renewal or non-renewal notice dates. Missing the date can materially change bargaining power."
  },
  {
    id: "deposit-context",
    title: "Security deposit questions",
    category: "deposit",
    text: "Security deposit clauses should explain what can be deducted, when the deposit is returned, and how itemized damages are documented."
  },
  {
    id: "entry-context",
    title: "Entry and privacy",
    category: "entry",
    text: "Entry clauses should distinguish emergency entry from routine showings, inspections, or repairs, and should identify notice expectations."
  },
  {
    id: "joint-several-context",
    title: "Roommate liability",
    category: "liability",
    text: "Joint-and-several liability can make each tenant responsible for the whole lease balance, not just their own share."
  },
  {
    id: "sublease-context",
    title: "Subleasing changes",
    category: "sublease",
    text: "Sublease rules matter for students leaving campus temporarily; renters should ask about approval standards, fees, and timing."
  },
  {
    id: "maintenance-context",
    title: "Repairs and habitability",
    category: "maintenance",
    text: "Repair clauses should not make tenants responsible for pre-existing conditions or ordinary building systems outside tenant-caused damage."
  },
  {
    id: "fee-context",
    title: "Fee clarity",
    category: "fees",
    text: "Fees are easier to challenge or negotiate when the lease is vague, duplicative, or untethered to actual costs."
  },
  {
    id: "termination-context",
    title: "Early termination",
    category: "termination",
    text: "Early termination provisions should be checked against re-rental obligations, remaining rent, and any fixed liquidated-damages amount."
  }
];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function getCategory(text: string): ClauseCategory {
  const scores = Object.entries(categoryPatterns).map(([category, patterns]) => ({
    category: category as ClauseCategory,
    score: patterns.filter((pattern) => pattern.test(text)).length
  }));
  const best = scores.sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.category : "general";
}

function getTitle(text: string, index: number) {
  const firstSentence = normalizeWhitespace(text).split(/[.;:]/)[0]?.slice(0, 72).trim();
  return firstSentence || `Clause ${index + 1}`;
}

export function chunkLeaseText(text: string): ClauseChunk[] {
  const cleaned = text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const coarseParts = cleaned
    .split(/\n\s*\n|(?=\b(?:section|paragraph|article)\s+\d+[\.:)]?\s+)/i)
    .map(normalizeWhitespace)
    .filter((part) => part.length >= 50);
  const parts = coarseParts.length > 0 ? coarseParts : [normalizeWhitespace(cleaned)];
  const chunks: ClauseChunk[] = [];

  parts.forEach((part) => {
    if (part.length <= 1400) {
      chunks.push({
        id: `clause-${chunks.length + 1}`,
        title: getTitle(part, chunks.length),
        text: part,
        category: getCategory(part)
      });
      return;
    }

    const sentences = part.split(/(?<=[.!?])\s+/);
    let current = "";

    sentences.forEach((sentence) => {
      if ((current + " " + sentence).trim().length > 1100 && current.length > 0) {
        chunks.push({
          id: `clause-${chunks.length + 1}`,
          title: getTitle(current, chunks.length),
          text: current,
          category: getCategory(current)
        });
        current = sentence;
      } else {
        current = `${current} ${sentence}`.trim();
      }
    });

    if (current.length > 0) {
      chunks.push({
        id: `clause-${chunks.length + 1}`,
        title: getTitle(current, chunks.length),
        text: current,
        category: getCategory(current)
      });
    }
  });

  return chunks.slice(0, 80);
}

function getExcerpt(text: string, pattern: RegExp) {
  const match = pattern.exec(text);
  if (!match || match.index === undefined) return text.slice(0, 180);

  const start = match.index < 100 ? 0 : Math.max(0, match.index - 70);
  const end = Math.min(text.length, match.index + match[0].length + 110);
  return text.slice(start, end);
}

export function detectRuleFlags(chunks: ClauseChunk[]): RuleFlag[] {
  const flags: RuleFlag[] = [];
  const seen = new Set<string>();

  chunks.forEach((chunk) => {
    redFlagRules.forEach((rule) => {
      const matchedPattern = rule.patterns.find((pattern) => pattern.test(chunk.text));
      if (!matchedPattern) return;

      const key = `${rule.id}:${chunk.id}`;
      if (seen.has(key)) return;
      seen.add(key);

      flags.push({
        clause: rule.clause,
        text: normalizeWhitespace(getExcerpt(chunk.text, matchedPattern)).slice(0, 240),
        severity: rule.severity,
        explanation: rule.explanation,
        category: rule.category,
        ruleId: rule.id
      });
    });
  });

  const severityRank = { high: 0, medium: 1, low: 2 };
  return flags
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .slice(0, MAX_FLAGS);
}

export function retrieveReferenceSnippets(chunks: ClauseChunk[], flags: RuleFlag[]) {
  const categories = new Set<ClauseCategory>([
    ...flags.map((flag) => flag.category),
    ...chunks.slice(0, MAX_CHUNKS_FOR_CONTEXT).map((chunk) => chunk.category),
    "general"
  ]);

  return leaseReferenceSnippets
    .filter((snippet) => categories.has(snippet.category))
    .slice(0, MAX_REFERENCES);
}

export function buildLeaseIntelligenceReport(text: string): LeaseIntelligenceReport {
  const chunks = chunkLeaseText(text);
  const flags = detectRuleFlags(chunks);
  const references = retrieveReferenceSnippets(chunks, flags);
  const priorityChunks = chunks
    .filter((chunk) => flags.some((flag) => chunk.text.includes(flag.text.slice(0, 40))) || chunk.category !== "general")
    .slice(0, MAX_CHUNKS_FOR_CONTEXT);
  const selectedChunks = priorityChunks.length > 0 ? priorityChunks : chunks.slice(0, MAX_CHUNKS_FOR_CONTEXT);

  const promptContext = [
    "DETERMINISTIC RED-FLAG ENGINE OUTPUT",
    flags.length > 0
      ? flags.map((flag, index) => `${index + 1}. [${flag.severity}] ${flag.clause}: "${flag.text}" - ${flag.explanation}`).join("\n")
      : "No deterministic red flags matched.",
    "",
    "RETRIEVED RENTER GUIDANCE",
    references.map((reference, index) => `${index + 1}. ${reference.title}: ${reference.text}`).join("\n"),
    "",
    "MOST RELEVANT LEASE CHUNKS",
    selectedChunks.map((chunk, index) => `${index + 1}. (${chunk.category}) ${chunk.title}\n${chunk.text.slice(0, 900)}`).join("\n\n")
  ].join("\n");

  return {
    chunks,
    flags,
    references,
    promptContext
  };
}
