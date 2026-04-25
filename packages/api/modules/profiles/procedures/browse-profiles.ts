import { db, biodataProfile, partnerPreference } from "@repo/database";
import { eq, and, ne, desc } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const browseProfiles = protectedProcedure
	.route({
		method: "GET",
		path: "/profiles/browse",
		tags: ["Profiles"],
		summary: "Browse profiles for matching",
	})
	.input(
		z.object({
			gender: z.enum(["male", "female"]).optional(),
			religion: z.string().optional(),
			community: z.string().optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		// Get user's profile + preferences for smart filtering
		const myProfile = await db.query.biodataProfile.findFirst({
			where: eq(biodataProfile.userId, user.id),
			columns: { gender: true },
		});

		const myPrefs = await db.query.partnerPreference.findFirst({
			where: eq(partnerPreference.userId, user.id),
		});

		// Auto-filter by opposite gender
		let targetGender = input.gender;
		if (!targetGender && myProfile) {
			targetGender = myProfile.gender === "male" ? "female" : myProfile.gender === "female" ? "male" : undefined;
		}

		const conditions = [
			ne(biodataProfile.userId, user.id),
			eq(biodataProfile.isActive, true),
		];

		if (targetGender) {
			conditions.push(eq(biodataProfile.gender, targetGender));
		}
		if (input.religion) {
			conditions.push(eq(biodataProfile.religion, input.religion));
		}
		if (input.community) {
			conditions.push(eq(biodataProfile.community, input.community));
		}

		const results = await db.query.biodataProfile.findMany({
			where: and(...conditions),
			orderBy: [desc(biodataProfile.createdAt)],
		});

		// If user has preferences, sort by match score (best matches first)
		if (myPrefs) {
			return results.sort((a, b) => {
				let scoreA = 0;
				let scoreB = 0;

				const calcAge = (dob: string) => {
					const birth = new Date(dob);
					const today = new Date();
					let age = today.getFullYear() - birth.getFullYear();
					if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
					return age;
				};

				// Age preference match
				if (myPrefs.ageMin || myPrefs.ageMax) {
					const ageA = calcAge(a.dateOfBirth);
					const ageB = calcAge(b.dateOfBirth);
					if ((!myPrefs.ageMin || ageA >= myPrefs.ageMin) && (!myPrefs.ageMax || ageA <= myPrefs.ageMax)) scoreA += 3;
					if ((!myPrefs.ageMin || ageB >= myPrefs.ageMin) && (!myPrefs.ageMax || ageB <= myPrefs.ageMax)) scoreB += 3;
				}

				// Religion match
				if (myPrefs.religions) {
					const prefReligions = myPrefs.religions.toLowerCase().split(",").map((r) => r.trim());
					if (a.religion && prefReligions.includes(a.religion.toLowerCase())) scoreA += 5;
					if (b.religion && prefReligions.includes(b.religion.toLowerCase())) scoreB += 5;
				}

				// Diet match
				if (myPrefs.diet) {
					const prefDiets = myPrefs.diet.toLowerCase().split(",").map((d) => d.trim());
					if (a.diet && prefDiets.includes(a.diet.toLowerCase())) scoreA += 2;
					if (b.diet && prefDiets.includes(b.diet.toLowerCase())) scoreB += 2;
				}

				// Location match
				if (myPrefs.locations) {
					const prefLocs = myPrefs.locations.toLowerCase().split(",").map((l) => l.trim());
					if (a.location && prefLocs.some((l) => a.location!.toLowerCase().includes(l))) scoreA += 4;
					if (b.location && prefLocs.some((l) => b.location!.toLowerCase().includes(l))) scoreB += 4;
				}

				return scoreB - scoreA; // Higher score first
			});
		}

		return results;
	});
