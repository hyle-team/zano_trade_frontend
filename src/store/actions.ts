import { ContextAction, UserState, WalletState } from '@/interfaces/common/ContextValue';
import { GetConfigResData } from '@/interfaces/responses/config/GetConfigRes';
import { Dispatch } from 'react';

export const updateWalletState = (dispatch: Dispatch<ContextAction>, state: WalletState | null) =>
	dispatch({
		type: 'WALLET_UPDATED',
		payload: state,
	});

export const updateUser = (dispatch: Dispatch<ContextAction>, state: UserState) =>
	dispatch({
		type: 'USER_UPDATED',
		payload: state,
	});

export const updateConfig = (dispatch: Dispatch<ContextAction>, state: GetConfigResData | null) =>
	dispatch({
		type: 'CONFIG_UPDATED',
		payload: state,
	});

export const updateAssetsRate = (dispatch: Dispatch<ContextAction>, state: Map<string, number>) =>
	dispatch({
		type: 'ASSETS_RATE_UPDATED',
		payload: state,
	});

export const updateAutoClosedNotification = (dispatch: Dispatch<ContextAction>, state: number[]) =>
	dispatch({
		type: 'CLOSED_NOTIFICATIONS_UPDATED',
		payload: state,
	});
