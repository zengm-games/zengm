const shouldUseAgeAtDeath = (age: number, ageAtDeath: number | null) =>
	ageAtDeath !== null && age >= ageAtDeath;

const AgeAtDeath = ({
	age,
	ageAtDeath,
}: {
	age: number;
	ageAtDeath: number | null;
}) => {
	if (shouldUseAgeAtDeath(age, ageAtDeath)) {
		return <span title={`Died at age ${ageAtDeath}`}>{ageAtDeath}*</span>;
	}

	return age;
};

export default AgeAtDeath;

export const wrappedAgeAtDeath = (age: number, ageAtDeath: number | null) => {
	const searchSortValue = shouldUseAgeAtDeath(age, ageAtDeath)
		? ageAtDeath
		: age;

	return {
		// @ts-ignore
		value: <AgeAtDeath age={age} ageAtDeath={ageAtDeath} />,
		sortValue: searchSortValue,
		searchValue: searchSortValue,
	};
};
