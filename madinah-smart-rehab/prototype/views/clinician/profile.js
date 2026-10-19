// Patient profile: header with status and the two clinician actions, then the eleven tabs.
import { html, useEffect, useState } from '../../lib/h.js';
import { Icon, StatusPill, Avatar, Tabs } from '../../lib/ui.js';
import { statusOf, postOpDay, weekOf, GRAFT_AR, SIDE_AR } from '../../lib/engine.js';
import { TABS, SEX_AR, phaseName, refocus } from './common.js';
import { OverviewTab } from './overview.js';
import { ClinicalTab } from './clinical.js';
import { ProgramTab } from './program.js';
import { OutcomesTab, StrengthTab, FunctionalTab } from './measures.js';
import { ActivityTab } from './activity.js';
import { AppointmentsTab, AlertsTab, MessagesTab, RecordTab } from './care.js';
import { PhaseApprovalModal } from './approval.js';
import { VirtualVisitModal } from './visit.js';

export function PatientProfile({ state, p, tab, setTab, onBack, intent, clearIntent }) {
  const cat = state.catalog;
  const st = statusOf(p, cat);
  const day = postOpDay(p);
  // The parent keys this component by patient id, so switching patients starts with no modal open.
  const [modal, setModal] = useState(null);
  useEffect(() => {
    if (intent === 'approval' || intent === 'visit') { setModal(intent); clearIntent?.(); }
  }, [intent]);

  const openAlerts = st.alerts.length;
  const tabs = TABS.map((t) => (t.id === 'alerts' && openAlerts ? { ...t, count: openAlerts } : t));
  const props = { p, cat, state, onTab: setTab };
  const body = {
    overview: OverviewTab, clinical: ClinicalTab, program: ProgramTab, outcomes: OutcomesTab, strength: StrengthTab,
    functional: FunctionalTab, activity: ActivityTab, appointments: AppointmentsTab, alerts: AlertsTab, messages: MessagesTab, record: RecordTab,
  }[tab] || OverviewTab;

  return html`<div class="stack">
    <div><button type="button" class="btn btn-sm btn-ghost" id="profile-back" onClick=${onBack}><${Icon} name="back" size=${16} />قائمة المرضى</button></div>
    <section class="card patient-card" aria-labelledby="profile-name">
      <div class="patient-header">
        <${Avatar} name=${p.name} />
        <div class="stack-sm grow" style="gap:6px;min-width:220px">
          <div class="row" style="gap:8px">
            <h1 id="profile-name" style="font-size:var(--step-2)">${p.name}</h1>
            <${StatusPill} code=${st.code} />
            ${st.awaitingApproval ? html`<${StatusPill} code="approval" />` : null}
          </div>
          <div class="row small muted" style="gap:4px 10px">
            <span>${p.age} سنة · ${SEX_AR[p.sex] || ''}</span>
            <span>الركبة ${SIDE_AR[p.side]}</span>
            <span>${GRAFT_AR[p.graft] || p.graft}${p.meniscusRepair ? ' + إصلاح غضروف' : ''}${p.meniscectomy ? ' + استئصال جزئي للغضروف' : ''}${p.additional ? ` + ${p.additional}` : ''}</span>
            <span>رقم الملف <bdi>${p.mrn}</bdi></span>
          </div>
          <div class="row small" style="gap:4px 10px">
            <strong>اليوم ${day} بعد العملية · الأسبوع ${weekOf(day)}</strong>
            <span>المرحلة ${p.phase}: ${phaseName(p.phase, cat)}</span>
          </div>
          <ul class="reasons small">${st.reasons.slice(0, 3).map((t, i) => html`<li key=${i}><${Icon} name=${st.code === 'green' ? 'check' : 'alert'} size=${15} /><span>${t}</span></li>`)}
            ${st.reasons.length > 3 ? html`<li><span class="muted">و${st.reasons.length - 3} أسباب أخرى في تبويب التنبيهات</span></li>` : null}</ul>
        </div>
        <div class="row profile-actions" style="gap:8px">
          <button type="button" class="btn" id="btn-criteria" onClick=${() => setModal('approval')}><${Icon} name="flag" size=${16} />مراجعة معايير الانتقال</button>
          <button type="button" class="btn btn-primary" id="btn-visit" onClick=${() => setModal('visit')}><${Icon} name="video" size=${16} />بدء العيادة الافتراضية</button>
        </div>
      </div>
    </section>
    <${Tabs} tabs=${tabs} active=${tab} onChange=${setTab} label="أقسام ملف المريض" />
    <div role="tabpanel" aria-labelledby=${`tab-${tab}`} key=${`${p.id}-${tab}`}>
      <${body} ...${props} />
    </div>
    ${modal === 'approval' ? html`<${PhaseApprovalModal} p=${p} cat=${cat} onClose=${() => { setModal(null); refocus('btn-criteria'); }} />` : null}
    ${modal === 'visit' ? html`<${VirtualVisitModal} p=${p} cat=${cat} onClose=${() => { setModal(null); refocus('btn-visit'); }} />` : null}
  </div>`;
}
