export interface RiskFactors {
  missingDrawings: boolean;        // +15%
  inputLevelPhoto: boolean;        // +10%
  inputLevelVerbal: boolean;       // +5% (aggiuntivo rispetto foto)
  urgencyHigh: boolean;            // +10%
  urgencyVeryHigh: boolean;        // +5% aggiuntivo
  isNewClient: boolean;            // +5%
  includesPosa: boolean;           // +10%
  estimatedDimensions: number;     // numero dimensioni stimate: +5% ciascuna, max 3
}

export interface RiskResult {
  factors: RiskFactors;
  coefficient: number;             // 0–0.50
  reliabilityIndex: number;        // 0–100
  status: "preventivabile" | "stimabile" | "non_preventivabile";
  suggestions: string[];
}

// Calcolo deterministico — stessa logica su frontend e backend
export function calculateRisk(factors: RiskFactors): RiskResult {
  let coeff = 0;

  if (factors.missingDrawings) coeff += 0.15;
  if (factors.inputLevelPhoto) coeff += 0.10;
  if (factors.inputLevelVerbal) coeff += 0.05;
  if (factors.urgencyHigh) coeff += 0.10;
  if (factors.urgencyVeryHigh) coeff += 0.05;
  if (factors.isNewClient) coeff += 0.05;
  if (factors.includesPosa) coeff += 0.10;
  coeff += Math.min(factors.estimatedDimensions, 3) * 0.05;

  coeff = Math.min(coeff, 0.50);

  const reliabilityIndex = Math.max(0, Math.round(100 - coeff * 200));

  const suggestions: string[] = [];
  if (factors.missingDrawings) suggestions.push("Richiedi disegno tecnico o almeno uno schizzo quotato");
  if (factors.inputLevelVerbal) suggestions.push("Conferma le dimensioni principali prima di procedere");
  if (factors.isNewClient) suggestions.push("Richiedi riferimenti o anticipo maggiorato per cliente nuovo");
  if (factors.includesPosa) suggestions.push("Verifica accessibilità cantiere per la posa in opera");

  const status =
    coeff <= 0.25 ? "preventivabile" :
    coeff <= 0.40 ? "stimabile" :
    "non_preventivabile";

  return { factors, coefficient: coeff, reliabilityIndex, status, suggestions };
}
