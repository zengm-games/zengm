export default class FilterItem<FilterData> {
	filterData: FilterData; //filter items selected, ex for Pos: C, PF...
	filterFunction: string; //function that will decide if the offer qualifies given list of players
	customUpdate: ((data: any) => any) | undefined; //used if you want to transform filter options before setting it

	constructor(
		filterData: any,
		filterFunction: string,
		updateItems?: ((data: any) => any) | undefined,
	) {
		this.filterData = filterData;
		this.filterFunction = filterFunction;
		this.customUpdate = updateItems;
	}

	update(data: any): void {
		this.filterData = this.customUpdate ? this.customUpdate(data) : data;
	}
}
