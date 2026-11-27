import { useContext } from 'react';
import { Store } from '@/store/store-reducer';
import { updateUser as updateUserAction } from '@/store/actions';
import { GetUserResData } from '@/interfaces/responses/user/GetUserRes';
import sha256 from 'sha256';

function useUpdateUser() {
	const { state, dispatch } = useContext(Store);

	async function fetchUser() {
		const { token, wallet } = state;

		if (!token || !wallet?.connected || !wallet.address) return false;

		const user: GetUserResData = {
			id: wallet.address,
			alias: wallet.alias,
			address: wallet.address,
			favourite_currencies: [],
			offers: [],
			chats: [],
			exchange_notifications: 0,
		};

		if (sha256(JSON.stringify(state.user)) !== sha256(JSON.stringify(user))) {
			updateUserAction(dispatch, user);
		}

		return true;
	}

	return fetchUser;
}

export default useUpdateUser;
