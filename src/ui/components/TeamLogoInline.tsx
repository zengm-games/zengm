import type { CSSProperties } from "react";

const TeamLogoInline = ({
	alt,
	className,
	imgURL,
	imgURLSmall,
	includePlaceholderIfNoLogo,
	size = 24,
	style,
}: {
	alt?: string;
	className?: string;
	imgURL?: string;
	imgURLSmall?: string;
	includePlaceholderIfNoLogo?: boolean;
	size?: number;
	style?: CSSProperties;
}) => {
	const actualImgURL = imgURLSmall ?? imgURL;
	if (!actualImgURL && !includePlaceholderIfNoLogo) {
		return null;
	}

	return (
		<div
			className={`d-flex align-items-center justify-content-center${
				className ? ` ${className}` : ""
			}`}
			style={{ height: size, width: size, ...style }}
		>
			{actualImgURL ? (
				<img className="mw-100 mh-100" src={actualImgURL} alt={alt} />
			) : null}
		</div>
	);
};

export default TeamLogoInline;
