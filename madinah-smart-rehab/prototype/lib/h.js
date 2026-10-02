// One import point for Preact + hooks + htm (vendored, no build step, no CDN at runtime).
export {
  h, html, render, Component, createContext,
  useState, useReducer, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext,
} from '../vendor/standalone.module.js';
