import type { View } from "../../../common/types.ts";
import type { Col } from "../../components/DataTable/index.tsx";

export const TeamsHeaders = ({
	teams,
	userTid,
}: Pick<View<"scheduleEditor">, "teams" | "userTid">) => {
	return (
		<>
			{teams.map((t) => {
				return (
					<th
						key={t.tid}
						className={userTid === t.tid ? "table-info" : undefined}
						title={`${t.seasonAttrs.region} ${t.seasonAttrs.name}`}
					>
						{t.seasonAttrs.abbrev}
					</th>
				);
			})}
		</>
	);
};
