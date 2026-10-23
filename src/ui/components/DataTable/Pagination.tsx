import clsx from "clsx";
import type { ReactNode } from "react";

const Pagination = ({
	currentPage,
	numRows,
	onClick,
	perPage,
}: {
	currentPage: number;
	numRows: number;
	onClick: (a: number) => void;
	perPage: number;
}) => {
	const showPrev = currentPage > 1;
	const showNext = numRows > currentPage * perPage;
	const numPages = Math.ceil(numRows / perPage);
	let firstShownPage = currentPage <= 3 ? 1 : currentPage - 2;

	while (firstShownPage > 1 && numPages - firstShownPage < 4) {
		firstShownPage -= 1;
	}

	let lastShownPage = firstShownPage + 4;

	if (lastShownPage > numPages) {
		lastShownPage = numPages;
	}

	const numberedPages: ReactNode[] = [];

	for (let i = firstShownPage; i <= lastShownPage; i++) {
		numberedPages.push(
			<li
				key={i}
				className={clsx("page-item", i === currentPage ? "active" : null)}
			>
				{i === currentPage ? (
					<span className="page-link user-select-none" aria-current="page">
						{i}
					</span>
				) : (
					<button
						type="button"
						className="page-link user-select-none"
						onClick={() => onClick(i)}
					>
						{i}
					</button>
				)}
			</li>,
		);
	}

	return (
		<ul className="pagination mb-0 ms-auto">
			<li
				className={clsx("page-item", {
					disabled: !showPrev,
				})}
			>
				<button
					type="button"
					className="page-link user-select-none"
					disabled={!showPrev}
					onClick={() => onClick(currentPage - 1)}
				>
					← Prev
				</button>
			</li>
			{numberedPages}
			<li
				className={clsx("page-item", {
					disabled: !showNext,
				})}
			>
				<button
					type="button"
					className="page-link user-select-none"
					disabled={!showNext}
					onClick={() => onClick(currentPage + 1)}
				>
					Next →
				</button>
			</li>
		</ul>
	);
};

export default Pagination;
