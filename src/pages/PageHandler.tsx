import { useContext, useEffect } from 'react';
import useUpdateUser from '@/hook/useUpdateUser';
import { Store } from '@/store/store-reducer';
import { updateAssetsRate, updateConfig } from '@/store/actions';
import { useRouter } from 'next/router';
import socket from '@/utils/socket';
import { GetConfigResData } from '@/interfaces/responses/config/GetConfigRes';
import { getZanoPrice } from '@/utils/methods';
import { ZANO_ASSET_ID } from '@/utils/utils';

function PageHandler(props: { config: GetConfigResData }) {
	const { state, dispatch } = useContext(Store);
	const fetchUser = useUpdateUser();
	const router = useRouter();

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
		console.log(state);
		if (state.user?.id) {
			socket.emit('in-account', {
				id: state.user?.id,
			});

			socket.on('refresh-request', () => {
				fetchUser();
			});
		}

		return () => {
			socket.off('refresh-request');
		};
	}, [state.user?.id]);

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
