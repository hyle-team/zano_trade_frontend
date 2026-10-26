import { FormEvent, useContext, useEffect, useState } from 'react';
import Button from '@/components/UI/Button/Button';
import { CheckIcon, MailIcon } from '@/components/UI/Icons';
import { Store } from '@/store/store-reducer';
import { useOrderActions } from '@/hook/useOrderActions';
import {
	getNotificationSettings,
	setAccountEmail,
	setOrderEmailNotifications,
} from '@/utils/methods';
import { classes } from '@/utils/utils';
import rowStyles from '../SwapOrderStatus/styles.module.scss';
import styles from './styles.module.scss';

interface EmailNotificationRowProps {
	orderId: string;
	subscribed: boolean;
	onSubscribedChange: (_subscribed: boolean) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailNotificationRow = ({
	orderId,
	subscribed,
	onSubscribedChange,
}: EmailNotificationRowProps) => {
	const { state } = useContext(Store);
	const { alertErr } = useOrderActions();

	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState('');
	const [saving, setSaving] = useState(false);
	const [toggling, setToggling] = useState(false);

	const trimmedDraft = draft.trim();
	const draftValid = EMAIL_PATTERN.test(trimmedDraft);
	const draftChanged = trimmedDraft.toLowerCase() !== (email ?? '').toLowerCase();
	const canSave = draftValid && draftChanged && !saving && !toggling;

	useEffect(() => {
		if (!state.token) return undefined;

		let cancelled = false;

		getNotificationSettings({ token: state.token })
			.then((res) => {
				if (!cancelled) setEmail(res.success ? res.data.email : null);
			})
			.catch(() => {
				if (!cancelled) setEmail(null);
			});

		return () => {
			cancelled = true;
		};
	}, [state.token]);

	async function toggleSubscription(next: boolean) {
		setToggling(true);
		const res = await setOrderEmailNotifications(orderId, next, { token: state.token }).catch(
			() => null,
		);
		setToggling(false);

		if (!res?.success) {
			alertErr(
				res?.data === 'Email is not set'
					? 'Add your email first'
					: 'Could not update email notifications',
			);
			return;
		}

		onSubscribedChange(next);
	}

	async function onSave(e: FormEvent) {
		e.preventDefault();

		const value = draft.trim();
		if (!canSave) return;
		if (!EMAIL_PATTERN.test(value)) {
			alertErr('Enter a valid email address');
			return;
		}

		const isFirstEmail = !email;

		setSaving(true);
		const res = await setAccountEmail(value, { token: state.token }).catch(() => null);
		setSaving(false);

		if (!res?.success) {
			alertErr(typeof res?.data === 'string' ? res.data : 'Could not save your email');
			return;
		}

		setEmail(res.data.email);
		setEditing(false);

		if (isFirstEmail && !subscribed) await toggleSubscription(true);
	}

	const startEditing = () => {
		setDraft(email ?? '');
		setEditing(true);
	};

	const showForm = editing || email === null;

	return (
		<div className={classes(rowStyles.notify__row, showForm && styles.row__form)}>
			<div className={styles.row__main}>
				<span className={rowStyles.notify__icon}>
					<MailIcon />
				</span>

				<div className={rowStyles.notify__text}>
					<p>Email notifications</p>
					{email === undefined && <span>Loading...</span>}
					{email === null && (
						<span>Get an email when a match is found or a proposal arrives</span>
					)}
					{email && !editing && (
						<span className={styles.email}>
							<span className={styles.email__value}>{email}</span>
							<button type="button" className={styles.edit} onClick={startEditing}>
								Edit
							</button>
						</span>
					)}
					{email && editing && <span>Update the email linked to your account</span>}
				</div>

				{email && !editing && (
					<Button
						size="sm"
						variant={subscribed ? 'success' : 'secondary'}
						loading={toggling}
						onClick={() => toggleSubscription(!subscribed)}
						title={
							subscribed ? 'Turn off email notifications for this order' : undefined
						}
					>
						{subscribed ? (
							<>
								<CheckIcon width={14} height={14} />
								Subscribed
							</>
						) : (
							'Notify me'
						)}
					</Button>
				)}
			</div>

			{showForm && (
				<form className={styles.form} onSubmit={onSave}>
					<input
						className={styles.form__input}
						type="email"
						inputMode="email"
						autoComplete="email"
						placeholder="you@example.com"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						maxLength={254}
					/>
					<div className={styles.form__actions}>
						{email && (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => setEditing(false)}
							>
								Cancel
							</Button>
						)}
						<Button
							type="submit"
							size="sm"
							variant="primary"
							loading={saving}
							disabled={!canSave}
						>
							{email ? 'Save' : 'Save & notify me'}
						</Button>
					</div>
				</form>
			)}
		</div>
	);
};

export default EmailNotificationRow;
