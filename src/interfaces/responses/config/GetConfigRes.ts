import CurrencyRow from '@/interfaces/common/CurrencyRow';

interface GetConfigResData {
	currencies: CurrencyRow[];
}

interface GetConfigRes {
	success: true;
	data: {
		currencies: CurrencyRow[];
	};
}

export default GetConfigRes;

export type { GetConfigResData };
