// Madinah Smart Rehabilitation — interactive prototype (demo data only).
import { html, render, useEffect, useState } from './lib/h.js';
import { initStore, useStore, resetDemo } from './lib/store.js';
import { Icon, Mark, ToastHost, toast } from './lib/ui.js';
import { storage } from './lib/util.js';
import { PatientApp } from './views/patient.js';
import { ClinicianApp } from './views/clinician.js';
import { AdminApp } from './views/admin.js';

initStore();
document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

const ROLES = [
  { id: 'patient', label: 'المريض' },
  { id: 'clinician', label: 'الأخصائي' },
  { id: 'admin', label: 'الإدارة' },
];

function initialRole() {
  const h = (location.hash || '').replace('#', '');
  if (ROLES.some((r) => r.id === h)) return h;
  return storage.get('msr-role', 'patient');
}

function App() {
  useStore();
  const [role, setRole] = useState(initialRole);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => { storage.set('msr-role', role); }, [role]);
  useEffect(() => {
    const on = (e) => { if (e.detail?.role) { setRole(e.detail.role); window.scrollTo({ top: 0 }); } };
    window.addEventListener('msr-nav', on);
    return () => window.removeEventListener('msr-nav', on);
  }, []);
  const doReset = () => { resetDemo(); setConfirmReset(false); toast('رجعت بيانات العرض لحالتها الأولى'); };
  return html`<div class="app">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true"><${Mark} size=${32} /></span>
          <div><div class="brand-name">تأهيل المدينة</div><div class="brand-sub">Madinah Smart Rehab</div></div>
        </div>
        <span class="demo-flag">نموذج أولي · بيانات تجريبية</span>
        <span class="topbar-spacer"></span>
        <div class="role-tabs" role="group" aria-label="عرض المنصة كـ">
          ${ROLES.map((r) => html`<button type="button" key=${r.id} aria-pressed=${String(role === r.id)} onClick=${() => setRole(r.id)}>${r.label}</button>`)}
        </div>
        ${confirmReset
          ? html`<span class="row" style="gap:6px"><span class="small muted">مسح كل تعديلاتك؟</span>
              <button class="btn btn-sm btn-danger" onClick=${doReset}>نعم، أعد الضبط</button>
              <button class="btn btn-sm btn-ghost" onClick=${() => setConfirmReset(false)}>إلغاء</button></span>`
          : html`<button class="btn btn-sm btn-ghost" onClick=${() => setConfirmReset(true)} title="إعادة بيانات العرض للبداية"><${Icon} name="refresh" size=${16} />إعادة الضبط</button>`}
      </div>
    </header>
    <main>
      ${role === 'patient' ? html`<${PatientApp} />` : role === 'clinician' ? html`<${ClinicianApp} />` : html`<${AdminApp} />`}
    </main>
    <p class="footer-note">نموذج أولي لمبادرة تأهيل المدينة الذكي. كل الأسماء والأرقام تجريبية. المنصة لا تشخّص ولا تعتمد العودة للجري أو للرياضة؛ القرار للأخصائي أو الفريق المعتمد.</p>
    <${ToastHost} />
  </div>`;
}

const mount = document.getElementById('app');
mount.textContent = '';
render(html`<${App} />`, mount);

// Installable app (PWA) when served from its own https origin; skipped inside frames/sandboxes.
if ('serviceWorker' in navigator && window.top === window.self && /^https:|^http:\/\/localhost/.test(location.href)) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
