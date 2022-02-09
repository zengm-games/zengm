import TeamLogoInline from "./TeamLogoInline";

type Team = {
	seasonAttrs: {
		imgURL?: string;
		imgURLSmall?: string;
		abbrev: string;
		name: string;
		region: string;
	};
	tid: number;
};

const TeamLogoAndName = ({ t, url }: { t: Team; url: string }) => {
	console.log(t, url);
	return (
		<div className="d-flex align-items-center">
			<TeamLogoInline
				imgURL={t.seasonAttrs.imgURL}
				imgURLSmall={t.seasonAttrs.imgURLSmall}
			/>
			<div className="ms-1">
				<a href={url}>
					<span className="d-none d-sm-inline">
						{t.seasonAttrs.region} {t.seasonAttrs.name}
					</span>
					<span className="d-sm-none">{t.seasonAttrs.abbrev}</span>
				</a>
			</div>
		</div>
	);
};

export const wrappedTeamLogoAndName = (t: Team, url: string) => ({
	value: <TeamLogoAndName t={t} url={url} />,
	sortValue: `${t.seasonAttrs.region} ${t.seasonAttrs.name} ${t.seasonAttrs.abbrev}`,
});

export default TeamLogoAndName;
