import clsx from "clsx";
import { type ReactNode } from "react";
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

	return [show, hideableSectionButton] as const;
};

const HideableSection = ({
	children,
	className,
	description,
	pageName,
	renderTitle,
	title,
	titleExtraKey,
}: {
	children: ReactNode;
	className?: string;
	description?: ReactNode;

	// Undefind pagename is for backwards compatibility with original usage on player page
	pageName?: string | undefined;
	title: string;
	titleExtraKey?: string | number;

	// Use this to override title for display, including the button. title is still needed for the localStorage key
	renderTitle?: (show: boolean, hideableSectionButton: ReactNode) => ReactNode;
}) => {
	const [show, hideableSectionButton] = useShowSection(
		pageName,
		title,
		titleExtraKey,
	);

	// z-index of 1 ensures that it is still clickable when used with datatable-negative-margin-top
	return (
		<>
			<div
				className={clsx(
					"d-flex align-items-center flex-wrap gap-2 row-gap-0",
					className,
					show ? "mb-2" : "mb-3",
				)}
			>
				{renderTitle ? (
					renderTitle(show, hideableSectionButton)
				) : (
					<div className="d-flex z-1" style={{ minWidth: 0 }}>
						<h2 className="mb-0 text-truncate">{title}</h2>
						{hideableSectionButton}
					</div>
				)}
				{show ? <div className="text-nowrap">{description}</div> : null}
			</div>
			{show ? children : null}
		</>
	);
};

export default HideableSection;
