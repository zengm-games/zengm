import { useState, type CSSProperties, useRef, useEffect } from "react";
import JerseyNumber from "./JerseyNumber";
import { displayFace, toWorker } from "../util";
import type { Face } from "facesjs";

export const TeamLogoJerseyInfo = ({
	brandedTeam,
	selectedTeam,
}: {
	brandedTeam: {
		colors: [string, string, string];
		imgURL?: string;
		jersey?: string;
		name: string;
	};
	selectedTeam: {
		abbrev: string;
		region: string;
	};
}) => {
	const [faceWrapper, setFaceWrapper] = useState<HTMLDivElement | null>(null);
	const face = useRef<Face | undefined>();

	useEffect(() => {
		const renderFace = async () => {
			if (!face.current) {
				face.current = await toWorker("main", "generateFace", undefined);
			}

			if (faceWrapper && face.current) {
				displayFace({
					colors: brandedTeam.colors,
					face: face.current,
					jersey: brandedTeam.jersey,
					wrapper: faceWrapper,
				});
			}
		};

		renderFace();
	}, [faceWrapper, brandedTeam]);

	const logoStyle: CSSProperties = {};
	if (brandedTeam.imgURL) {
		logoStyle.display = "inline";
		logoStyle.backgroundImage = `url('${brandedTeam.imgURL}')`;
	}

	return (
		<div>
			<h3 className="position-relative" style={{ zIndex: 1 }}>
				{selectedTeam.region} {brandedTeam.name} ({selectedTeam.abbrev})
			</h3>
			<div className="d-flex">
				<div className="team-picture" style={logoStyle} />
				<div
					className="mx-2"
					ref={setFaceWrapper}
					style={{ width: 100, marginTop: -25 }}
				/>
				<JerseyNumber
					number={"35"}
					start={2002}
					end={2004}
					t={{
						colors: brandedTeam.colors,
						name: brandedTeam.name,
						region: selectedTeam.region,
					}}
				/>
			</div>
		</div>
	);
};
