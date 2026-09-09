# 2026-09-09: selection repair and original practice bank

## Delivered scope

- 40 original reading passages (80+ words each) across A2-B1, B1-B2 and B2-C1.
- 80 contextual Fill in the Blanks items and 80 Listen and Type sentences derived from those passages. **200 practice items, not 200 unique passages.**
- Existing Read and Complete flow adds function-word gaps with `augmentGaps`. First/last sentences remain intact in source passages.
- Every source vocabulary gap has an Arabic meaning and each passage has an Arabic summary.
- The two uploaded transcript files provided task-strategy context. These items are newly authored, not official questions or transcript copies. No proprietary scoring or guaranteed DET outcome is claimed.
- Bank loads before asynchronous packs and participates in existing adaptive selection, history and review. Existing data and personal results are preserved.

## Touch selection

Previously `getSelection().toString()` was read only on submit. Mobile focus changes can collapse that selection. The new helper caches valid in-passage selections on `selectionchange` and `pointerup`, ignores outside selections and preserves the cached value when native selection collapses.

An explicit tap mode lets the user select first and last words with normal accessible buttons. It supports reverse ranges, single words, reset, keyboard activation and visible answer preview. Submitting without any selection does not advance or record an incorrect answer. The existing exercise timer still applies.

Listeners are removed when scoring, leaving the view or creating a new selection. Touch mode is a training accommodation, not a claim about the official test UI. Highlight percentages remain the site's existing approximate rubric.

## Validation and publishing

Run `node --test tests/*.test.mjs`. Regression tests cover lost native selections, out-of-passage selections, tap ranges, clearing, bank counts, gaps, deduplication and inline JavaScript syntax. No physical iPhone or browser E2E verification was performed.

New assets live under `public/assets/det` and are covered by the existing `pages.yml` archive step. Do not edit `gh-pages` manually. Publish through the existing main-branch workflow, not another hosting service.

At inspection, main was f0d6345 and gh-pages was 91626fc (synchronised from f0d6345). The previous assertion that path120 was unpublished was incorrect. Development head 1320b20 contained newer section simulations and memorisation-kit work which had not reached main.

## Remaining scope

This is a first 200-item batch. It does not implement hundreds of unique passages, add new Interactive Reading sets, recreate the full official test engine or comprehensively transform every transcript into lessons. Those are distinct expansion tasks.
