import { useState, useEffect } from "react";
import SocialFeedApp from "../components/SocialFeed/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getPosts } from "../db/socialFeedDb.ts";
import { addFeedEventListener } from "../util/feedEventHandler.ts";
import type { SocialEvent } from "../components/SocialFeed/types.ts";

const SocialFeed = (props: any) => {
	useTitleBar({ title: "Social" });

	const [aiPosts, setAiPosts] = useState<SocialEvent[]>([]);

	useEffect(() => {
		const load = async () => {
			const posts = await getPosts(50);
			const mapped: SocialEvent[] = posts.map((p, i) => ({
				eid: i,
				type: "playerFeat" as any,
				text: p.body,
				authorName: p.handle,
				authorTeamAbbrev: p.handle,
				season: props.season ?? 0,
			}));
			setAiPosts(mapped);
		};

		load();

		const unsubscribe = addFeedEventListener(() => {
			load();
		});

		return () => {
			unsubscribe();
		};
	}, [props.season]);

	return (
		<SocialFeedApp
			events={[...aiPosts, ...(props.events ?? [])]}
			messages={props.messages}
			season={props.season}
			teams={props.teams}
			userTid={props.userTid}
		/>
	);
};

export default SocialFeed;
