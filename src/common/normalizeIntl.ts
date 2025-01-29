// https://stackoverflow.com/a/37511463/786644
export const normalizeIntl = (str: string) =>
	str
		.normalize("NFD")
		.replaceAll(/\p{Diacritic}/gu, "")
		.toLowerCase();
