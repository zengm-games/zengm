import SocialFeedApp from "../components/SocialFeed/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";

const SocialFeed = (props: any) => {
	useTitleBar({ title: "Social" });

	return (
		<SocialFeedApp
			events={props.events}
			messages={props.messages}
			season={props.season}
			teams={props.teams}
			userTid={props.userTid}
		/>
	);
};

export default SocialFeed;
