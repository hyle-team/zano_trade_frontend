import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Header from '@/components/default/Header/Header';
import SiteFooter from '@/components/default/SiteFooter';
import ConfirmModal from '@/components/UI/ConfirmModal';
import Alert from '@/components/UI/Alert/Alert';
import { Store } from '@/store/store-reducer';
import { classes } from '@/utils/utils';
import { figtree } from '@/utils/font';
import NotFound from '@/pages/404';
import Spinner from '@/components/UI/Spinner';
import styles from '@/components/admin/styles.module.scss';
import PairStats from '@/components/admin/PairStats';
import FeaturedPairs from '@/components/admin/FeaturedPairs';
import Admins from '@/components/admin/Admins';

interface FeaturedPair {
	name: string;
	assetId?: string;
	key: number;
}

interface Admin {
	alias: string;
	isOwner: boolean;
	key: number;
}

interface DateState {
	first: Date | null;
	last: Date | null;
}

interface CurrencyType {
	name: string;
	asset_id?: string;
}

interface PairType {
	id: number;
	first_currency: CurrencyType;
}

interface VolumeStatsResponse {
	success?: boolean;
	data?: { volume?: string } | string;
}

type Notice = { type: 'success' | 'error'; text: string } | null;

type PendingRemoval = { type: 'pair'; pair: FeaturedPair } | { type: 'admin'; admin: Admin } | null;

const NOTICE_TIMEOUT = 3000;

