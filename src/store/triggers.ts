import { ContextAction } from '@/interfaces/common/ContextValue';
import { Dispatch } from 'react';

const triggerOffers = (dispatch: Dispatch<ContextAction>) =>
	dispatch({ type: 'TRIGGER_OFFERS_UPDATE' });

export default triggerOffers;
