import Wretch from 'wretch';

export const API = import.meta.env.VITE_API_BASE_URL;

// CSRF tokens are single-use on the backend, so every request fetches a fresh one.
export async function csrf(): Promise<string> {
	try {
		const res = await Wretch(`${API}/user/csrf-token`).get().json<{ csrfToken: string }>();
		return res.csrfToken;
	} catch (error) {
		console.error('Failed to fetch CSRF token:', error);
		throw new Error('Failed to fetch CSRF token');
	}
}

export const adminToken = (): string | null => localStorage.getItem('auth');

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}
