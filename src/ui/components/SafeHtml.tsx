import { sanitize } from "../util/sanitize.ts";

export const SafeHtml = ({ dirty }: { dirty: string }) => {
	return (
		<span
			dangerouslySetInnerHTML={{
				__html: sanitize(dirty),
			}}
		/>
	);
};
