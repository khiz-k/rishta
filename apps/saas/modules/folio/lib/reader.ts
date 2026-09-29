import type { FolioPageState, PassReason } from "@repo/database/drizzle/domain";
import type {
	FitReason,
	FolioPageItem,
	KeptPage,
	LetterRef,
	MarginNote,
	PageView,
} from "@shared/lib/api-types";

/**
 * One page in a reader: a folio page (today's five to seven) or a kept page. The reader never
 * decides anything by itself; turning a page never answers it.
 */
export interface ReaderItem {
	key: string;
	folioPageId: string | null;
	page: PageView | null;
	reasons: FitReason[];
	pencilNotes: MarginNote[];
	kept: boolean;
	state: FolioPageState | null;
	passReason: PassReason | null;
	seenBefore: boolean;
	myLetter: LetterRef | null;
	/** They wrote to you first: the answer lives in their letter, not in a new note. */
	theirLetterId?: string | null;
	keptBy: string | null;
	familyLinksAllowed: boolean;
}

export type ReaderMode = "folio" | "kept" | "single";

export function fromFolioPage(item: FolioPageItem): ReaderItem {
	return {
		key: item.folioPageId,
		folioPageId: item.folioPageId,
		page: item.page,
		reasons: item.reasons,
		pencilNotes: item.pencilNotes,
		kept: item.kept || item.state === "kept",
		state: item.state,
		passReason: null,
		seenBefore: item.seenBefore,
		myLetter: item.myLetter,
		keptBy: null,
		familyLinksAllowed: true,
	};
}

export function fromKeptPage(item: KeptPage): ReaderItem {
	return {
		key: item.page.handle,
		folioPageId: null,
		page: item.page,
		reasons: item.reasons,
		pencilNotes: item.pencilNotes,
		kept: true,
		state: null,
		passReason: null,
		seenBefore: false,
		myLetter: item.myLetter,
		keptBy: item.keptBy,
		familyLinksAllowed: true,
	};
}

export const PASS_REASON_OPTIONS: PassReason[] = [
	"timeline",
	"distance",
	"family",
	"faith",
	"lifestyle",
	"feeling",
	"other",
];

/** A pending letter the candidate sealed can be taken back; anything else is settled. */
export function canTakeBack(letter: LetterRef | null) {
	return letter?.state === "waiting_for_them";
}
