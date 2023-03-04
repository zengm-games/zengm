import classNames from "classnames";
import type { ReactNode } from "react";
import useLocalStorageState from "use-local-storage-state";

const HideableSectionButton = ({
	show,
	setShow,
}: {
	show: boolean;
	setShow: (show: boolean) => void;
}) => (
	<button
		className="btn btn-light-bordered btn-xs ms-2"
		onClick={() => {
			setShow(!show);
		}}
	>
		{show ? "Hide" : "Show"}
	</button>
);

const useShowSection = (
	pageName: string | undefined,
	title: string,
	titleExtraKey?: string | number,
) => {
	let key =
		pageName === undefined ? `show-${title}` : `show-${pageName}-${title}`;
	if (titleExtraKey !== undefined) {
		key += `-${titleExtraKey}`;
	}

	const [show, setShow] = useLocalStorageState(key, {
		defaultValue: true,
	});

	const hideableSectionButton = (
		<HideableSectionButton show={show} setShow={setShow} />
	);

	return [show, hideableSectionButton];
};

// Undefind pagename is for backwards compatibility with original usage on player page
const hideableSectionFactory =
	(pageName: string | undefined) =>
	({
		children,
		className,
		description,
		title,
		titleExtraKey,
	}: {
		children: ReactNode;
		className?: string;
		description?: ReactNode;
		title: string;
		titleExtraKey?: string | number;
	}) => {
		const [show, hideableSectionButton] = useShowSection(
			pageName,
			title,
			titleExtraKey,
		);

		return (
			<>
				<div
					className={classNames(
						"d-flex align-items-center flex-wrap gap-2 row-gap-0",
						className,
						show ? "mb-2" : "mb-3",
					)}
				>
					<div className="d-flex" style={{ minWidth: 0 }}>
						<h2
							className="mb-0 text-nowrap"
							style={{ overflow: "hidden", textOverflow: "ellipsis" }}
						>
							{title}
						</h2>
						{hideableSectionButton}
					</div>
					{show ? <div className="text-nowrap">{description}</div> : null}
				</div>
				{show ? children : null}
			</>
		);
	};

export default hideableSectionFactory;
