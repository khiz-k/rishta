import type { InferClientInputs, InferClientOutputs } from "@orpc/client";
import type {
	CallProposalView,
	LetterState,
	LetterSummary,
	MarginNote,
	PageView,
} from "@repo/api/modules/biodata/types";
import type { IntroductionView } from "@repo/api/modules/matches/types";
import type { ApiRouterClient } from "@repo/api/orpc/router";
import type { FitReason } from "@repo/database/drizzle/domain";

/** Output and input shapes of every procedure, straight from the router (no hand-written copies). */
export type ApiOutputs = InferClientOutputs<ApiRouterClient>;
export type ApiInputs = InferClientInputs<ApiRouterClient>;

export type Household = ApiOutputs["households"]["get"];
export type HouseholdSettings = Household["settings"];
export type HouseholdRole = Household["role"];
export type MyHousehold = ApiOutputs["households"]["listMine"][number];

export type FolioToday = ApiOutputs["folio"]["today"];
export type FolioPageItem = FolioToday["pages"][number];
export type KeptPage = ApiOutputs["folio"]["kept"][number];
export type PageWithContext = ApiOutputs["profiles"]["getPage"];
export type LetterRef = NonNullable<FolioPageItem["myLetter"]>;

export type MyPage = ApiOutputs["profiles"]["me"];
export type OwnerPage = MyPage["page"];
export type OwnerPhoto = MyPage["photos"][number];
export type Completeness = MyPage["completeness"];

export type Preference = NonNullable<ApiOutputs["preferences"]["get"]>;
export type PreferenceInput = ApiInputs["preferences"]["upsert"];

export type LetterDetail = ApiOutputs["interests"]["get"];
export type Message = ApiOutputs["messages"]["list"]["items"][number];
export type Readers = ApiOutputs["profiles"]["readers"];
export type Wallet = ApiOutputs["wallet"]["get"];
export type FamilyLinkRow = ApiOutputs["familyLinks"]["list"][number];
export type FamilyLinkOpen = ApiOutputs["familyLinks"]["open"];
export type ReportRow = ApiOutputs["reports"]["list"]["items"][number];
export type ClosePreview = ApiOutputs["households"]["closePreview"];
export type ClaimView = ApiOutputs["households"]["getClaim"];

export type {
	CallProposalView,
	FitReason,
	IntroductionView,
	LetterState,
	LetterSummary,
	MarginNote,
	PageView,
};

export type PageSection = PageView["sections"][number];
export type PagePhoto = PageView["photos"][number];
