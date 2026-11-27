import Alert from '@/components/UI/Alert/Alert';
import { useAlert } from '@/hook/useAlert';

const GlobalAlert = () => {
	const { alertState, alertSubtitle, setAlertState } = useAlert();

	if (!alertState) return null;

	return (
		<Alert type={alertState} subtitle={alertSubtitle || ''} close={() => setAlertState(null)} />
	);
};

export default GlobalAlert;
