import { Figtree, Fraunces } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", axes: ["SOFT", "WONK", "opsz"] });
const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree" });

export const fontVariables = `${fraunces.variable} ${figtree.variable}`;
