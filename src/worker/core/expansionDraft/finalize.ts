import { draft, league } from "../index.ts";

const finalize = async () => {
	await league.setGameAttributes({
		expansionDraft: {
			phase: "setup",
		},
	});

	await draft.deleteLotteryResultIfNoDraftYet();
};

export default finalize;
