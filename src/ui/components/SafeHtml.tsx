import createDOMPurify from "dompurify";
const DOMPurify = createDOMPurify(window);
DOMPurify.setConfig({ ADD_ATTR: ["target"] });

const SafeHtml = ({
	dirty,
	htmlIsSafe,
}: {
	dirty: string;
	htmlIsSafe?: boolean;
}) => {
	const clean = htmlIsSafe ? dirty : DOMPurify.sanitize(dirty);

	return (
		<span
			dangerouslySetInnerHTML={{
				__html: clean,
			}}
		/>
	);
};

export default SafeHtml;
