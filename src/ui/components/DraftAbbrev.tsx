import type { LocalStateUI } from "../../common/types.ts";
import { helpers, useLocal } from "../util/index.ts";
import TeamLogoInline from "./TeamLogoInline.tsx";

type TeamOverride = {
	abbrev: string;
	imgURL?: string;
	imgURLSmall?: string;
};

// Supply t and originalT if you want historical abbrevs/logos to be accurate, otherwise current values will be used.
type Props = {
	originalT?: TeamOverride;
	originalTid: number;
	t?: TeamOverride;
	tid: number;
	season?: number;
	showLogos?: boolean;
};

// Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.
const DraftAbbrev = ({
	originalT: originalTInput,
	originalTid,
	t: tInput,
	tid,
	season,
	showLogos,
}: Props) => {
	const teamInfoCache = useLocal((state) => state.teamInfoCache);

	const t = tInput ?? teamInfoCache[tid];
	const originalT = originalTInput ?? teamInfoCache[originalTid];

	if (!t || !originalT) {
		// Happens for players like undrafted on the draft history page, tid is <0
		return;
	}

	const abbrev = t.abbrev;
	const originalAbbrev = originalT.abbrev;

	const args1 =
		season === undefined
			? ["roster", `${abbrev}_${tid}`]
			: ["roster", `${abbrev}_${tid}`, season];

	const args2 =
		season === undefined
			? ["roster", `${originalAbbrev}_${originalTid}`]
			: ["roster", `${originalAbbrev}_${originalTid}`, season];

	return (
		<div className="d-flex align-items-center gap-1">
			{showLogos ? (
				<TeamLogoInline imgURL={t.imgURL} imgURLSmall={t.imgURLSmall} />
			) : null}
			<div>
				<a href={helpers.leagueUrl(args1)}>{abbrev}</a>
				{tid !== originalTid ? (
					<>
						{" "}
						from <a href={helpers.leagueUrl(args2)}>{originalAbbrev}</a>
					</>
				) : null}
			</div>
			{showLogos && tid !== originalTid ? (
				<TeamLogoInline
					imgURL={originalT.imgURL}
					imgURLSmall={originalT.imgURLSmall}
				/>
			) : null}
		</div>
	);
};

export const wrappedDraftAbbrev = (
	props: Props,
	teamInfoCache: LocalStateUI["teamInfoCache"],
) => {
	const { tid, originalTid } = props;

	const searchSortValue = `${teamInfoCache[tid]?.abbrev} ${
		teamInfoCache[originalTid]?.abbrev
	}`;

	return {
		searchValue: searchSortValue,
		sortValue: searchSortValue,
		value: <DraftAbbrev {...props} />,
	};
};

export default DraftAbbrev;
