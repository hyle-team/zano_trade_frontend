import axios from 'axios';
import { V2Response } from './types';

export type V2Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type V2Query = Record<string, string | number | boolean | null | undefined>;

export interface V2RequestOptions {
	token?: string | null;
	query?: V2Query;
	body?: unknown;
}

export type V2Transport = <T>(
	method: V2Method,
	path: string,
	options?: V2RequestOptions,
) => Promise<V2Response<T>>;

export const V2_PREFIX = '/api/v2';

export function buildV2Path(path: string, query?: V2Query) {
	const params = new URLSearchParams();

	Object.entries(query ?? {}).forEach(([key, value]) => {
		if (value === undefined || value === null || value === '') return;
		params.set(key, String(value));
	});

	const search = params.toString();

	return `${V2_PREFIX}${path}${search ? `?${search}` : ''}`;
}

export function buildV2Headers(options?: V2RequestOptions) {
	const headers: Record<string, string> = {};

	if (options?.body !== undefined) headers['Content-Type'] = 'application/json';
	if (options?.token) headers.Authorization = `Bearer ${options.token}`;

	return headers;
}

const isV2Response = <T>(data: unknown): data is V2Response<T> =>
	typeof data === 'object' && data !== null && 'success' in data;

export const toV2Response = <T>(data: unknown, status: number): V2Response<T> => {
	if (isV2Response<T>(data)) return data;

	return { success: false, error: { code: `HTTP_${status}` } };
};

export const clientTransport: V2Transport = async <T>(
	method: V2Method,
	path: string,
	options?: V2RequestOptions,
) => {
	try {
		const res = await axios.request({
			method,
			url: buildV2Path(path, options?.query),
			data: options?.body,
			headers: buildV2Headers(options),
			validateStatus: () => true,
		});

		return toV2Response<T>(res.data, res.status);
	} catch {
		return { success: false, error: { code: 'NETWORK_ERROR' } } as const;
	}
};
