type GlobalWindow = Window & typeof globalThis;

type ZanoWindow = Omit<GlobalWindow, 'Infinity'> & {
	zano: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		request: (_str: string, _params?: any, _timeoutMs?: number | null) => Promise<any>;
	};
};

export default ZanoWindow;
