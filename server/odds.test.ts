import { describe, it, expect } from "vitest";

// ─── Pure math helpers (copied from odds.ts for unit testing) ─────────────────

function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

function impliedProb(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

function noVigProb(prob1: number, prob2: number): [number, number] {
  const total = prob1 + prob2;
  return [prob1 / total, prob2 / total];
}

function calcEV(trueProb: number, decimalOdds: number): number {
  return (trueProb * (decimalOdds - 1) - (1 - trueProb)) * 100;
}

function calcKelly(winProb: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  const p = winProb;
  const q = 1 - p;
  return (b * p - q) / b;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("americanToDecimal", () => {
  it("converts positive American odds correctly", () => {
    expect(americanToDecimal(150)).toBeCloseTo(2.5);
    expect(americanToDecimal(100)).toBeCloseTo(2.0);
    expect(americanToDecimal(200)).toBeCloseTo(3.0);
  });

  it("converts negative American odds correctly", () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 2);
    expect(americanToDecimal(-200)).toBeCloseTo(1.5);
    expect(americanToDecimal(-150)).toBeCloseTo(1.667, 2);
  });
});

describe("decimalToAmerican", () => {
  it("converts decimal >= 2 to positive American", () => {
    expect(decimalToAmerican(2.5)).toBe(150);
    expect(decimalToAmerican(3.0)).toBe(200);
  });

  it("converts decimal < 2 to negative American", () => {
    expect(decimalToAmerican(1.5)).toBe(-200);
  });
});

describe("impliedProb", () => {
  it("calculates implied probability from positive odds", () => {
    expect(impliedProb(150)).toBeCloseTo(0.4, 2);
    expect(impliedProb(100)).toBeCloseTo(0.5, 2);
  });

  it("calculates implied probability from negative odds", () => {
    expect(impliedProb(-110)).toBeCloseTo(0.524, 2);
    expect(impliedProb(-200)).toBeCloseTo(0.667, 2);
  });

  it("probabilities sum to > 1 (vig present)", () => {
    const homeProb = impliedProb(-110);
    const awayProb = impliedProb(-110);
    expect(homeProb + awayProb).toBeGreaterThan(1);
  });
});

describe("noVigProb", () => {
  it("removes vig and probabilities sum to 1", () => {
    const [p1, p2] = noVigProb(0.524, 0.524);
    expect(p1 + p2).toBeCloseTo(1.0, 5);
  });

  it("maintains relative probability ratio", () => {
    const [p1, p2] = noVigProb(0.6, 0.4);
    expect(p1 / p2).toBeCloseTo(1.5, 2);
  });

  it("handles even money correctly", () => {
    const [p1, p2] = noVigProb(0.5, 0.5);
    expect(p1).toBeCloseTo(0.5, 5);
    expect(p2).toBeCloseTo(0.5, 5);
  });
});

describe("calcEV", () => {
  it("returns positive EV when true prob > implied prob", () => {
    // True prob 55%, odds -110 (implied 52.4%)
    const decimal = americanToDecimal(-110);
    const ev = calcEV(0.55, decimal);
    expect(ev).toBeGreaterThan(0);
  });

  it("returns negative EV when true prob < implied prob", () => {
    // True prob 45%, odds -110 (implied 52.4%)
    const decimal = americanToDecimal(-110);
    const ev = calcEV(0.45, decimal);
    expect(ev).toBeLessThan(0);
  });

  it("returns ~0 EV at fair odds (no edge)", () => {
    // True prob 52.4%, odds -110 (implied 52.4%)
    const decimal = americanToDecimal(-110);
    const trueProb = impliedProb(-110);
    const noVigDecimal = 1 / trueProb;
    const ev = calcEV(trueProb, noVigDecimal);
    expect(Math.abs(ev)).toBeLessThan(0.01);
  });
});

describe("Kelly Criterion", () => {
  it("returns positive Kelly for positive edge", () => {
    const decimal = americanToDecimal(-110);
    const kelly = calcKelly(0.55, decimal);
    expect(kelly).toBeGreaterThan(0);
  });

  it("returns negative Kelly for negative edge (no bet)", () => {
    const decimal = americanToDecimal(-110);
    const kelly = calcKelly(0.45, decimal);
    expect(kelly).toBeLessThan(0);
  });

  it("returns 0 Kelly at break-even probability", () => {
    const decimal = americanToDecimal(-110);
    const breakEvenProb = impliedProb(-110);
    const kelly = calcKelly(breakEvenProb, decimal);
    expect(Math.abs(kelly)).toBeLessThan(0.01);
  });

  it("larger edge = larger Kelly fraction", () => {
    const decimal = americanToDecimal(150);
    const kelly1 = calcKelly(0.45, decimal);
    const kelly2 = calcKelly(0.55, decimal);
    expect(kelly2).toBeGreaterThan(kelly1);
  });
});

describe("Parlay math", () => {
  it("combined probability is product of individual probabilities", () => {
    const legs = [0.55, 0.52, 0.58];
    const combined = legs.reduce((acc, p) => acc * p, 1);
    expect(combined).toBeCloseTo(0.55 * 0.52 * 0.58, 5);
  });

  it("combined decimal odds is product of individual decimal odds", () => {
    const oddsArr = [-110, -115, -105];
    const combined = oddsArr.reduce((acc, o) => acc * americanToDecimal(o), 1);
    expect(combined).toBeGreaterThan(1);
  });

  it("parlay EV is negative when all legs have negative EV", () => {
    // All legs at -110 with true prob 50% (negative edge)
    const legs = [{ prob: 0.50, odds: -110 }, { prob: 0.50, odds: -110 }];
    const combinedProb = legs.reduce((acc, l) => acc * l.prob, 1);
    const combinedDecimal = legs.reduce((acc, l) => acc * americanToDecimal(l.odds), 1);
    const ev = calcEV(combinedProb, combinedDecimal);
    expect(ev).toBeLessThan(0);
  });
});

describe("Steam move detection logic", () => {
  it("identifies reverse line movement correctly", () => {
    // Public bets on one side but money moves the other way
    const publicBetPct = 35; // 35% of bets on Team A
    const moneyPct = 65;     // 65% of money on Team A
    const isRLM = publicBetPct < 50 && moneyPct > 60;
    expect(isRLM).toBe(true);
  });

  it("no RLM when public and money align", () => {
    const publicBetPct = 65;
    const moneyPct = 68;
    const isRLM = publicBetPct < 50 && moneyPct > 60;
    expect(isRLM).toBe(false);
  });
});
