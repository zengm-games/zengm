import { isValidElement } from "react";
// @ts-ignore
import textContent from "react-addons-text-content";

const getSearchVal = (value: any, toLowerCase: boolean = true) => {
	try {
		let val;
		let searchVal;

		// Get the right 'value'.
		if (value != null && value.hasOwnProperty("searchValue")) {
			val = value.searchValue;
		} else if (value != null && value.hasOwnProperty("value")) {
			val = value.value;
		} else {
			val = value;
		}

		if (isValidElement(val)) {
			searchVal = textContent(val);
		} else {
			searchVal = val;
		}

		if (searchVal != null && searchVal.toString) {
			return toLowerCase
				? searchVal.toString().toLowerCase()
				: searchVal.toString();
		}

		return "";
	} catch (err) {
		console.error(`getSearchVal error on value "${String(value)}"`, err);
		return "";
	}
};

export default getSearchVal;
