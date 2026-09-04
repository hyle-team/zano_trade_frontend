export interface CreateAppPopupProps {
	close: () => void;
	takenNames: string[];
	onCreate: (_name: string) => void;
}
