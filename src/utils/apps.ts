import AppData from '@/interfaces/common/AppData';

export const APP_NAME_MAX_LENGTH = 32;

export const MAX_APPS_PER_USER = 1;

const STORAGE_KEY = 'zano-trade-apps';

type StoredApp = AppData & { api_key: string | null };

function readStore(): StoredApp[] {
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		return stored ? (JSON.parse(stored) as StoredApp[]) : [];
	} catch (error) {
		console.error('Error reading apps:', error);
		return [];
	}
}

function writeStore(apps: StoredApp[]) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
	} catch (error) {
		console.error('Error saving apps:', error);
	}
}

function toAppData(app: StoredApp): AppData {
	return {
		id: app.id,
		name: app.name,
		created_at: app.created_at,
		api_key_created_at: app.api_key_created_at,
	};
}

function generateApiKey() {
	const bytes = new Uint8Array(24);

	window.crypto.getRandomValues(bytes);

	const key = Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

	return `zt_${key}`;
}

export function getApps(): AppData[] {
	return readStore().map(toAppData);
}

export function getApp(id: string): AppData | null {
	const app = readStore().find((e) => e.id === id);

	return app ? toAppData(app) : null;
}

export function createApp(name: string): AppData {
	const app: StoredApp = {
		id: Date.now().toString(36),
		name: name.trim(),
		created_at: new Date().toISOString(),
		api_key_created_at: null,
		api_key: null,
	};

	writeStore([...readStore(), app]);

	return toAppData(app);
}

export function updateAppName(id: string, name: string): AppData | null {
	const apps = readStore();
	const app = apps.find((e) => e.id === id);

	if (!app) return null;

	const updatedApp: StoredApp = { ...app, name: name.trim() };

	writeStore(apps.map((e) => (e.id === id ? updatedApp : e)));

	return toAppData(updatedApp);
}

export function deleteApp(id: string) {
	writeStore(readStore().filter((app) => app.id !== id));
}

export function getAppApiKey(id: string): string | null {
	return readStore().find((app) => app.id === id)?.api_key || null;
}

export function setAppApiKey(id: string): string | null {
	const apps = readStore();
	const app = apps.find((e) => e.id === id);

	if (!app) return null;

	const key = generateApiKey();

	writeStore(
		apps.map((e) =>
			e.id === id ? { ...e, api_key: key, api_key_created_at: new Date().toISOString() } : e,
		),
	);

	return key;
}

export function validateAppName(name: string, takenNames: string[]): string | null {
	const trimmedName = name.trim();

	if (!trimmedName) {
		return 'App name is required';
	}

	if (trimmedName.length > APP_NAME_MAX_LENGTH) {
		return `App name must be ${APP_NAME_MAX_LENGTH} characters or less`;
	}

	const isTaken = takenNames.some(
		(takenName) => takenName.trim().toLowerCase() === trimmedName.toLowerCase(),
	);

	if (isTaken) {
		return 'You already have an app with this name';
	}

	return null;
}
