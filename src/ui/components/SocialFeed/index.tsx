import { useState } from "react";
import type { SocialEvent, SocialTeam, SocialMessage } from "./types.ts";
import EventCard from "./EventCard.tsx";
import MessagesPanel from "./MessagesPanel.tsx";
import TrendingSidebar from "./TrendingSidebar.tsx";
import { HomeIcon, BellIcon } from "./Icons.tsx";

type Tab = "home" | "messages";

const styles = {
	wrapper: {
		display: "flex",
		justifyContent: "center",
		minHeight: "80vh",
		backgroundColor: "#000",
		color: "#e7e9ea",
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	} as React.CSSProperties,
	sidebar: {
		width: 200,
		flexShrink: 0,
		borderRight: "1px solid #2f3336",
		display: "flex",
		flexDirection: "column" as const,
		padding: "16px 12px",
		gap: 8,
		position: "sticky" as const,
		top: 0,
		height: "fit-content",
	} as React.CSSProperties,
	logo: {
		width: 40,
		height: 40,
		borderRadius: "50%",
		backgroundColor: "#d35400",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: "#fff",
		fontWeight: 700,
		fontSize: 18,
		marginBottom: 16,
		flexShrink: 0,
	} as React.CSSProperties,
	navBtn: {
		display: "flex",
		alignItems: "center",
		gap: 16,
		padding: "12px 16px",
		borderRadius: 24,
		border: "none",
		background: "none",
		color: "#e7e9ea",
		cursor: "pointer",
		fontSize: 18,
		transition: "background-color 0.15s",
		width: "100%",
		position: "relative" as const,
	} as React.CSSProperties,
	navBtnActive: {
		fontWeight: 700,
	} as React.CSSProperties,
	badge: {
		position: "absolute" as const,
		top: 6,
		left: 28,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: "#d35400",
		color: "#fff",
		fontSize: 11,
		fontWeight: 700,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "0 4px",
	} as React.CSSProperties,
	main: {
		flex: 1,
		maxWidth: 600,
		borderRight: "1px solid #2f3336",
		minHeight: "80vh",
	} as React.CSSProperties,
	mainHeader: {
		position: "sticky" as const,
		top: 0,
		zIndex: 10,
		backgroundColor: "rgba(0,0,0,0.85)",
		backdropFilter: "blur(12px)",
		borderBottom: "1px solid #2f3336",
		padding: "12px 16px",
	} as React.CSSProperties,
	mainHeaderTitle: {
		fontSize: 20,
		fontWeight: 700,
		margin: 0,
	} as React.CSSProperties,
	rightSidebar: {
		width: 350,
		flexShrink: 0,
		position: "sticky" as const,
		top: 0,
		height: "fit-content",
	} as React.CSSProperties,
	emptyState: {
		padding: 48,
		textAlign: "center" as const,
		color: "#71767b",
		fontSize: 15,
	} as React.CSSProperties,
};

export interface SocialFeedProps {
	events: SocialEvent[];
	messages: SocialMessage[];
	season: number;
	teams: SocialTeam[];
	userTid: number;
}

const SocialFeedApp = ({
	events = [],
	messages = [],
	season = 0,
	teams = [],
	userTid = 0,
}: Partial<SocialFeedProps>) => {
	const [activeTab, setActiveTab] = useState<Tab>("home");
	const unreadMessages = messages.filter((m) => !m.read).length;

	const navItems: {
		id: Tab;
		icon: React.ReactNode;
		label: string;
		badge?: number;
	}[] = [
		{ id: "home", icon: <HomeIcon />, label: "Feed" },
		{
			id: "messages",
			icon: <BellIcon />,
			label: "Inbox",
			badge: unreadMessages,
		},
	];

	return (
		<div style={styles.wrapper}>
			{/* Left sidebar nav */}
			<div style={styles.sidebar}>
				<div style={styles.logo}>G</div>
				{navItems.map((item) => (
					<button
						key={item.id}
						onClick={() => setActiveTab(item.id)}
						style={{
							...styles.navBtn,
							...(activeTab === item.id ? styles.navBtnActive : {}),
						}}
						onMouseOver={(e) => {
							(e.currentTarget as HTMLButtonElement).style.backgroundColor =
								"rgba(231,233,234,0.1)";
						}}
						onMouseOut={(e) => {
							(e.currentTarget as HTMLButtonElement).style.backgroundColor =
								"transparent";
						}}
					>
						<span style={{ position: "relative" }}>
							{item.icon}
							{item.badge !== undefined && item.badge > 0 && (
								<span style={styles.badge}>
									{item.badge > 99 ? "99+" : item.badge}
								</span>
							)}
						</span>
						<span>{item.label}</span>
					</button>
				))}
			</div>

			{/* Main content */}
			<div style={styles.main}>
				<div style={styles.mainHeader}>
					<h1 style={styles.mainHeaderTitle}>
						{activeTab === "home" ? `Season ${season} Feed` : "Inbox"}
					</h1>
				</div>

				{activeTab === "home" && (
					<>
						{events.length === 0 ? (
							<div style={styles.emptyState}>
								No events yet this season. Simulate some games!
							</div>
						) : (
							events.map((event) => (
								<EventCard key={event.eid} event={event} teams={teams} />
							))
						)}
					</>
				)}

				{activeTab === "messages" && <MessagesPanel messages={messages} />}
			</div>

			{/* Right sidebar */}
			<div style={styles.rightSidebar}>
				<TrendingSidebar events={events} teams={teams} userTid={userTid} />
			</div>
		</div>
	);
};

export default SocialFeedApp;
