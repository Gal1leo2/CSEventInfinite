import { error } from '@sveltejs/kit';

const API = import.meta.env.VITE_API_BASE_URL;

// Admin tokens are issued by the CSEvent API, so the API is asked to vouch for the
// bearer token instead of this app verifying the JWT itself.
export async function requireAdmin(request: Request, fetch: typeof globalThis.fetch): Promise<void> {
	const authorization = request.headers.get('authorization') ?? '';
	if (!/^Bearer \S+$/.test(authorization)) error(401, 'Missing admin token');

	let res: Response;
	try {
		res = await fetch(`${API}/admin/auth`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: authorization },
			body: '{}'
		});
	} catch {
		error(502, 'Could not reach the auth service');
	}
	if (!res.ok) error(401, 'Invalid admin token');
}
