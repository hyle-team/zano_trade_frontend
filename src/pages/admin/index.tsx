import { useContext, useEffect, useState } from 'react';
import { Form, message, Spin } from 'antd';
import axios from 'axios';
import Header from '@/components/default/Header/Header';
import PageTitle from '@/components/default/PageTitle/PageTitle';

import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import { Store } from '@/store/store-reducer';
import styles from './styles.module.scss';
import PairStats from './PairStats';
import FeaturedPairs from './FeaturedPairs';
import Admins from './Admins';

interface FeaturedPair {
	name: string;
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
}

interface PairType {
	id: string | number;
	first_currency: CurrencyType;
}

const AdminPanel: React.FC = () => {
	const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
	const { state } = useContext(Store);

	const [form] = Form.useForm();
	const [adminForm] = Form.useForm();
	const [featuredPairs, setFeaturedPairs] = useState<FeaturedPair[]>([]);
	const [admins, setAdmins] = useState<Admin[]>([]);
	const [selectedAddress, setSelectedAddress] = useState<string>('');
	const [selectedPairID, setSelectedPairID] = useState<string>('');
	const [dateRange, setDateRange] = useState<DateState>({ first: null, last: null });
	const [loading, setLoading] = useState(false);
	const [volumeStats, setVolumeStats] = useState<number | null>(null);
	const [allDates, setAllDates] = useState(false);

	const fetchFeaturedPairs = async () => {
		try {
			const response = await axios.post(
				'/api/admin/get-featured',
				{},
				{ withCredentials: true },
			);

			if (response.data.success) {
				setFeaturedPairs(
					response.data.data.map((pair: PairType) => ({
						name: pair.first_currency.name,
						key: pair.id,
					})),
				);
			} else {
				message.error('Error fetching featured pairs');
			}
		} catch (error) {
			message.error('Error fetching featured pairs');
		}
	};

	const fetchAdmins = async () => {
		try {
			const response = await axios.post(
				'/api/admin/get-admins',
				{},
				{ withCredentials: true },
			);
			if (response.data.success) {
				const fetchedAdmins = response.data.data;
				setAdmins(
					fetchedAdmins.map((admin: { alias: string; isOwner: boolean; id: string }) => ({
						alias: admin.alias,
						isOwner: admin.isOwner,
						key: admin.id,
					})),
				);
			} else {
				message.error({
					content: 'Failed to fetch admins',
					className: styles.message,
				});
			}
		} catch (error) {
			message.error({
				content: 'Error fetching admins',
				className: styles.message,
			});
		}
	};

	// Add featured pair to the backend
	const addFeaturedPair = async (values: { asset_id: string }) => {
		try {
			const response = await axios.post(
				'/api/admin/add-featured',
				{
					asset_id: values.asset_id,
				},
				{ withCredentials: true },
			);

			if (response.data.success) {
				fetchFeaturedPairs();
				message.success({
					content: 'Pair added to featured',
					className: styles.message,
				});
				form.resetFields();
			} else {
				message.error({
					content: response.data.message,
					className: styles.message,
				});
			}
		} catch (error) {
			message.error('Error adding featured pair');
		}
	};

	// Remove featured pair from the backend
	const removeFeaturedPair = async (key: number) => {
		try {
			const pairToRemove = featuredPairs.find((pair) => pair.key === key);
			if (pairToRemove) {
				const response = await axios.post(
					'/api/admin/delete-featured',
					{
						id: pairToRemove.key,
					},
					{ withCredentials: true },
				);

				if (response.data.success) {
					fetchFeaturedPairs();
					message.success({
						content: 'Pair removed from featured',
						className: styles.message,
					});
				} else {
					message.error({
						content: response.data.message,
						className: styles.message,
					});
				}
			}
		} catch (error) {
			message.error('Error removing featured pair');
		}
	};

	useEffect(() => {
		if (!accessAllowed) {
			return;
		}

		fetchAdmins();
		fetchFeaturedPairs();
	}, [accessAllowed]);

	// Add Admin function
	const addAdmin = async (values: { alias: string }) => {
		try {
			if (admins.some((admin) => admin.alias === values.alias)) {
				return message.error({
					content: 'Admin already exists',
					className: styles.message,
				});
			}

			const { data } = await axios.post(
				'/api/admin/add-admin',
				{
					alias: values.alias,
				},
				{ withCredentials: true },
			);

			message[data.success ? 'success' : 'error']({
				content: data.success ? 'Admin added successfully' : data.message,
				className: styles.message,
			});

			if (data.success) {
				fetchAdmins();
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			message.error({
				content:
					error.response?.status === 401
						? 'Unauthorized: Please log in.'
						: 'Error adding admin',
				className: styles.message,
			});
			console.log(error);
		} finally {
			adminForm.resetFields();
		}
	};

	// Remove Admin function
	const removeAdmin = async (key: number) => {
		const adminToRemove = admins.find((admin) => admin.key === key);
		if (adminToRemove && adminToRemove.isOwner) {
			return;
		}

		try {
			const response = await axios.post(
				'/api/admin/delete-admin',
				{
					id: key,
				},
				{ withCredentials: true },
			);

			if (response.data.success) {
				await fetchAdmins();
				message.success({
					content: 'Admin deleted successfully',
					className: styles.message,
				});
			} else {
				message.error({
					content: response.data.message,
					className: styles.message,
				});
			}
		} catch (error) {
			message.error({
				content: 'Error deleting admin',
				className: styles.message,
			});
		}
	};

	const fetchVolumeStats = async () => {
		if (
			!selectedAddress ||
			!selectedPairID ||
			(allDates ? false : !dateRange.first || !dateRange.last)
		) {
			message.error({
				content: 'Please fill in all fields to fetch volume stats',
				className: styles.message,
			});
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

			message.success({
				content: 'Volume stats fetched successfully!',
				className: styles.message,
			});
		} catch (error) {
			console.error(error);
			message.error({
				content: 'Failed to fetch volume stats. Please try again',
				className: styles.message,
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!state?.wallet?.alias) {
			return;
		}

		axios
			.post('/api/admin/check-admin', {}, { withCredentials: true })
			.then(async (res) => {
				await new Promise((resolve) => setTimeout(resolve, 500));
				setAccessAllowed(res?.data?.success);
			})
			.catch((err) => {
				console.error(err);
				setAccessAllowed(false);
			});
	}, [state?.wallet?.alias]);

	if (!state?.wallet?.alias) {
		return (
			<div className={styles.admin__connect}>
				<ConnectButton />
			</div>
		);
	}

	if (!accessAllowed) {
		return (
			<>
				<br />
				<br />
				<Spin />
			</>
		);
	}

	return (
		<>
			<Header />
			<div className={styles.admin}>
				<div className={styles.admin__content}>
					<PageTitle>
						<h1>Admin panel</h1>
					</PageTitle>

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
					<FeaturedPairs
						featuredPairs={featuredPairs}
						form={form}
						addFeaturedPair={addFeaturedPair}
						removeFeaturedPair={removeFeaturedPair}
					/>
					<Admins
						admins={admins}
						removeAdmin={removeAdmin}
						addAdmin={addAdmin}
						form={adminForm}
					/>
				</div>
			</div>
		</>
	);
};

export default AdminPanel;
