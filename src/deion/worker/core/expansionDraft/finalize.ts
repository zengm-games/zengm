import { league } from "..";

const finalize = async () => {
	await league.setGameAttributes({
		expansionDraft: {
			phase: "setup",
		},
	});
};

export default finalize;
