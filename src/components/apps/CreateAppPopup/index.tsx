import crossIcon from '@/assets/images/UI/cross_icon.svg?url';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import { APP_NAME_MAX_LENGTH, validateAppName } from '@/utils/apps';
import { useState } from 'react';
import { CreateAppPopupProps } from './types';
import styles from './styles.module.scss';

function CreateAppPopup(props: CreateAppPopupProps) {
	const { close, takenNames, onCreate } = props;

	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);

	function submit() {
		const validationError = validateAppName(name, takenNames);

		if (validationError) {
			setError(validationError);
			return;
		}

		onCreate(name.trim());
		close();
	}

	return (
		<div className={styles.create_app__popup}>
			<div>
				<h5>Create app</h5>
				<img onClick={close} src={crossIcon} alt="close" />
			</div>
			<div>
				<div className={styles.create_app__field}>
					<h6>App name</h6>
					<Input
						bordered
						value={name}
						maxLength={APP_NAME_MAX_LENGTH}
						placeholder="My integration"
						onInput={(e) => {
							setName(e.target.value);
							setError(null);
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') submit();
						}}
					/>
					<p className={error ? styles.create_app__error : ''}>
						{error || 'The name has to be unique among your apps.'}
					</p>
				</div>

				<div className={styles.create_app__actions}>
					<Button transparent onClick={close}>
						Cancel
					</Button>
					<Button onClick={submit} disabled={!name.trim()}>
						Create
					</Button>
				</div>
			</div>
		</div>
	);
}

export default CreateAppPopup;
