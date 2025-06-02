import { Dispatch } from 'react';
import { GetUserResData } from '../responses/user/GetUserRes';
import { GetConfigResData } from '../responses/config/GetConfigRes';

export interface Asset {
    name: string;
    ticker: string;
    assetId: string;
    decimalPoint: number;
    balance: string;
    unlockedBalance: string;
}

export interface Transfer {
    amount: string;
    assetId: string;
    incoming: boolean;
}

export interface Transaction {
    isConfirmed: boolean;
    txHash: string;
    blobSize: number;
    timestamp: number;
    height: number;
    paymentId: string;
    comment: string;
    fee: string;
    isInitiator: boolean;
    transfers: Transfer[];
}

interface WalletState {
    address: string;
    alias: string;
    balance: string;
    assets: Asset[];
    transactions: Transaction[];
	connected: boolean
}

type UserState = GetUserResData | null;

interface ContextState {
	wallet: WalletState | null;
	user: UserState;
	config: GetConfigResData | null;
	assetsRates: Map<string, number>;
	__triggers: {
		offers: number;
	};
	closed_notifications: number[];
}

type ContextAction =
	| {
			type: 'WALLET_UPDATED';
			payload: WalletState | null;
	  }
	| {
			type: 'USER_UPDATED';
			payload: UserState;
	  }
	| {
			type: 'CONFIG_UPDATED';
			payload: GetConfigResData | null;
	  }
	| {
			type: 'TRIGGER_OFFERS_UPDATE';
	  }
	| {
			type: 'ASSETS_RATE_UPDATED';
			payload: Map<string, number>;
	  }
	| {
			type: 'CLOSED_NOTIFICATIONS_UPDATED';
			payload: number[];
	  };	

interface ContextValue {
	state: ContextState;
	dispatch: Dispatch<ContextAction>;
}

export default ContextValue;

export type { ContextState, ContextAction, WalletState, UserState };
