import { ReactNode, createContext, useReducer } from 'react';
import ContextValue, { ContextAction, ContextState } from '@/interfaces/common/ContextValue';

const initialState: ContextState = {
	wallet: null,
	user: null,
	config: null,
	assetsRates: new Map<string, number>(),
	__triggers: {
		offers: 0,
	},
	closed_notifications: [],
};

const reducer = (state: ContextState, action: ContextAction): ContextState => {
	switch (action.type) {
	case 'WALLET_UPDATED':
		return { ...state, wallet: action.payload };

	case 'USER_UPDATED':
		return { ...state, user: action.payload };

	case 'CONFIG_UPDATED':
		return { ...state, config: action.payload };

	case 'TRIGGER_OFFERS_UPDATE':
		return { ...state, __triggers: { ...state.__triggers, offers: Math.random() } };
	case 'ASSETS_RATE_UPDATED': {
		return { ...state, assetsRates: new Map([...state.assetsRates, ...action.payload]) };
	}
	case 'CLOSED_NOTIFICATIONS_UPDATED': {
		return { ...state, closed_notifications: action.payload };
	}
	default:
		return { ...state };
	}
};

export const Store = createContext<ContextValue>({
	state: initialState,
	dispatch: () => undefined, 
});
export const StoreProvider = (props: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(reducer, initialState);
	return <Store.Provider value={{ state, dispatch }}>{props.children}</Store.Provider>;
};
