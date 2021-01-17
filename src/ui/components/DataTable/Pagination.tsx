import classNames from "classnames";
import PropTypes from "prop-types";
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
				className={classNames("page-item", i === currentPage ? "active" : null)}
			>
				{i === currentPage ? (
					<span className="page-link" onClick={() => onClick(i)}>
						{i}
					</span>
				) : (
					<a className="page-link" onClick={() => onClick(i)}>
						{i}
					</a>
				)}
			</li>,
		);
	}

	return (
		<div className="datatable-pagination">
			<ul className="pagination">
				<li
					className={classNames("page-item", {
						disabled: !showPrev,
					})}
				>
					<a
						className="page-link"
						onClick={() => showPrev && onClick(currentPage - 1)}
					>
						← Prev
					</a>
				</li>
				{numberedPages}
				<li
					className={classNames("page-item", {
						disabled: !showNext,
					})}
				>
					<a
						className="page-link"
						onClick={() => showNext && onClick(currentPage + 1)}
					>
						Next →
					</a>
				</li>
			</ul>
		</div>
	);
};

Pagination.propTypes = {
	currentPage: PropTypes.number.isRequired,
	numRows: PropTypes.number.isRequired,
	onClick: PropTypes.func.isRequired,
	perPage: PropTypes.number.isRequired,
};

export default Pagination;
