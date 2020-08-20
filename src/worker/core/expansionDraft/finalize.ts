import { draft, league } from "..";

const finalize = async () => {
	await league.setGameAttributes({
		expansionDraft: {
			phase: "setup",
		},
	});

	await draft.deleteLotteryResultIfNoDraftYet();
};

export default finalize;
