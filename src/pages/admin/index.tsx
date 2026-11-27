import { useContext, useEffect, useRef, useState } from 'react';
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
import { UserIcon } from '@/components/UI/Icons';
import styles from '@/components/admin/styles.module.scss';
import PairStats from '@/components/admin/PairStats';
import FeaturedPairs from '@/components/admin/FeaturedPairs';
import Admins from '@/components/admin/Admins';
import {
	addAdmin as addAdminRequest,
	addFeaturedPair as addFeaturedPairRequest,
	deleteAdmin,
	deleteFeaturedPair,
	getAdmins,
	getFeaturedPairs,
	getVolumeStats,
} from '@/utils/v2/client';

interface FeaturedPair {
	name: string;
	assetId?: string;
	key: string;
}

interface Admin {
	alias: string;
	isOwner: boolean;
	key: string;
}

interface DateState {
	first: Date | null;
	last: Date | null;
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
			const response = await getFeaturedPairs(state.token);
			if (response.success) {
				setFeaturedPairs(
					response.data.map((pair) => ({
						name: `${pair.baseAsset.ticker}/${pair.quoteAsset.ticker}`,
						assetId: pair.baseAsset.assetId,
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
			const response = await getAdmins(state.token);
			if (response.success) {
				setAdmins(
					response.data.map((admin) => ({
						alias: admin.alias,
						isOwner: admin.isOwner,
						key: admin.id,
					})),
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
			const response = await addFeaturedPairRequest(assetId.toLowerCase(), state.token);

			if (response.success) {
				await fetchFeaturedPairs();
				notify('success', 'Pair added to featured');
				setAssetIdInput('');
			} else {
				notify('error', response.data);
			}
		} catch (error) {
			notify('error', 'Error adding featured pair');
		} finally {
			setAddingPair(false);
		}
	};

	const removeFeaturedPair = async (key: string) => {
		try {
			const response = await deleteFeaturedPair(key, state.token);

			if (response.success) {
				await fetchFeaturedPairs();
				notify('success', 'Pair removed from featured');
			} else {
				notify('error', response.data);
			}
		} catch (error) {
			notify('error', 'Error removing featured pair');
		}
	};

	const addAdmin = async () => {
		const alias = aliasInput.trim().replace(/^@/, '').toLowerCase();

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
			const response = await addAdminRequest(alias, state.token);

			if (response.success) {
				await fetchAdmins();
				setAliasInput('');
				notify('success', 'Admin added successfully');
			} else {
				notify('error', response.data);
			}
		} catch {
			notify('error', 'Error adding admin');
		} finally {
			setAddingAdmin(false);
		}
	};

	const removeAdmin = async (admin: Admin) => {
		if (admin.isOwner) return;

		try {
			const response = await deleteAdmin(admin.key, state.token);

			if (response.success) {
				await fetchAdmins();
				notify('success', 'Admin deleted successfully');
			} else {
				notify('error', response.data);
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

		const from = !allDates && dateRange.first ? new Date(dateRange.first) : null;
		const to = !allDates && dateRange.last ? new Date(dateRange.last) : null;

		from?.setHours(0, 0, 0, 0);
		to?.setHours(23, 59, 59, 999);

		setLoading(true);
		try {
			const response = await getVolumeStats(
				{
					address: selectedAddress.trim(),
					pairId: selectedPairID.trim(),
					from: from?.toISOString(),
					to: to?.toISOString(),
				},
				state.token,
			);

			setVolumeStats(response);

			if (response.success) {
				notify('success', 'Volume stats fetched successfully!');
			} else {
				notify('error', response.data);
			}
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
								<UserIcon />
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
