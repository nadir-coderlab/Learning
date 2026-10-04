// Cross-role navigation for the demo: e.g. a patient's red-flag screen can jump to
// "what the clinician sees" with that patient open.
let pending = null;
export function go(role, params = {}) {
  pending = { role, ...params };
  window.dispatchEvent(new CustomEvent('msr-nav', { detail: pending }));
}
export function takePending(role) {
  if (pending && pending.role === role) { const p = pending; pending = null; return p; }
  return null;
}
