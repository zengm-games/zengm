import { useEffect } from "react";
import router from "../router/index.ts";

const AgentSocial = () => {
	useEffect(() => {
		const lid = window.location.pathname.match(/\/l\/(\d+)/)?.[1];
		if (lid) {
			void router.navigate(`/l/${lid}/social_feed`);
		}
	}, []);
	return null;
};

export default AgentSocial;
