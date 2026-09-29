import { describe, expect, it } from "vitest";

import { containsSuggestionVerbatim, findContactDetails, firstLineOf } from "./note-rules";

describe("findContactDetails", () => {
	it("finds phone numbers, emails, links and messenger handles", () => {
		expect(findContactDetails("Call me on +1 732 555 0199 tonight")).toBe("phone");
		expect(findContactDetails("write to priya.s@example.com")).toBe("email");
		expect(findContactDetails("karan at gmail dot com")).toBe("email");
		expect(findContactDetails("see wa.me/17325550199")).toBe("phone");
		expect(findContactDetails("my site is karanm.com")).toBe("url");
		expect(findContactDetails("telegram: karan_m")).toBe("handle");
		expect(findContactDetails("find me @karan.m")).toBe("handle");
	});

	it("leaves ordinary notes alone", () => {
		expect(
			findContactDetails(
				"I moved to Toronto in 2016 and started residency in 2019. Your page says your family is from Jalandhar.",
			),
		).toBeNull();
		expect(
			findContactDetails("We could talk on WhatsApp some day, once we both say yes."),
		).toBeNull();
	});
});

describe("containsSuggestionVerbatim", () => {
	const line =
		"I noticed we both hope to marry within a year, and both our families are from Punjab.";

	it("refuses a note that still contains the suggested line", () => {
		expect(
			containsSuggestionVerbatim(
				`${line} I'd like to hear about the pharmacy you want to open.`,
				[line],
			),
		).toBe(true);
		expect(containsSuggestionVerbatim(line.toUpperCase(), [line])).toBe(true);
	});

	it("accepts the line once a word has changed", () => {
		expect(
			containsSuggestionVerbatim(
				"I noticed we both hope to marry within the year, and both our families are from Punjab.",
				[line],
			),
		).toBe(false);
	});
});

describe("firstLineOf", () => {
	it("returns the first sentence, trimmed", () => {
		expect(firstLineOf("Your page mentions your nani's garden. Mine grows chillies.")).toBe(
			"Your page mentions your nani's garden.",
		);
		expect(firstLineOf(null)).toBeNull();
	});
});
