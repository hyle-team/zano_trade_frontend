export type V2Side = 'BUY' | 'SELL';
export type V2OrderStatus = 'ACTIVE' | 'FINISHED';
export type V2SwapProposalStatus = 'PENDING' | 'REJECTED' | 'ACCEPTED';

export type V2Error = {
	code: string;
	details?: unknown;
};

export type V2Response<T> = { success: true; result: T } | { success: false; error: V2Error };

export type V2Asset = {
	assetId: string;
	ticker: string;
	fullName: string;
	decimalPoint: number;
	totalMaxSupply: string;
	currentSupply: string;
	isWhitelisted: boolean;
};

export type V2PairStats = {
	lastPrice: string | null;
	change24h: string | null;
	change24hPercent: string | null;
	high24h: string | null;
	low24h: string | null;
	volume24h: string;
	lastPriceInAtomics: string | null;
	change24hInAtomics: string | null;
	high24hInAtomics: string | null;
	low24hInAtomics: string | null;
	volume24hInAtomics: string;
};

export type V2Pair = {
	id: string;
	baseAsset: V2Asset;
	quoteAsset: V2Asset;
	stats: V2PairStats;
};

export type V2PairsPage = {
	pairs: V2Pair[];
	nextCursor: string | null;
};

export type V2PairByAssets = {
	id: string;
	stats: V2PairStats;
};

export type V2User = {
	id: string;
	address: string;
	alias: string;
};

export type V2Order = {
	id: string;
	userId: string;
	pairId: string;
	amount: string;
	left: string;
	price: string;
	side: V2Side;
	status: V2OrderStatus;
	minPerApplyAmount: string | null;
	maxPerApplyAmount: string | null;
	createdAt: string;
	amountInAtomics: string;
	leftInAtomics: string;
	priceInAtomics: string;
	minPerApplyAmountInAtomics: string | null;
	maxPerApplyAmountInAtomics: string | null;
};

export type V2PublicOrder = V2Order & { user: V2User };

export type V2MyPairOrder = V2Order & {
	matchesCount: number;
	outgoingPendingProposalsCount: number;
	incomingPendingProposalsCount: number;
	unseenMatchesCount: number;
	unseenOutgoingPendingProposalsCount: number;
	unseenIncomingPendingProposalsCount: number;
};

export type V2ToBeTraded = {
	baseAmount: string;
	quoteAmount: string;
	price: string;
	baseAmountInAtomics: string;
	quoteAmountInAtomics: string;
	priceInAtomics: string;
};

export type V2MatchOrder = V2PublicOrder & { toBeTraded: V2ToBeTraded };

export type V2OrdersPage<T> = {
	orders: T[];
	nextCursor: string | null;
};

export type V2SwapProposalBase = {
	id: string;
	initiatorOrderId: string;
	counterpartyOrderId: string;
	status: V2SwapProposalStatus;
	createdAt: string;
	baseAmount: string;
	quoteAmount: string;
	price: string;
	baseAmountInAtomics: string;
	quoteAmountInAtomics: string;
	priceInAtomics: string;
};

export type V2IncomingProposal = V2SwapProposalBase & {
	initiatorOrderUser: V2User;
	hexRawProposal: string;
};

export type V2OutgoingProposal = V2SwapProposalBase & {
	counterpartyOrderUser: V2User;
};

export type V2ProposalsPage<T> = {
	swapProposals: T[];
	nextCursor: string | null;
};

export type V2Candle = {
	high: string;
	low: string;
	start: string;
	end: string;
	startedAt: string;
	endedAt: string;
};

export type V2CandleMode = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export type V2NewOrderMatchEvent = V2Order & { matchingOrderId: string };

export type V2TradePerformedEvent = {
	id: string;
	pairId: string;
	acceptedAt: string;
	baseAmount: string;
	quoteAmount: string;
	price: string;
	baseAmountInAtomics: string;
	quoteAmountInAtomics: string;
	priceInAtomics: string;
};

export type V2CancelOrderEvent = {
	id: string;
	pairId: string;
};

export type V2PairEvent = {
	pairId: string;
};
