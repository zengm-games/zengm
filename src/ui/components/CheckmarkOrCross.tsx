type Props = { hideCross?: boolean; success: boolean };

export const CheckmarkOrCross = ({ hideCross, success }: Props) => {
	if (success) {
		return <span className="glyphicon glyphicon-ok text-success" />;
	}

	if (!hideCross) {
		return <span className="glyphicon glyphicon-remove text-danger" />;
	}
};

export const wrappedCheckmarkOrCross = ({ hideCross, success }: Props) => {
	return {
		value: <CheckmarkOrCross hideCross={hideCross} success={success} />,
		searchValue: success ? 1 : 0,
		sortValue: success ? 1 : 0,
	};
};
