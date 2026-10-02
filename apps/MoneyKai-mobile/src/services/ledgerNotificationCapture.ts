import { useAuthStore } from '@/stores/useAuthStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useConnectStore } from '@/stores/useConnectStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useLocalLedgerStore } from '@/stores/useLocalLedgerStore';
import { PAYMENT_CONNECTIONS } from '@/constants/paymentConnections';
import { isNotificationCaptureEnabled } from '@/config/environment';
import { parseCapturedSignal } from './captureParser';
import { ledgerRequest } from './localLedger';
import type { CaptureSignalInput } from '@/types/capture';

/** Notifications remain private. Successful outcomes and drafts commit together. */
export async function ingestLedgerNotification(input:CaptureSignalInput) {
  const owner=useAuthStore.getState().user?.id;
  const {settings,merchantRules}=useCaptureStore.getState();
  const app=PAYMENT_CONNECTIONS.find(a=>a.packageName===input.rawPayload?.rawPackageName);
  if(input.source!=='notification' || !owner || !isNotificationCaptureEnabled() || !settings.autoCaptureEnabled ||
    !settings.notificationCaptureEnabled || !settings.notificationExplainerAcceptedAt ||
    input.rawPayload?.notificationOwnerId!==owner || !app || !useConnectStore.getState().notificationAppsByUser[owner]?.[app.id] ||
    useBudgetStore.getState().settings.monthly_allowance<=0 || !useLocalLedgerStore.getState().ready) return;
  const receivedAt=input.receivedAt || new Date().toISOString();
  const parsed=parseCapturedSignal(input,merchantRules.filter(r=>!r.userId || r.userId===owner));
  const {digest}=await ledgerRequest<{digest:string}>(owner,{op:'digest',value:JSON.stringify([app.packageName,receivedAt,input.title,input.body])});
  if(owner!==useAuthStore.getState().user?.id) return;
  const row=parsed.amount && parsed.type && parsed.parseStatus!=='ignore'?{
    id:'notification_'+digest,signalId:digest,user_id:owner,amount:parsed.amount,type:parsed.type,
    category:parsed.category || 'other',suggestedCategory:parsed.category,description:parsed.merchantLabel || 'Payment notification',
    counterpartyName:parsed.merchantLabel,payment_method:parsed.paymentMethod || 'bank',
    transaction_date:parsed.transactionDate || receivedAt.slice(0,10),captureSource:'notification',sourceApp:app.packageName,
    semantics:parsed.semantics,parserVersion:parsed.parserVersion,reviewRequired:true,reviewStatus:'pending',status:'pending',
    confidence:parsed.confidence,createdAt:new Date().toISOString(),syncStatus:'local_only',
  }:undefined;
  await ledgerRequest(owner,{op:'captureOutcome',identity:digest,row});
  if(owner===useAuthStore.getState().user?.id) await Promise.all([
    useLocalLedgerStore.getState().queryDrafts(),useLocalLedgerStore.getState().refreshOverview(),
  ]);
}
