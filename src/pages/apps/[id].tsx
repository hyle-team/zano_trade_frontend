import styles from '@/styles/Apps.module.scss';
import Header from '@/components/default/Header/Header';
import PageTitle from '@/components/default/PageTitle/PageTitle';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import EmptyMessage from '@/components/UI/EmptyMessage';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import Popup from '@/components/UI/Popup/Popup';
import ConfirmPopup from '@/components/UI/ConfirmPopup';
import EyeIcon from '@/assets/images/UI/eye.svg';
import EyeCloseIcon from '@/assets/images/UI/eye_close.svg';
import TickIcon from '@/assets/images/UI/tick_icon.svg';
import CopyIcon from '@/zano_ui/src/assets/copy.svg';
import AppData from '@/interfaces/common/AppData';
import * as appsStore from '@/utils/apps';
import { APP_NAME_MAX_LENGTH, validateAppName } from '@/utils/apps';
import { classes, formatTimestamp } from '@/utils/utils';
import { Footer } from '@/zano_ui/src';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const HIDDEN_API_KEY = '•'.repeat(32);

function App() {
	const router = useRouter();
	const appId = typeof router.query.id === 'string' ? router.query.id : '';

	const [app, setApp] = useState<AppData | null>(null);
	const [takenNames, setTakenNames] = useState<string[]>([]);
	const [loaded, setLoadedState] = useState(false);

	const [nameState, setNameState] = useState('');
	const [nameError, setNameError] = useState<string | null>(null);

	const [apiKey, setApiKey] = useState<string | null>(null);
	const [copied, setCopiedState] = useState(false);

	const [regeneratePopupShown, setRegeneratePopupState] = useState(false);
	const [deletePopupShown, setDeletePopupState] = useState(false);

	useEffect(() => {
		if (!router.isReady) return;

		const appData = appsStore.getApp(appId);

		setApp(appData);
		setNameState(appData?.name || '');
		setTakenNames(
			appsStore
				.getApps()
				.filter((e) => e.id !== appId)
				.map((e) => e.name),
		);
		setLoadedState(true);
	}, [router.isReady, appId]);

	const nameChanged = !!app && nameState.trim() !== app.name;

	function saveName() {
		if (!app) return;

		const validationError = validateAppName(nameState, takenNames);

		if (validationError) {
			setNameError(validationError);
			return;
		}

		setApp(appsStore.updateAppName(app.id, nameState));
		setNameState(nameState.trim());
	}

	function generateApiKey() {
		if (!app) return;

		setApiKey(appsStore.setAppApiKey(app.id));
		setApp(appsStore.getApp(app.id));
		setRegeneratePopupState(false);
	}

	function revealApiKey() {
		if (!app) return;

		setApiKey(appsStore.getAppApiKey(app.id));
	}

	function deleteApp() {
		if (!app) return;

		appsStore.deleteApp(app.id);
		router.push('/apps');
	}

	async function copyApiKey() {
		if (!apiKey) return;

		try {
			await navigator.clipboard.writeText(apiKey);
			setCopiedState(true);
			setTimeout(() => setCopiedState(false), 2000);
		} catch (error) {
			console.error('Error copying API key:', error);
		}
	}

	function ApiKeySection() {
		if (!app?.api_key_created_at) {
			return (
				<div className={styles.app__row}>
					<p className={styles.app__hint}>This app has no API key yet.</p>
					<Button onClick={generateApiKey}>Create API key</Button>
				</div>
			);
		}

		return (
			<>
				<div className={styles.app__key_box}>
					<p className={styles.app__key_value}>{apiKey || HIDDEN_API_KEY}</p>

					<div className={styles.app__key_icons}>
						{apiKey && (
							<button
								className={styles.app__icon_btn}
								title={copied ? 'Copied' : 'Copy'}
								onClick={copyApiKey}
							>
								{copied ? (
									<TickIcon className="stroked" />
								) : (
									<CopyIcon className={classes(styles.copy, 'stroked')} />
								)}
							</button>
						)}

						<button
							className={styles.app__icon_btn}
							title={apiKey ? 'Hide' : 'Show'}
							onClick={() => (apiKey ? setApiKey(null) : revealApiKey())}
						>
							{apiKey ? (
								<EyeCloseIcon className="filled" />
							) : (
								<EyeIcon className="filled" />
							)}
						</button>
					</div>
				</div>

				<div className={styles.app__row}>
					<p className={styles.app__hint}>
						Created {formatTimestamp(new Date(app.api_key_created_at).getTime())}
					</p>
					<Button transparent onClick={() => setRegeneratePopupState(true)}>
						Regenerate
					</Button>
				</div>
			</>
		);
	}

	function AppContent() {
		if (!loaded) {
			return <ContentPreloader style={{ marginTop: 40 }} />;
		}

		if (!app) {
			return <EmptyMessage text="App not found" />;
		}

		return (
			<>
				<div className={styles.app__section}>
					<div className={styles.app__section_head}>
						<h5>App name</h5>
						<p>The name has to be unique among your apps.</p>
					</div>

					<div className={styles.app__field_box}>
						<Input
							value={nameState}
							maxLength={APP_NAME_MAX_LENGTH}
							placeholder="App name"
							onInput={(e) => {
								setNameState(e.target.value);
								setNameError(null);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter') saveName();
							}}
						/>
						<Button
							className={styles.app__field_btn}
							disabled={!nameChanged || !nameState.trim()}
							onClick={saveName}
						>
							Save
						</Button>
					</div>

					{nameError && <p className={styles.app__error}>{nameError}</p>}
				</div>

				<div className={styles.app__section}>
					<div className={styles.app__section_head}>
						<h5>API key</h5>
						<p>One API key per app. The key is hidden until you ask for it.</p>
					</div>

					{ApiKeySection()}
				</div>

				<div className={styles.app__section}>
					<div className={styles.app__section_head}>
						<h5>Delete app</h5>
						<p>The app and its API key will be deleted permanently.</p>
					</div>

					<div className={styles.app__row}>
						<Button
							transparent
							className={styles.app__delete_btn}
							onClick={() => setDeletePopupState(true)}
						>
							Delete app
						</Button>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<Header />
			<main className={styles.main}>
				<PageTitle>
					<div className={styles.apps__title}>
						<h1>{app?.name || 'App'}</h1>
						<p>Manage the app and its API access</p>
					</div>
				</PageTitle>

				<div className={styles.apps__content}>{AppContent()}</div>

				{regeneratePopupShown && (
					<Popup
						blur
						Content={ConfirmPopup}
						settings={{
							danger: true,
							title: 'Regenerate API key',
							text: 'The current API key will stop working immediately. Services using it will have to be updated with the new key.',
							confirmText: 'Regenerate',
							onConfirm: generateApiKey,
						}}
						close={() => setRegeneratePopupState(false)}
					/>
				)}

				{deletePopupShown && app && (
					<Popup
						blur
						Content={ConfirmPopup}
						settings={{
							danger: true,
							title: 'Delete app',
							text: `The app "${app.name}" and its API key will be deleted permanently. Services using this key will lose access.`,
							confirmText: 'Delete',
							onConfirm: deleteApp,
						}}
						close={() => setDeletePopupState(false)}
					/>
				)}
			</main>
			<Footer className="no-svg-style" />
		</>
	);
}

export default App;
