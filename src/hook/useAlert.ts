import AlertType from '@/interfaces/common/AlertType';
import { Store } from '@/store/store-reducer';
import { useContext } from 'react';

export const useAlert = () => {
	const { state, dispatch } = useContext(Store);

	const setAlertState = (state: AlertType) => {
		dispatch({ type: 'ALERT_STATE_UPDATED', payload: state });
	};

	const setAlertSubtitle = (subtitle: string) => {
		dispatch({ type: 'ALERT_SUBTITLE_UPDATED', payload: subtitle });
	};

	return {
		alertState: state.alertState,
		alertSubtitle: state.alertSubtitle,
		setAlertState,
		setAlertSubtitle,
	};
};