const AdminPanel: React.FC = () => {
	const { state } = useContext(Store);
	const accessAllowed = !!state.token && state.isAdmin === true;

	const [featuredPairs, setFeaturedPairs] = useState<FeaturedPair[]>([]);
	const [featuredLoading, setFeaturedLoading] = useState(true);
	const [assetIdInput, setAssetIdInput] = useState('');
	const [addingPair, setAddingPair] = useState(false);

	const [admins, setAdmins] = useState<Admin[]>([]);
	const [adminsLoading, setAdminsLoading] = useState(true);
	const [aliasInput, setAliasInput] = useState('');
	const [addingAdmin, setAddingAdmin] = useState(false);

	const [selectedAddress, setSelectedAddress] = useState<string>('');
	const [selectedPairID, setSelectedPairID] = useState<string>('');
	const [dateRange, setDateRange] = useState<DateState>({ first: null, last: null });
	const [loading, setLoading] = useState(false);
	const [volumeStats, setVolumeStats] = useState<VolumeStatsResponse | null>(null);
	const [allDates, setAllDates] = useState(false);

	const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval>(null);
	const [removing, setRemoving] = useState(false);

	const [notice, setNotice] = useState<Notice>(null);
	const noticeTimer = useRef<ReturnType<typeof setTimeout>>();

	const notify = (type: 'success' | 'error', text: string) => {
		clearTimeout(noticeTimer.current);
		setNotice({ type, text });
		noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_TIMEOUT);
	};

	useEffect(() => () => clearTimeout(noticeTimer.current), []);

	const fetchFeaturedPairs = async () => {
		try {
			const response = await axios.post('/api/admin/get-featured', {
				token: state.token,
			});
			if (response.data.success) {
				setFeaturedPairs(
					response.data.data.map((pair: PairType) => ({
						name: pair.first_currency.name,
						assetId: pair.first_currency.asset_id,
						key: pair.id,
					})),
				);
			} else {
				notify('error', 'Error fetching featured pairs');
			}
		} catch (error) {
			notify('error', 'Error fetching featured pairs');
		} finally {
			setFeaturedLoading(false);
		}
	};

	const fetchAdmins = async () => {
		try {
			const response = await axios.post('/api/admin/get-admins', {
				token: state.token,
			});
			if (response.data.success) {
				setAdmins(
					response.data.data.map(
						(admin: { alias: string; isOwner: boolean; id: number }) => ({
							alias: admin.alias,
							isOwner: admin.isOwner,
							key: admin.id,
						}),
					),
				);
			} else {
				notify('error', 'Failed to fetch admins');
			}
		} catch (error) {
			notify('error', 'Error fetching admins');
		} finally {
			setAdminsLoading(false);
		}
	};

	const addFeaturedPair = async () => {
		const assetId = assetIdInput.trim();

		if (!assetId) {
			notify('error', 'Asset ID is required');
			return;
		}

		setAddingPair(true);

		try {
			const response = await axios.post('/api/admin/add-featured', {
				asset_id: assetId,
				token: state.token,
			});

			if (response.data.success) {
				await fetchFeaturedPairs();
				notify('success', 'Pair added to featured');
				setAssetIdInput('');
			} else {
				notify('error', response.data.message);
			}
		} catch (error) {
			notify('error', 'Error adding featured pair');
		} finally {
			setAddingPair(false);
		}
	};

	const removeFeaturedPair = async (key: number) => {
		try {
			const response = await axios.post('/api/admin/delete-featured', {
				token: state.token,
				id: key,
			});

			if (response.data.success) {
				await fetchFeaturedPairs();
				notify('success', 'Pair removed from featured');
			} else {
				notify('error', response.data.message);
			}
		} catch (error) {
			notify('error', 'Error removing featured pair');
		}
	};

	const addAdmin = async () => {
		const alias = aliasInput.trim().replace(/^@/, '');

		if (!alias) {
			notify('error', 'Alias is required');
			return;
		}

		if (admins.some((admin) => admin.alias === alias)) {
			notify('error', 'Admin already exists');
			return;
		}

		setAddingAdmin(true);

		try {
			const { data } = await axios.post('/api/admin/add-admin', {
				alias,
				token: state.token,
			});

			notify(
				data.success ? 'success' : 'error',
				data.success ? 'Admin added successfully' : data.message,
			);

			if (data.success) {
				await fetchAdmins();
				setAliasInput('');
			}
		} catch (error) {
			notify(
				'error',
				axios.isAxiosError(error) && error.response?.status === 401
					? 'Unauthorized: Please log in.'
					: 'Error adding admin',
			);
			console.log(error);
		} finally {
			setAddingAdmin(false);
		}
	};

	const removeAdmin = async (admin: Admin) => {
		if (admin.isOwner) return;

		try {
			const response = await axios.post('/api/admin/delete-admin', {
				token: state.token,
				id: admin.key,
			});

			if (response.data.success) {
				await fetchAdmins();
				notify('success', 'Admin deleted successfully');
			} else {
				notify('error', response.data.message);
			}
		} catch (error) {
			notify('error', 'Error deleting admin');
		}
	};

	const onConfirmRemoval = async () => {
		if (!pendingRemoval) return;

		setRemoving(true);

		if (pendingRemoval.type === 'pair') {
			await removeFeaturedPair(pendingRemoval.pair.key);
		} else {
			await removeAdmin(pendingRemoval.admin);
		}

		setRemoving(false);
		setPendingRemoval(null);
	};

	const fetchVolumeStats = async () => {
		if (
			!selectedAddress ||
			!selectedPairID ||
			(allDates ? false : !dateRange.first || !dateRange.last)
		) {
			notify('error', 'Please fill in all fields to fetch volume stats');
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post('/api/dex/volume-stats', {
				address: selectedAddress,
				pairID: selectedPairID,
				from: allDates ? 0 : dateRange?.first?.getTime(),
				to: allDates ? 999999999999999 : dateRange?.last?.getTime(),
			});

			setVolumeStats(response.data);
			notify('success', 'Volume stats fetched successfully!');
		} catch (error) {
			console.error(error);
			notify('error', 'Failed to fetch volume stats. Please try again');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!accessAllowed) {
			return;
		}

		fetchAdmins();
		fetchFeaturedPairs();
	}, [accessAllowed, state.token]);

	const currentAlias = state?.wallet?.alias;
	const isOwner = admins.some((admin) => admin.alias === currentAlias && admin.isOwner);

	if (!state.token || state.isAdmin === false) {
		return <NotFound />;
	}

	return (
		<>
			<Head>
				<meta name="robots" content="noindex, nofollow" />
			</Head>
			<Header />
			<main className={classes(styles.adminPage, figtree.variable)}>
				<div className={styles.adminPage__head}>
					<div>
						<h1>Admin panel</h1>
						<p>Manage featured pairs, admins and trading volume stats</p>
					</div>

					{accessAllowed && currentAlias && (
						<div className={styles.role}>
							<span className={styles.role__avatar}>
								{currentAlias.charAt(0).toUpperCase()}
							</span>
							<p>@{currentAlias}</p>
							<span
								className={classes(
									styles.badge,
									isOwner ? styles.badge__info : styles.badge__muted,
								)}
							>
								{isOwner ? 'Owner' : 'Admin'}
							</span>
						</div>
					)}
				</div>

				{accessAllowed ? (
					<div className={styles.grid}>
						<div className={styles.grid__wide}>
							<PairStats
								loading={loading}
								volumeStats={volumeStats}
								selectedAddress={selectedAddress}
								setSelectedAddress={setSelectedAddress}
								selectedPairID={selectedPairID}
								setSelectedPairID={setSelectedPairID}
								allDates={allDates}
								setAllDates={setAllDates}
								dateRange={dateRange}
								setDateRange={setDateRange}
								fetchVolumeStats={fetchVolumeStats}
							/>
						</div>

						<FeaturedPairs
							featuredPairs={featuredPairs}
							loading={featuredLoading}
							assetId={assetIdInput}
							setAssetId={setAssetIdInput}
							adding={addingPair}
							addFeaturedPair={addFeaturedPair}
							removeFeaturedPair={(pair) => setPendingRemoval({ type: 'pair', pair })}
						/>

						<Admins
							admins={admins}
							loading={adminsLoading}
							currentAlias={currentAlias}
							alias={aliasInput}
							setAlias={setAliasInput}
							adding={addingAdmin}
							addAdmin={addAdmin}
							removeAdmin={(admin) => setPendingRemoval({ type: 'admin', admin })}
						/>
					</div>
				) : (
					<div className={styles.loader}>
						<Spinner />
					</div>
				)}
			</main>
			<SiteFooter />

			<ConfirmModal
				open={!!pendingRemoval}
				title={pendingRemoval?.type === 'admin' ? 'Remove admin?' : 'Remove featured pair?'}
				description={
					pendingRemoval?.type === 'admin'
						? `@${pendingRemoval.admin.alias} will lose access to the admin panel.`
						: `${pendingRemoval?.pair.name ?? ''} will no longer be shown in featured pairs.`
				}
				confirmLabel="Remove"
				cancelLabel="Keep"
				loading={removing}
				onConfirm={onConfirmRemoval}
				onClose={() => setPendingRemoval(null)}
			/>

			{notice && (
				<Alert
					type={notice.type}
					subtitle={notice.text}
					close={() => {
						clearTimeout(noticeTimer.current);
						setNotice(null);
					}}
				/>
			)}
		</>
	);
};

export default AdminPanel;
