type Currency = {
	code: string;
	name: string;
	whitelisted?: boolean;
	featured?: boolean;
};

export type Row = {
	id: string;
	assetId: string | undefined | null;
	pair: {
		base: Currency;
		quote: Currency;
	};
	price: number;
	priceUSD: string;
	change: number;
	volume: number;
	volumeUSD: string;
	featured: boolean;
	code: string;
};
