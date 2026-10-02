import type { DashboardGraphView } from './dashboardGraph';

export type GraphViewDraft = { view: DashboardGraphView; saved: DashboardGraphView };
export type GraphViewDraftAction =
  | { type: 'edit'; changes: Partial<DashboardGraphView> }
  | { type: 'saved'; view: DashboardGraphView }
  | { type: 'reset' };

export const graphViewsEqual = (left: DashboardGraphView, right: DashboardGraphView) =>
  left.range === right.range && left.metric === right.metric && left.type === right.type;

// Incoming Home settings follow an untouched draft, while an exploration stays local.
export function reduceGraphViewDraft(state: GraphViewDraft, action: GraphViewDraftAction): GraphViewDraft {
  if (action.type === 'edit') return { ...state, view: { ...state.view, ...action.changes } };
  if (action.type === 'reset') return { ...state, view: state.saved };
  return { saved: action.view, view: graphViewsEqual(state.view, state.saved) ? action.view : state.view };
}
