import { memo } from "react";
import { GAME_NAME } from "../../common/constants.ts";
import LogoSpinner from "./LogoSpinner.tsx";
import { useLocal } from "../util/local.ts";

type Props = {
	gold?: boolean;
	inLeague?: boolean;
	updating: boolean;
};
const LogoAndText = memo(({ gold, inLeague, updating }: Props) => {
	// workerBusy covers game sims, phase changes, the draft, auto play, etc.
	const { workerBusy } = useLocal(["workerBusy"]);
	const spinning = updating || workerBusy;

	return (
		<a
			className={
				inLeague
					? "navbar-brand text-body-secondary d-none d-md-inline ms-md-2 ms-lg-0"
					: "navbar-brand text-body-secondary"
			}
			href="/"
		>
			<LogoSpinner gold={gold} size={18} spinning={spinning} />

			<span className={inLeague ? "d-none d-lg-inline" : undefined}>
				{GAME_NAME}
			</span>
		</a>
	);
});

export default LogoAndText;
