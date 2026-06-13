import type { FinancialDocumentType, ParsedStatementRow } from './financialDocument';
import type { FinancialEmailCategory } from './gmail';
import type { PortfolioHolding, WealthSnapshot } from './portfolio';
import type { WealthInsight } from './wealth';

export interface AiEmailClassificationRequest {
  senderDomain: string;
  subject: string;
  snippet?: string | null;
  attachmentNames: string[];
}

export interface AiEmailClassificationResult {
  category: FinancialEmailCategory;
  providerKey?: string | null;
  confidence: number;
  reason: string;
}

export interface AiStatementRowsRequest {
  documentType: FinancialDocumentType;
  rows: ParsedStatementRow[];
}

export interface AiStatementRowsResponse {
  rows: ParsedStatementRow[];
  reviewRequired: true;
  validationReasons: string[];
}

export interface AiWealthInsightRequest {
  snapshot: WealthSnapshot;
  holdings: PortfolioHolding[];
}

export interface AiWealthInsightResponse {
  enabled: boolean;
  insights: WealthInsight[];
  reviewRequired: true;
}
