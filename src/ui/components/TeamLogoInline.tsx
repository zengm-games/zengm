const TeamLogoInline = ({
	imgURL,
	imgURLSmall,
	size,
}: {
	imgURL?: string;
	imgURLSmall?: string;
	size: number;
}) => {
	const actualImgURL = imgURLSmall ?? imgURL;
	if (!actualImgURL) {
		return null;
	}

	return (
		<div
			className="d-flex align-items-center justify-content-center"
			style={{ height: size, width: size }}
		>
			<img className="mw-100 mh-100" src={actualImgURL} alt="" />
		</div>
	);
};

export default TeamLogoInline;
