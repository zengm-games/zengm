import { sanitize } from "../util/index.ts";

const SafeHtml = ({
	dirty,
	htmlIsSafe,
}: {
	dirty: string;
	htmlIsSafe?: boolean;
}) => {
	const clean = htmlIsSafe ? dirty : sanitize(dirty);

	return (
		<span
			dangerouslySetInnerHTML={{
				__html: clean,
			}}
		/>
	);
};

export default SafeHtml;
