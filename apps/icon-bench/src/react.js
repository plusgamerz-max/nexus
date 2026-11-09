// The only file that knows where React comes from. For a bundled Electron/Tauri build, swap for: import React from 'react'; import htm from 'htm'.
export const {useState,useMemo,useEffect,useRef}=window.React;
export const html=window.htm.bind(window.React.createElement);
