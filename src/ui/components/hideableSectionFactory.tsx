import type { ReactNode } from "react";
import useLocalStorageState from "use-local-storage-state";

// Undefind pagename is for backwards compatibility with original usage on player page
const hideableSectionFactory =
	(pageName: string | undefined) =>
	({ children, title }: { children: ReactNode; title: string }) => {
		const key =
			pageName === undefined ? `show-${title}` : `show-${pageName}-${title}`;

		const [show, setShow] = useLocalStorageState(key, {
			defaultValue: true,
		});

		return (
			<>
				<div className={`d-flex ${show ? "mb-2" : "mb-3"}`}>
					<h2 className="mb-0">{title}</h2>
					<button
						className="btn btn-light-bordered btn-xs ms-2"
						onClick={() => {
							setShow(!show);
						}}
					>
						{show ? "Hide" : "Show"}
					</button>
				</div>
				{show ? children : null}
			</>
		);
	};

export default hideableSectionFactory;
