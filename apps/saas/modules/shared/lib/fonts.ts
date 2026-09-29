import {
	Anek_Bangla,
	Anek_Devanagari,
	Anek_Gujarati,
	Anek_Gurmukhi,
	Anek_Latin,
	Anek_Tamil,
	Anek_Telugu,
	Noto_Nastaliq_Urdu,
	Noto_Serif_Gujarati,
	Tiro_Bangla,
	Tiro_Devanagari_Hindi,
	Tiro_Gurmukhi,
	Tiro_Tamil,
	Tiro_Telugu,
} from "next/font/google";

/**
 * design.md §8. Tiro Devanagari Hindi for names, headings, notes and letters (one weight, with
 * italic; never a faux bold). Anek Latin for values and UI, variable weight and width, so labels
 * can be set in condensed caps (wdth 75). The script fallbacks are named per language and are
 * not preloaded: only glyphs actually rendered on a page trigger a download.
 */
export const tiro = Tiro_Devanagari_Hindi({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["latin", "latin-ext", "devanagari"],
	variable: "--font-tiro",
	display: "swap",
});

export const anek = Anek_Latin({
	weight: "variable",
	axes: ["wdth"],
	subsets: ["latin", "latin-ext"],
	variable: "--font-anek",
	display: "swap",
});

const tiroGurmukhi = Tiro_Gurmukhi({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["gurmukhi"],
	variable: "--font-tiro-pa",
	preload: false,
});

const tiroBangla = Tiro_Bangla({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["bengali"],
	variable: "--font-tiro-bn",
	preload: false,
});

const tiroTamil = Tiro_Tamil({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["tamil"],
	variable: "--font-tiro-ta",
	preload: false,
});

const tiroTelugu = Tiro_Telugu({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["telugu"],
	variable: "--font-tiro-te",
	preload: false,
});

// Tiro has no Gujarati cut.
const notoSerifGujarati = Noto_Serif_Gujarati({
	weight: "variable",
	subsets: ["gujarati"],
	variable: "--font-noto-serif-gu",
	preload: false,
});

// Urdu pages mirror (dir="rtl") and are set in Nastaliq with a 2.0 line height.
const nastaliq = Noto_Nastaliq_Urdu({
	weight: "variable",
	subsets: ["arabic"],
	variable: "--font-nastaliq",
	preload: false,
});

const anekDevanagari = Anek_Devanagari({
	weight: "variable",
	axes: ["wdth"],
	subsets: ["devanagari"],
	variable: "--font-anek-devanagari",
	preload: false,
});

const anekGurmukhi = Anek_Gurmukhi({
	weight: "variable",
	axes: ["wdth"],
	subsets: ["gurmukhi"],
	variable: "--font-anek-pa",
	preload: false,
});

const anekGujarati = Anek_Gujarati({
	weight: "variable",
	axes: ["wdth"],
	subsets: ["gujarati"],
	variable: "--font-anek-gu",
	preload: false,
});

const anekBangla = Anek_Bangla({
	weight: "variable",
	axes: ["wdth"],
	subsets: ["bengali"],
	variable: "--font-anek-bn",
	preload: false,
});

const anekTamil = Anek_Tamil({
	weight: "variable",
	axes: ["wdth"],
	subsets: ["tamil"],
	variable: "--font-anek-ta",
	preload: false,
});

const anekTelugu = Anek_Telugu({
	weight: "variable",
	axes: ["wdth"],
	subsets: ["telugu"],
	variable: "--font-anek-te",
	preload: false,
});

/** Every font variable, for the <html> element. */
export const fontVariables = [
	tiro,
	anek,
	tiroGurmukhi,
	tiroBangla,
	tiroTamil,
	tiroTelugu,
	notoSerifGujarati,
	nastaliq,
	anekDevanagari,
	anekGurmukhi,
	anekGujarati,
	anekBangla,
	anekTamil,
	anekTelugu,
]
	.map((font) => font.variable)
	.join(" ");
