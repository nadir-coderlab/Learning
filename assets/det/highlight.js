/* Persistent native selection plus accessible tap-to-select for touch devices. */
(function (root) {
  'use strict';
  let active = null;
  function dispose() { if (active) { active(); active = null; } }
  function mount(passage, preview, full) {
    dispose();
    let saved = '', first = null, last = null, tapping = false;
    const doc = passage.ownerDocument;
    function capture() {
      if (tapping) return;
      const selection = doc.getSelection();
      if (!selection || !selection.rangeCount || selection.isCollapsed) return;
      const range = selection.getRangeAt(0);
      if (!passage.contains(range.startContainer) || !passage.contains(range.endContainer)) return;
      const value = selection.toString().trim();
      if (value) { saved = value; preview.textContent = value; }
    }
    doc.addEventListener('selectionchange', capture);
    passage.addEventListener('pointerup', capture);
    passage.style.userSelect = 'text';
    passage.style.webkitUserSelect = 'text';
    active = () => { doc.removeEventListener('selectionchange', capture); passage.removeEventListener('pointerup', capture); };
    const original = passage.innerHTML;
    function tapMode() {
      if (tapping) return;
      tapping = true; saved = ''; first = last = null;
      passage.textContent = ''; preview.textContent = 'اضغط أول كلمة ثم آخر كلمة من الإجابة.';
      const words = full.match(/\S+\s*/g) || [];
      words.forEach((word, index) => {
        const button = doc.createElement('button');
        button.type = 'button'; button.textContent = word.trimEnd();
        button.className = 'hl-word'; button.setAttribute('aria-pressed', 'false');
        // Roving tabindex: one tab stop for the passage, arrows move between words.
        button.setAttribute('tabindex', index === 0 ? '0' : '-1');
        button.addEventListener('keydown', (e) => {
          const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          if (!delta) return;
          const all = Array.from(passage.querySelectorAll('button'));
          const next = all[Math.max(0, Math.min(all.length - 1, index + delta))];
          if (!next || next === button) return;
          e.preventDefault(); button.setAttribute('tabindex', '-1'); next.setAttribute('tabindex', '0'); next.focus && next.focus();
        });
        button.addEventListener('click', () => {
          if (first === null || last !== null) { first = index; last = null; }
          else last = index;
          const end = last === null ? first : last;
          const lo = Math.min(first, end), hi = Math.max(first, end);
          saved = words.slice(lo, hi + 1).join('').trim();
          Array.from(passage.querySelectorAll('button')).forEach((b, i) => {
            const on = i >= lo && i <= hi;
            b.setAttribute('aria-pressed', String(on));
            b.classList.toggle('hl-selected', on);
          });
          preview.textContent = saved;
        });
        passage.appendChild(button);
        if (/\s$/.test(word)) passage.appendChild(doc.createTextNode(' '));
      });
    }
    return {
      capture, tapMode,
      value() { capture(); return saved; },
      tapping() { return tapping; },
      clear() {
        saved = ''; first = last = null; preview.textContent = 'لم تحدد إجابة بعد.';
        if (tapping) { // Leave tap mode: restore the plain passage so drag-selection works again.
          tapping = false; passage.innerHTML = original;
        }
        doc.getSelection()?.removeAllRanges();
      },
      destroy: dispose
    };
  }
  root.DetHighlight = { mount, dispose };
})(typeof window === 'undefined' ? globalThis : window);
