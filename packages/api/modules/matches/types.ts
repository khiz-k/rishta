import { CLOSE_REASONS, INTRODUCTION_STAGES } from "@repo/database";
import { z } from "zod";

import { CallProposalSchema, PageViewSchema } from "../biodata/types";

export const IntroductionViewSchema = z.object({
	id: z.string(),
	letterId: z.string(),
	stage: z.enum(INTRODUCTION_STAGES),
	/** When both seals broke (the letter was accepted). */
	sealsBrokeAt: z.string(),
	/** When you first saw the seals broken; null means the break still plays once. */
	sealsSeenAt: z.string().nullable(),
	you: z.object({
		firstName: z.string(),
		timeZone: z.string(),
		city: z.string().nullable(),
		phoneShared: z.boolean(),
		familyShared: z.boolean(),
	}),
	them: z.object({
		page: PageViewSchema,
		firstName: z.string(),
		timeZone: z.string(),
		phoneShared: z.boolean(),
		familyShared: z.boolean(),
		contact: z.object({
			email: z.string().nullable(),
			phone: z.string().nullable(),
			family: z.object({ name: z.string(), phone: z.string() }).nullable(),
		}),
	}),
	proposals: z.array(CallProposalSchema),
	lastMessageAt: z.string().nullable(),
	/** After 7 quiet days: "It's been a week. Propose a call, or close kindly." */
	quietNudge: z.boolean(),
	closed: z
		.object({
			at: z.string(),
			byYou: z.boolean(),
			note: z.string().nullable(),
			reason: z.enum(CLOSE_REASONS).nullable(),
		})
		.nullable(),
});
export type IntroductionView = z.infer<typeof IntroductionViewSchema>;

export const IntroductionSummarySchema = z.object({
	id: z.string(),
	letterId: z.string(),
	stage: z.enum(INTRODUCTION_STAGES),
	otherHandle: z.string(),
	otherName: z.string(),
	otherCity: z.string().nullable(),
	bookedSlot: z.string().nullable(),
	lastMessageAt: z.string().nullable(),
	unread: z.number().int(),
	yourMove: z.boolean(),
	sealsSeen: z.boolean(),
	closedAt: z.string().nullable(),
});
