import Complex from 'complex.js';

interface ImpedanceParams {
  sigma1: number;
  n: number;
  frequency: number;
  thickness: number;
  k: number;
  L0: number;
  L2: number;
  R0: number;
  mu?: number; // Optional permeability
}

export function calculateImpedance({
  sigma1,
  n,
  frequency,
  thickness,
  k,
  L0,
  L2,
  R0,
  mu = 4 * Math.PI * 1e-7,
}: ImpedanceParams): Complex {
  const omega = 2 * Math.PI * frequency;
  const sigma2 = n * sigma1;
  const jw = new Complex(0, omega);
  const Z01 = jw.mul(mu).div(sigma1).sqrt();
  const Z02 = jw.mul(mu).div(sigma2).sqrt();
  const gamma1 = jw.mul(sigma1).mul(mu).sqrt();
  const gamma1_t = gamma1.mul(thickness);
  const tanh_gamma1_t = gamma1_t.tanh();

  const denom_factor = Z01.add(Z02.mul(tanh_gamma1_t));
  if (denom_factor.abs() < 1e-12) {
    return new Complex(Infinity, Infinity); // Or handle this differently
  }

  const fraction = Z02.add(Z01.mul(tanh_gamma1_t)).div(denom_factor);
  const Z = new Complex(R0, omega * L0).add(
    new Complex(k * omega * Math.sqrt(L0 * L2), 0).pow(2).div(Z01.mul(fraction).add(new Complex(0, omega * L2)))
  );
  return Z;
}

interface SigmaEqParams {
  impedance: Complex;
  omega: number;
  mu?: number;
}

export function calculateSigmaEq({ impedance, omega, mu = 4 * Math.PI * 1e-7 }: SigmaEqParams): number {
  if (impedance.re === 0) {
    return 0; // Avoid division by zero
  }
  return 0.5 * (omega * mu) / Math.pow(impedance.re, 2);
}