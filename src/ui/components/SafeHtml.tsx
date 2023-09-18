import { sanitize } from "../util";

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
