import { Dispatch, SetStateAction } from 'react';

interface LimitsState {
	min: string;
	max: string;
}

interface DepositState {
	seller: string;
	buyer: string;
}

type WindowedInputsProps = {
	limits?: boolean;
	value: LimitsState | DepositState;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setValue: Dispatch<SetStateAction<any>>;
};

export default WindowedInputsProps;

export { type LimitsState, type DepositState };
