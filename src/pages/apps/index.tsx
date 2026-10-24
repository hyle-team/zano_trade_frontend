import styles from '@/styles/Apps.module.scss';
import Header from '@/components/default/Header/Header';
import PageTitle from '@/components/default/PageTitle/PageTitle';
import Button from '@/components/UI/Button/Button';
import EmptyMessage from '@/components/UI/EmptyMessage';
import Popup from '@/components/UI/Popup/Popup';
import ConfirmPopup from '@/components/UI/ConfirmPopup';
import CreateAppPopup from '@/components/apps/CreateAppPopup';
import AppData from '@/interfaces/common/AppData';
import * as appsStore from '@/utils/apps';
import { MAX_APPS_PER_USER } from '@/utils/apps';
import { formatTimestamp } from '@/utils/utils';
import { Footer } from '@/zano_ui/src';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function Apps() {
	const [apps, setApps] = useState<AppData[]>([]);
	const [createPopupShown, setCreatePopupState] = useState(false);
	const [appToDelete, setAppToDelete] = useState<AppData | null>(null);

	useEffect(() => {
		setApps(appsStore.getApps());
	}, []);

	const limitReached = apps.length >= MAX_APPS_PER_USER;

	function createApp(name: string) {
		appsStore.createApp(name);
		setApps(appsStore.getApps());
	}

	function deleteApp() {
		if (!appToDelete) return;

		appsStore.deleteApp(appToDelete.id);
		setApps(appsStore.getApps());
		setAppToDelete(null);
	}

	return (
		<>
			<Header />
			<main className={styles.main}>
				<PageTitle>
					<div className={styles.apps__title}>
						<h1>My Apps</h1>
						<p>Register an app to integrate your service with Zano Trade</p>
					</div>
				</PageTitle>

				<div className={styles.apps__content}>
					<div className={styles.apps__nav}>
						<h5>Applications</h5>
						<Button disabled={limitReached} onClick={() => setCreatePopupState(true)}>
							{limitReached ? 'Not available now' : 'Create app'}
						</Button>
					</div>

					{apps.length > 0 ? (
						<ul className={styles.apps__list}>
							{apps.map((app) => (
								<li key={app.id} className={styles.apps__card}>
									<div className={styles.apps__card_info}>
										<h6>{app.name}</h6>
										<p>
											Created{' '}
											{formatTimestamp(new Date(app.created_at).getTime())}
											<span>•</span>
											{app.api_key_created_at
												? 'API key created'
												: 'No API key'}
										</p>
									</div>

									<div className={styles.apps__card_actions}>
										<Link href={`/apps/${app.id}`}>
											<Button className={styles.primary} transparent>
												Open
											</Button>
										</Link>
										<Button
											className={styles.danger}
											onClick={() => setAppToDelete(app)}
										>
											Delete
										</Button>
									</div>
								</li>
							))}
						</ul>
					) : (
						<EmptyMessage text="You have no apps yet" />
					)}
				</div>

				{createPopupShown && (
					<Popup
						blur
						Content={CreateAppPopup}
						settings={{
							takenNames: apps.map((app) => app.name),
							onCreate: createApp,
						}}
						close={() => setCreatePopupState(false)}
					/>
				)}

				{appToDelete && (
					<Popup
						blur
						Content={ConfirmPopup}
						settings={{
							danger: true,
							title: 'Delete app',
							text: `The app "${appToDelete.name}" and its API key will be deleted permanently. Services using this key will lose access.`,
							confirmText: 'Delete',
							onConfirm: deleteApp,
						}}
						close={() => setAppToDelete(null)}
					/>
				)}
			</main>
			<Footer className="no-svg-style" />
		</>
	);
}

export default Apps;
