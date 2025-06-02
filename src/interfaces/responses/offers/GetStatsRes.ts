interface Stats {
	opened: number;
	volume_24: number;
	volume_7: number;
	volume_30: number;
}

interface GetStatsRes {
	success: true;
	data: Stats;
}

export default GetStatsRes;

export { type Stats };
