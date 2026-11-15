import { Caveat, Figtree, Fraunces } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", axes: ["SOFT", "WONK", "opsz"] });
const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree" });

const caveat = Caveat({ subsets: ["latin", "latin-ext"], weight: ["600", "700"], variable: "--font-caveat" });

export const fontVariables = `${fraunces.variable} ${figtree.variable} ${caveat.variable}`;
