import { useMemo } from "react";
import { sanitize } from "../util/sanitize.ts";

export const SafeHtml = ({ dirty }: { dirty: string }) => {
	// Sanitizing is slow enough to matter when a page with many of these re-renders, like the news on the dashboard during a sim
	const html = useMemo(() => ({ __html: sanitize(dirty) }), [dirty]);

	return <span dangerouslySetInnerHTML={html} />;
};
