let listFormatter: Intl.ListFormat | undefined;

// Safari 16 - and can remove condition below on listFormatter existence
if (!listFormatter && Intl.ListFormat) {
	listFormatter = new Intl.ListFormat("en");
}

export const formatList = (list: string[]) => {
	if (listFormatter) {
		return listFormatter.format(list);
	} else {
		switch (list.length) {
			case 0:
				return "";
			case 1:
				return list[0];
			case 2:
				return `${list[0]} and ${list[1]}`;
			default:
				return `${list.slice(0, -1).join(", ")}, and ${list.at(-1)}`;
		}
	}
};
