// Sugar water mixes: liters of water per kg sugar, and solution density factor.
export const SUGAR_WATER = {
  oneToOne: {
    water: 1,
    solution: 0.8
  },
  threeToTwo: {
    water: 0.667,
    solution: 0.76
  }
} as const;

export type SugarWaterMix = keyof typeof SUGAR_WATER;

// Stored sugar contains 20% water.
export const SUGAR_THEORETICAL = 1.2;

/** Liters of solution made from 1 kg sugar. */
export function solutionPerSugar(mix: SugarWaterMix) {
  const base = SUGAR_WATER[mix];
  return (1 + base.water) * base.solution;
}

/** Kg sugar in 1 liter of solution. */
export function sugarPerSolution(mix: SugarWaterMix) {
  return 1 / solutionPerSugar(mix);
}
