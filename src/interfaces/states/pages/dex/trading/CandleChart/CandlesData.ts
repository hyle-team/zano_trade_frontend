interface CandlesData {
	start: number;
	body: {
		blockFirst?: number;
		blockSecond?: number;
		lineFirst?: number;
		lineSecond?: number;
	}[];
}

export default CandlesData;
