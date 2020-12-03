import React, { createRef } from "react";
import Select from "react-select";

class SelectReact extends React.Component<
	{
		player: any;
		options: any[];
		changing: any;
		teamNumber?: number;
		playerNumber?: number;
		award: string;
	},
	{ select: { value: any; options: any[] }; ref: any }
> {
	constructor(props: any) {
		super(props);

		const options = props["options"];
		const player = props["player"];
		this.state = {
			select: {
				value: player, // "One" as initial value for react-select
				options, // all available options
			},
			ref: createRef(),
		};
	}

	setValue = (value: any) => {
		this.setState(prevState => ({
			select: {
				...prevState.select,
				value,
			},
		}));
	};

	handleChange = (value: any) => {
		const val = this.props.changing(this, value);
		if (!val) {
			this.setValue(value);
		} else {
			this.setValue(this.state.select.value);
			this.state.ref.forceUpdate();
		}
	};

	render() {
		const { select, ref } = this.state;
		return (
			<Select
				classNamePrefix="dark-select"
				defaultValue={select.value}
				label="Single select"
				onChange={this.handleChange}
				options={select.options}
				getOptionValue={option => option["pid"]}
				getOptionLabel={option => option["name"]}
				ref={ref}
			/>
		);
	}
}

export default SelectReact;
