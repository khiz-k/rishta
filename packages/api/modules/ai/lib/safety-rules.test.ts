import { describe, expect, it } from "vitest";

import { stripComplexionSentences } from "./complexion";
import { runSafetyRules } from "./safety-rules";

describe("runSafetyRules", () => {
	it("flags money and off-platform requests together", () => {
		const flag = runSafetyRules(
			"I'm stuck in London with a bank problem and need a small loan. Let's move to WhatsApp so I can explain.",
		);
		expect(flag).toMatchObject({ category: "money", source: "rules" });
		expect(flag?.categories).toEqual(["money", "off_platform"]);
	});

	it("flags visa talk", () => {
		expect(runSafetyRules("I need someone to sponsor my green card soon.")?.category).toBe(
			"visa",
		);
	});

	it("does not flag an ordinary note", () => {
		expect(
			runSafetyRules(
				"Your page says you cook on Sundays. So do I, badly. I'd like to know what your family is like.",
			),
		).toBeNull();
	});
});

describe("stripComplexionSentences", () => {
	it("removes sentences about complexion and reports the words", () => {
		const { text, omitted } = stripComplexionSentences(
			"I am a pharmacist in Edison. I am fair and slim. I cook on Sundays.",
		);
		expect(text).toBe("I am a pharmacist in Edison. I cook on Sundays.");
		expect(omitted).toEqual(["fair"]);
	});

	it("keeps a draft with nothing to remove", () => {
		expect(stripComplexionSentences("We are a close family from Ludhiana.").omitted).toEqual(
			[],
		);
	});

	it("catches spelling variants but keeps fair-minded, which is about character", () => {
		const { text, omitted } = stripComplexionSentences(
			"She is fair-minded and patient. Wheat-ish complexion. She plays chess.",
		);
		expect(text).toBe("She is fair-minded and patient. She plays chess.");
		expect(omitted).toEqual(["wheat-ish"]);
		expect(stripComplexionSentences("He is fair minded.").omitted).toEqual([]);
		expect(stripComplexionSentences("Fair skinned, 5 ft 4.").omitted).toEqual(["fair"]);
	});
});
