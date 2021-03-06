import { atom } from "jotai";

export const modeAtom = atom<"hand" | "pen" | "erase" | "color">("pen");

export const dimensionAtom = atom({ width: 0, height: 0 });

export const offsetAtom = atom({ x: 0, y: 0 });

export const zoomAtom = atom(1);
