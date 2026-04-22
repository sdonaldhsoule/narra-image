import type { ProviderMode } from "@/lib/types";

type CreditInput = {
  providerMode: ProviderMode;
  builtInCreditCost: number;
};

type CreditGuardInput = CreditInput & {
  credits: number;
};

export function shouldChargeCredits(providerMode: ProviderMode) {
  return providerMode === "built_in";
}

export function calculateGenerationCost({
  providerMode,
  builtInCreditCost,
}: CreditInput) {
  return shouldChargeCredits(providerMode) ? builtInCreditCost : 0;
}

export function hasEnoughCredits({
  providerMode,
  credits,
  builtInCreditCost,
}: CreditGuardInput) {
  return credits >= calculateGenerationCost({ providerMode, builtInCreditCost });
}
