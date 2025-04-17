import { type CSSProperties, useState, useLayoutEffect } from "react";
import JerseyNumber from "./JerseyNumber.tsx";
import { toWorker } from "../util/index.ts";
import type { FaceConfig } from "facesjs";
import { MyFace } from "./MyFace.tsx";

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
	const [face, setFace] = useState<FaceConfig | undefined>();

	useLayoutEffect(() => {
		(async () => {
			setFace(await toWorker("main", "generateFace", undefined));
		})();
	}, []);

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
				<div className="mx-2" style={{ width: 100, marginTop: -25 }}>
					{face ? (
						<MyFace
							colors={brandedTeam.colors}
							face={face}
							jersey={brandedTeam.jersey}
						/>
					) : null}
				</div>
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
