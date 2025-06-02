import { useContext } from 'react';
import { getUser } from '@/utils/methods';
import { Store } from '@/store/store-reducer';
import { updateUser as updateUserAction } from '@/store/actions';
import sha256 from 'sha256';

function useUpdateUser() {
	const { state, dispatch } = useContext(Store);
	async function fetchUser() {
		if (!sessionStorage.getItem('token')) return false;
		return getUser().then((result) => {
			if (!result.success) return false;

			if (sha256(JSON.stringify(state.user)) !== sha256(JSON.stringify(result.data))) {
				updateUserAction(dispatch, result.data);
			}

			return true;
		});
	}
	return fetchUser;
}

export default useUpdateUser;
