import React, { useState, useEffect } from 'react';
import './App.css';
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
  mu?: number;
}

function calculateImpedance({
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
  const gamma1 = jw.mul(sigma1).mul(mu).sqrt(
  );
  const gamma1_t = gamma1.mul(thickness);
  let tanh_gamma1_t = gamma1_t.tanh();

  // Simplified skin depth approximation (for comparison)
  const skinDepth = Math.sqrt(2 / (omega * mu * sigma1));
  const isThicknessLarge = thickness > 5 * skinDepth; // Adjust the factor as needed

  console.log("thickness",thickness,"skinDepth",skinDepth,"isThicknessLarge",isThicknessLarge);

  // Handle tanh(gamma1_t) close to 1
  if (isThicknessLarge && Math.abs(tanh_gamma1_t.re - 1) < 1e-6 && Math.abs(tanh_gamma1_t.im) < 1e-6) {
    tanh_gamma1_t = new Complex(1, 0);
  }

  const denom_factor = Z01.add(Z02.mul(tanh_gamma1_t));
  if (denom_factor.abs() < 1e-12) {
    return new Complex(Infinity, Infinity);
  }

  const fraction = Z02.add(Z01.mul(tanh_gamma1_t)).div(denom_factor);
  const Z = new Complex(R0, omega * L0).add(
    new Complex(k * omega * Math.sqrt(L0 * L2), 0).pow(2).div(Z01.mul(fraction).add(new Complex(0, omega * L2)))
  );

  console.log("Z",Z);
  return Z;
}

interface SigmaEqParams {
  impedance: Complex;
  omega: number;
  mu?: number;
}

function calculateSigmaEq({ impedance, omega, mu = 4 * Math.PI * 1e-7 }: SigmaEqParams): number {
  if (impedance.re === 0) {
    return 0;
  }
  return 0.5 * (omega * mu) / Math.pow(impedance.re, 2);
}

function App() {
  const [frequency, setFrequency] = useState(60e3);
  const [sigma1Ms, setSigma1Ms] = useState(26.62);
  const [n, setN] = useState(0.1);
  const [thicknessUm, setThicknessUm] = useState(400);
  const [k, setK] = useState(1);
  const [L0Nh, setL0Nh] = useState(30);
  const [L2Nh, setL2Nh] = useState(30);
  const [R0, setR0] = useState(0);

  const [results, setResults] = useState<
    { sigma_br: number; Z_in_al_br: string; sigma_eq: number }[]
  >([]);

  useEffect(() => {
    const sigma1 = sigma1Ms * 1e6;
    const omega = 2 * Math.PI * frequency;
    const mu = 4 * Math.PI * 1e-7;
    const thickness = thicknessUm * 1e-6;
    const L0 = L0Nh * 1e-9;
    const L2 = L2Nh * 1e-9;

    const calculatedImpedanceComplex = calculateImpedance({
      sigma1,
      n,
      frequency,
      thickness,
      k,
      L0,
      L2,
      R0,
      mu,
    });
    const calculatedSigmaEq = calculateSigmaEq({
      impedance: calculatedImpedanceComplex,
      omega,
      mu,
    });

    setResults([
      {
        sigma_br: n * sigma1,
        Z_in_al_br: `${calculatedImpedanceComplex.re.toPrecision(
          5
        )}+${calculatedImpedanceComplex.im.toPrecision(2)}j`,
        sigma_eq: calculatedSigmaEq,
      },
    ]);
  }, [frequency, sigma1Ms, n, thicknessUm, k, L0Nh, L2Nh, R0]);

  return (
    <div className="App">
      <h1>Conductivity Inversion Tool</h1>
      <div className="controls">
        <div className="control-row">
          <label htmlFor="frequency">Frequency (Hz):</label>
          <input
            type="range"
            id="frequency"
            min="1e3"
            max="100e3"
            step="1e3"
            value={frequency}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                setFrequency(newValue);
              } else {
                console.warn('Invalid frequency value:', e.target.value);
              }
            }}
          />
          <span>{frequency.toExponential(2)}</span>
        </div>
        <div className="control-row">
          <label htmlFor="sigma1">Sigma 1 (MS/m):</label>
          <input
            type="range"
            id="sigma1"
            min="1"
            max="50"
            step="0.1"
            value={sigma1Ms}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                setSigma1Ms(newValue);
              } else {
                console.warn('Invalid sigma1 value:', e.target.value);
              }
            }}
          />
          <span>{sigma1Ms.toFixed(2)}</span>
        </div>
        <div className="control-row">
          <label htmlFor="n">n (σ₂ / σ₁):</label>
          <input
            type="range"
            id="n"
            min="0.01"
            max="1.0"
            step="0.01"
            value={n}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                setN(newValue);
              } else {
                console.warn('Invalid n value:', e.target.value);
              }
            }}
          />
          <span>{n.toFixed(2)}</span>
        </div>
        <div className="control-row">
          <label htmlFor="thickness">Thickness (µm):</label>
          <input
            type="range"
            id="thickness"
            min="100"
            max="1000"
            step="10"
            value={thicknessUm}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                setThicknessUm(newValue);
              } else {
                console.warn('Invalid thickness value:', e.target.value);
              }
            }}
          />
          <span>{thicknessUm}</span>
        </div>
        <div className="control-row">
          <label htmlFor="k">Coupling Coefficient (k):</label>
          <input
            type="range"
            id="k"
            min="0"
            max="1"
            step="0.01"
            value={k}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                setK(newValue);
              } else {
                console.warn('Invalid k value:', e.target.value);
              }
            }}
          />
          <span>{k.toFixed(2)}</span>
        </div>
        <div className="control-row">
          <label htmlFor="L0">L₀ (nH):</label>
          <input
            type="range"
            id="L0"
            min="10"
            max="50"
            step="1"
            value={L0Nh}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                setL0Nh(newValue);
              } else {
                console.warn('Invalid L0 value:', e.target.value);
              }
            }}
          />
          <span>{L0Nh}</span>
        </div>
        <div className="control-row">
          <label htmlFor="L2">L₂ (nH):</label>
          <input
            type="range"
            id="L2"
            min="10"
            max="50"
            step="1"
            value={L2Nh}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                setL2Nh(newValue);
              } else {
                console.warn('Invalid L2 value:', e.target.value);
              }
            }}
          />
          <span>{L2Nh}</span>
        </div>
        <div className="control-row">
          <label htmlFor="R0">R₀ (Ω):</label>
          <input
            type="range"
            id="R0"
            min="0"
            max="10"
            step="0.1"
            value={R0}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                setR0(newValue);
              } else {
                console.warn('Invalid R0 value:', e.target.value);
              }
            }}
          />
          <span>{R0.toFixed(1)}</span>
        </div>
      </div>

      <div className="results">
        <h2>Results</h2>
        {results.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>sigma_br (S/m)</th>
                <th>Z_in_al_br (Ohms)</th>
                <th>sigma_eq (S/m)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{result.sigma_br.toExponential(2)}</td>
                  <td>{result.Z_in_al_br}</td>
                  <td>{result.sigma_eq.toExponential(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;