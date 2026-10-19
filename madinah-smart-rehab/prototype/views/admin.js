// Admin workspace: management analytics (aggregates only) and the content/pathway CMS.
import { html, useState } from '../lib/h.js';
import { Icon } from '../lib/ui.js';
import { useStore } from '../lib/store.js';
import { AnalyticsPage } from './admin/analytics.js';
import { ExercisesPage, EducationPage } from './admin/content.js';
import { PathwayPage, RulesPage, QuestionnairesPage, AdminAuditPage } from './admin/governance.js';

const NAV = [
  { id: 'analytics', label: 'التحليلات', icon: 'chart', page: AnalyticsPage },
  { id: 'exercises', label: 'مكتبة التمارين', icon: 'dumbbell', page: ExercisesPage },
  { id: 'pathway', label: 'المسار والمعايير', icon: 'layers', page: PathwayPage },
  { id: 'rules', label: 'قواعد التنبيه', icon: 'bell', page: RulesPage },
  { id: 'questionnaires', label: 'الاستبيانات', icon: 'clipboard', page: QuestionnairesPage },
  { id: 'education', label: 'المحتوى التثقيفي', icon: 'book', page: EducationPage },
  { id: 'audit', label: 'سجل التغييرات', icon: 'file', page: AdminAuditPage },
];

export function AdminApp() {
  const state = useStore();
  const [view, setView] = useState('analytics');
  const cur = NAV.find((n) => n.id === view) || NAV[0];
  const go = (id) => { setView(id); window.scrollTo({ top: 0 }); };
  return html`<div class="workspace">
    <nav class="sidenav" aria-label="أقسام واجهة الإدارة">
      ${NAV.map((n) => html`<button type="button" key=${n.id} id=${`adm-nav-${n.id}`} aria-current=${view === n.id ? 'page' : undefined} onClick=${() => go(n.id)}>
        <${Icon} name=${n.icon} size=${18} />${n.label}</button>`)}
    </nav>
    <div class="ws-main"><${cur.page} state=${state} /></div>
  </div>`;
}
