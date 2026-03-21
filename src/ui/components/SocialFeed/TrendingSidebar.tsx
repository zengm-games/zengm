import type { SocialEvent, SocialTeam } from "./types.ts";
import { SearchIcon } from "./Icons.tsx";

const styles = {
	container: {
		display: "flex",
		flexDirection: "column" as const,
		gap: 16,
		padding: 16,
	} as React.CSSProperties,
	searchBox: {
		position: "relative" as const,
	} as React.CSSProperties,
	searchIcon: {
		position: "absolute" as const,
		left: 16,
		top: "50%",
		transform: "translateY(-50%)",
		color: "var(--bs-secondary-color)",
	} as React.CSSProperties,
	searchInput: {
		width: "100%",
		backgroundColor: "var(--bs-tertiary-bg)",
		border: "1px solid var(--bs-border-color)",
		borderRadius: 20,
		padding: "12px 16px 12px 48px",
		color: "var(--bs-body-color)",
		fontSize: 14,
		outline: "none",
	} as React.CSSProperties,
	card: {
		backgroundColor: "var(--bs-secondary-bg)",
		borderRadius: 16,
		overflow: "hidden",
	} as React.CSSProperties,
	cardTitle: {
		fontSize: 20,
		fontWeight: 700,
		color: "var(--bs-body-color)",
		padding: "12px 16px",
		margin: 0,
	} as React.CSSProperties,
	item: {
		display: "block",
		width: "100%",
		textAlign: "left" as const,
		padding: "12px 16px",
		background: "none",
		border: "none",
		cursor: "default",
		color: "var(--bs-body-color)",
	} as React.CSSProperties,
	label: {
		fontSize: 12,
		color: "var(--bs-secondary-color)",
	} as React.CSSProperties,
	value: {
		fontWeight: 700,
		color: "var(--bs-body-color)",
		margin: "2px 0",
	} as React.CSSProperties,
	sub: {
		fontSize: 13,
		color: "var(--bs-secondary-color)",
	} as React.CSSProperties,
	teamRow: {
		display: "flex",
		alignItems: "center",
		gap: 12,
		padding: "10px 16px",
	} as React.CSSProperties,
	teamLogo: {
		width: 32,
		height: 32,
		borderRadius: "50%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontWeight: 700,
		fontSize: 12,
		color: "var(--bs-body-color)",
		flexShrink: 0,
	} as React.CSSProperties,
	teamName: {
		flex: 1,
		fontWeight: 600,
		color: "var(--bs-body-color)",
		fontSize: 14,
	} as React.CSSProperties,
	teamStat: {
		fontSize: 13,
		color: "var(--bs-secondary-color)",
	} as React.CSSProperties,
	footer: {
		fontSize: 12,
		color: "var(--bs-secondary-color)",
		padding: "0 16px",
		display: "flex",
		flexWrap: "wrap" as const,
		gap: 8,
	} as React.CSSProperties,
};

interface TrendingSidebarProps {
	events: SocialEvent[];
	teams: SocialTeam[];
	userTid: number;
}

const TrendingSidebar = ({ events, teams, userTid }: TrendingSidebarProps) => {
	// Compute trending event types
	const typeCounts: Record<string, number> = {};
	for (const e of events) {
		typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1;
	}
	const trending = Object.entries(typeCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	const typeLabels: Record<string, string> = {
		trade: "Trades",
		freeAgent: "Free Agency",
		draft: "Draft Picks",
		injury: "Injuries",
		reSigned: "Re-signings",
		release: "Releases",
		playoffs: "Playoffs",
		wonTitle: "Championships",
		playerFeat: "Player Feats",
		hallOfFame: "Hall of Fame",
		award: "Awards",
	};

	// Teams most active in events
	const teamEventCounts: Record<number, number> = {};
	for (const e of events) {
		if (e.tids) {
			for (const tid of e.tids) {
				if (tid >= 0) {
					teamEventCounts[tid] = (teamEventCounts[tid] ?? 0) + 1;
				}
			}
		}
	}
	const activeTeams = Object.entries(teamEventCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	return (
		<div style={styles.container}>
			<div style={styles.searchBox}>
				<span style={styles.searchIcon}>
					<SearchIcon size={18} />
				</span>
				<input
					type="text"
					placeholder="Search events..."
					style={styles.searchInput}
					readOnly
				/>
			</div>

			{trending.length > 0 && (
				<div style={styles.card}>
					<h3 style={styles.cardTitle}>Trending</h3>
					{trending.map(([type, count], i) => (
						<div key={type} style={styles.item}>
							<div style={styles.label}>{i + 1} &middot; Activity</div>
							<div style={styles.value}>{typeLabels[type] ?? type}</div>
							<div style={styles.sub}>{count} events</div>
						</div>
					))}
				</div>
			)}

			{activeTeams.length > 0 && (
				<div style={styles.card}>
					<h3 style={styles.cardTitle}>Most Active Teams</h3>
					{activeTeams.map(([tidStr, count]) => {
						const tid = Number(tidStr);
						const team = teams[tid];
						if (!team) {
							return null;
						}
						const isUser = tid === userTid;
						return (
							<div key={tid} style={styles.teamRow}>
								<div
									style={{
										...styles.teamLogo,
										backgroundColor: team.colors?.[0] ?? "#333",
									}}
								>
									{team.imgURLSmall ? (
										<img
											src={team.imgURLSmall}
											alt={team.abbrev}
											style={{
												width: "100%",
												height: "100%",
												objectFit: "contain",
											}}
										/>
									) : (
										team.abbrev
									)}
								</div>
								<span style={styles.teamName}>
									{team.region} {team.name}
									{isUser ? " (You)" : ""}
								</span>
								<span style={styles.teamStat}>{count} events</span>
							</div>
						);
					})}
				</div>
			)}

			<div style={styles.footer}>
				<span>&copy; GGM Basketball</span>
			</div>
		</div>
	);
};

export default TrendingSidebar;
