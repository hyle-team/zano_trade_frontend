import { useContext, useEffect, useRef } from 'react';
import useUpdateUser from '@/hook/useUpdateUser';
import { Store } from '@/store/store-reducer';
import { updateAssetsRate, updateConfig, updateIsAdmin } from '@/store/actions';
import { useRouter } from 'next/router';
import legacySocket from '@/utils/legacySocket';
import { onAuthorizedEvents, subscribeAuthorizedEvents } from '@/utils/socket';
import { GetConfigResData } from '@/interfaces/responses/config/GetConfigRes';
import { checkAdmin, getZanoPrice, refreshOnline } from '@/utils/methods';
import { ZANO_ASSET_ID } from '@/utils/utils';

const ONLINE_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

function PageHandler(props: { config: GetConfigResData }) {
	const { state, dispatch } = useContext(Store);
	const fetchUser = useUpdateUser();
	const router = useRouter();

	const fetchUserRef = useRef(fetchUser);
	fetchUserRef.current = fetchUser;

	useEffect(() => {
		async function authUser() {
			if (state.user?.address) return;

			const user = await fetchUser();
			if (user) return;

			if (
				['/profile', '/process'].includes(`/${router.route.split('/')[2]}`) &&
				!state.wallet?.connected
			) {
				router.push('/p2p');
			}
		}

		authUser();
	}, [state.wallet?.connected, router.route]);

	useEffect(() => {
		if (state.user?.id) {
			legacySocket.emit('in-account', {
				token: state.token,
			});

			legacySocket.on('refresh-request', () => {
				fetchUser();
			});
		}

		return () => {
			legacySocket.off('refresh-request');
		};
	}, [state.user?.id]);

	useEffect(() => {
		if (!state.token) return undefined;

		const unsubscribe = subscribeAuthorizedEvents(state.token);
		const offEvents = onAuthorizedEvents(() => {
			fetchUserRef.current();
		});

		return () => {
			offEvents();
			unsubscribe();
		};
	}, [state.token]);

	useEffect(() => {
		if (!state.token) return undefined;

		const authParams = { token: state.token };
		refreshOnline(authParams);

		const intervalId = setInterval(() => refreshOnline(authParams), ONLINE_REFRESH_INTERVAL_MS);

		return () => clearInterval(intervalId);
	}, [state.token]);

	useEffect(() => {
		if (!state.token) {
			updateIsAdmin(dispatch, false);
			return;
		}

		let cancelled = false;
		updateIsAdmin(dispatch, null);

		checkAdmin({ token: state.token }).then((isAdmin) => {
			if (!cancelled) updateIsAdmin(dispatch, isAdmin);
		});

		return () => {
			cancelled = true;
		};
	}, [state.token]);

	useEffect(() => {
		if (Object.keys(state.config || {}).length === 0) {
			updateConfig(dispatch, props.config);
		}
	}, []);

	useEffect(() => {
		async function fetchAssetsRate() {
			let result;

			try {
				result = await getZanoPrice();
			} catch {
				return;
			}

			const zanoUsd = result?.data?.usd;

			if (!result?.success || typeof zanoUsd !== 'number') return;

			const assetsRates = new Map<string, number>();
			assetsRates.set(ZANO_ASSET_ID, zanoUsd);

			updateAssetsRate(dispatch, assetsRates);
		}

		fetchAssetsRate();

		const intervalId = setInterval(async () => {
			await fetchAssetsRate();
		}, 20e3);

		return () => {
			clearInterval(intervalId);
		};
	}, [dispatch]);

	return <></>;
}

export default PageHandler;
