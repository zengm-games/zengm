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

const TeamLogoAndName = ({
	t,
	url,
	noLogo,
}: {
	t: Team;
	url: string;
	noLogo?: boolean;
}) => {
	return (
		<div className="d-flex align-items-center">
			{!noLogo ? (
				<TeamLogoInline
					imgURL={t.seasonAttrs.imgURL}
					imgURLSmall={t.seasonAttrs.imgURLSmall}
				/>
			) : null}
			<div className={noLogo ? undefined : "ms-1"}>
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
	searchValue: `${t.seasonAttrs.region} ${t.seasonAttrs.name} ${t.seasonAttrs.abbrev}`,
	sortValue: `${t.seasonAttrs.region} ${t.seasonAttrs.name} ${t.seasonAttrs.abbrev}`,
});

export default TeamLogoAndName;
