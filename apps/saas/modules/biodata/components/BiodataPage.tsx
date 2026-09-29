"use client";

import { usePageText } from "../lib/fields";
import { BiodataDocument, type BiodataDocumentProps } from "./BiodataDocument";

/** The biodata page in the reader's own locale (the reader, letters, the editor's preview). */
export function BiodataPage(props: BiodataDocumentProps) {
	const text = usePageText();
	return <BiodataDocument {...props} text={text} />;
}
