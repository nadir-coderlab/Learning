// Clinician workspace: dashboard, patient list and profile, exercise library, audit trail.
// Decision support only — every approval is an explicit, confirmed click by the clinician.
import { html, useEffect, useMemo, useState } from '../lib/h.js';
import { Icon } from '../lib/ui.js';
import { useStore, patientById } from '../lib/store.js';
import { takePending } from '../lib/nav.js';
import { buildRoster, normalizeTab } from './clinician/common.js';
import { Dashboard } from './clinician/dashboard.js';
import { PatientList } from './clinician/patients.js';
import { PatientProfile } from './clinician/profile.js';
import { LibraryPage, AuditPage } from './clinician/library.js';

const NAV = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: 'grid' },
  { id: 'patients', label: 'المرضى', icon: 'users' },
  { id: 'library', label: 'مكتبة التمارين', icon: 'book' },
  { id: 'audit', label: 'سجل التغييرات', icon: 'file' },
];

export function ClinicianApp() {
  const state = useStore();
  const [view, setView] = useState('dashboard');
  const [pid, setPid] = useState(null);
  const [tab, setTab] = useState('overview');
  const [intent, setIntent] = useState(null);
  const [list, setList] = useState({ q: '', status: 'all', phase: 'all' });
  const roster = useMemo(() => buildRoster(state), [state]);
  const red = roster.filter((r) => r.st.code === 'red').length;

  const top = () => window.scrollTo({ top: 0 });
  const openPatient = (id, t = 'overview', why = null) => {
    setPid(id); setTab(normalizeTab(t)); setIntent(why); setView('patients'); top();
  };
  const go = (id) => { setView(id); setPid(null); top(); };
  const filterBy = (status) => { setList({ q: '', status, phase: 'all' }); go('patients'); };

  // Cross-role navigation (e.g. the patient's red-flag screen → "what the clinician sees").
  useEffect(() => {
    const take = () => {
      const nav = takePending('clinician');
      const id = nav?.patientId || nav?.pid;
      if (id && patientById(id)) openPatient(id, nav.tab, nav.intent || null);
      else if (nav?.view && NAV.some((n) => n.id === nav.view)) go(nav.view);
    };
    take();
    window.addEventListener('msr-nav', take);
    return () => window.removeEventListener('msr-nav', take);
  }, []);

  const p = pid ? patientById(pid) : null;
  let main;
  if (view === 'patients' && p) {
    main = html`<${PatientProfile} key=${p.id} state=${state} p=${p} tab=${tab} setTab=${setTab}
      intent=${intent} clearIntent=${() => setIntent(null)} onBack=${() => { setPid(null); top(); }} />`;
  } else if (view === 'patients') {
    main = html`<${PatientList} roster=${roster} list=${list} setList=${setList} onOpen=${openPatient} cat=${state.catalog} />`;
  } else if (view === 'library') {
    main = html`<${LibraryPage} cat=${state.catalog} />`;
  } else if (view === 'audit') {
    main = html`<${AuditPage} audit=${state.audit} />`;
  } else {
    main = html`<${Dashboard} roster=${roster} onOpen=${openPatient} onFilter=${filterBy} />`;
  }

  return html`<div class="workspace">
    <nav class="sidenav" aria-label="أقسام واجهة الأخصائي">
      ${NAV.map((n) => html`<button type="button" key=${n.id} id=${`nav-${n.id}`} aria-current=${view === n.id ? 'page' : undefined} onClick=${() => go(n.id)}>
        <${Icon} name=${n.icon} size=${18} />${n.label}
        ${n.id === 'patients' && red ? html`<span class="count" aria-label=${`${red} تنبيه سريري`}>${red}</span>` : null}
      </button>`)}
    </nav>
    <div class="ws-main">${main}</div>
  </div>`;
}
