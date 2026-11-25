import Decimal from 'decimal.js';
import ApplyTip from '@/interfaces/common/ApplyTip';
import { zanoWallet } from '@/utils/zanoWallet';

interface PairAssetIds {
	baseAssetId: string;
	quoteAssetId: string;
}

interface ProposalTransfer {
	amount: string | number;
	asset_id: string;
}

const validationCache = new Map<string, Promise<boolean>>();

const sumByAsset = (transfers: ProposalTransfer[], assetId: string) =>
	transfers
		.filter((transfer) => transfer.asset_id === assetId)
		.reduce((sum, transfer) => sum.plus(new Decimal(transfer.amount)), new Decimal(0));

async function checkSwapProposal(
	tip: ApplyTip,
	{ baseAssetId, quoteAssetId }: PairAssetIds,
): Promise<boolean | null> {
	const amounts = tip.to_be_traded;
	if (!tip.hex_raw_proposal || !amounts) return false;

	const info = await zanoWallet.getIonicSwapProposalInfo(tip.hex_raw_proposal).catch(() => null);
	if (!info?.success) return null;

	const { to_finalizer: toFinalizer, to_initiator: toInitiator } = info.data.proposal;
	const isBuyer = tip.type === 'sell';

	const receiveAssetId = isBuyer ? baseAssetId : quoteAssetId;
	const giveAssetId = isBuyer ? quoteAssetId : baseAssetId;
	const receiveAmount = isBuyer ? amounts.baseAmountInAtomics : amounts.quoteAmountInAtomics;
	const giveAmount = isBuyer ? amounts.quoteAmountInAtomics : amounts.baseAmountInAtomics;

	try {
		const givesOnlyExpectedAsset = toInitiator.every(
			(transfer) => transfer.asset_id === giveAssetId,
		);

		return (
			givesOnlyExpectedAsset &&
			sumByAsset(toFinalizer, receiveAssetId).gte(receiveAmount) &&
			sumByAsset(toInitiator, giveAssetId).lte(giveAmount)
		);
	} catch {
		return false;
	}
}

export function isSwapProposalValid(tip: ApplyTip, assetIds: PairAssetIds): Promise<boolean> {
	const key = `${tip.id}:${assetIds.baseAssetId}:${assetIds.quoteAssetId}`;
	const cached = validationCache.get(key);
	if (cached) return cached;

	const result = checkSwapProposal(tip, assetIds).then((isValid) => {
		if (isValid === null) validationCache.delete(key);
		return isValid === true;
	});

	validationCache.set(key, result);
	return result;
}

export async function filterValidSwapProposals(
	tips: ApplyTip[],
	assetIds: PairAssetIds | null,
): Promise<ApplyTip[]> {
	const checks = await Promise.all(
		tips.map((tip) => {
			if (!tip.transaction) return true;
			if (!assetIds) return false;
			return isSwapProposalValid(tip, assetIds);
		}),
	);

	return tips.filter((_, index) => checks[index]);
}
