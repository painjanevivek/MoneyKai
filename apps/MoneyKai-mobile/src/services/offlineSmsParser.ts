import weights from './models/offlineSmsModel.json';
import { getOfflineSmsDecision, predictOfflineSms, type OfflineSmsModel } from './offlineSmsEngine';

const model = weights as unknown as OfflineSmsModel;

/** Experimental on-device parser; intentionally not the production ingestion parser. */
export const parseSmsOffline = (body: string) => {
  const prediction = predictOfflineSms(model, body);
  return { ...prediction, decision: getOfflineSmsDecision(model, prediction),
    reviewRequired: true as const, productionEnabled: model.release_enabled };
};
