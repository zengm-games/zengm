import { memo, useEffect, useState } from "react";
import { GAME_NAME } from "../../common/constants.ts";
import LogoSpinner from "./LogoSpinner.tsx";
import { useLocal } from "../util/local.ts";

// Spinner looks janky if it gets turned on/off rapidly
const PAUSE_DELAY_MS = 100;

const useSpinning = (updating: boolean) => {
	// workerBusy covers game sims, phase changes, the draft, auto play, etc.
	const { workerBusy } = useLocal(["workerBusy"]);
	const busy = updating || workerBusy;

	const [spinning, setSpinning] = useState(busy);

	useEffect(() => {
		if (busy) {
			setSpinning(true);
			return;
		}

		const timeoutId = setTimeout(() => {
			setSpinning(false);
		}, PAUSE_DELAY_MS);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [busy]);

	return busy || spinning;
};

type Props = {
	gold?: boolean;
	inLeague?: boolean;
	updating: boolean;
};
const LogoAndText = memo(({ gold, inLeague, updating }: Props) => {
	const spinning = useSpinning(updating);

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
