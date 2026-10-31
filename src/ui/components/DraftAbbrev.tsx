import type { LocalStateUI } from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";
import { TeamLogoInline } from "./TeamLogoInline.tsx";

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
export const DraftAbbrev = ({
	originalT: originalTInput,
	originalTid,
	t: tInput,
	tid,
	season,
	showLogos,
}: Props) => {
	const { teamInfoCache } = useLocal(["teamInfoCache"]);

	const t = tInput ?? teamInfoCache[tid];
	const originalT = originalTInput ?? teamInfoCache[originalTid];

	if (!t || !originalT) {
		// Happens for players like undrafted on the draft history page, tid is <0
		return;
	}

	const abbrev = t.abbrev;
	const originalAbbrev = originalT.abbrev;

	return (
		<div className="d-flex align-items-center gap-1">
			{showLogos ? (
				<TeamLogoInline imgURL={t.imgURL} imgURLSmall={t.imgURLSmall} />
			) : null}
			<div>
				<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`, season])}>
					{abbrev}
				</a>
				{tid !== originalTid ? (
					<>
						{" "}
						from{" "}
						<a
							href={helpers.leagueUrl([
								"roster",
								`${originalAbbrev}_${originalTid}`,
								season,
							])}
						>
							{originalAbbrev}
						</a>
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
