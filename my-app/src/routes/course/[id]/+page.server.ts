import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

interface TokenValidateResponse {
	'error-codes': string[];
	success: boolean;
	action: string;
	cdata: string;
}

async function validateToken(token: string, secret: string) {
	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			response: token,
			secret: secret
		})
	});

	const data: TokenValidateResponse = await response.json();

	return {
		// Return the status
		success: data.success,

		// Return the first error if it exists
		error: data['error-codes']?.length ? data['error-codes'][0] : null
	};
}

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const token = data.get('cf-turnstile-response'); // CAPTCHA response from form
		if (typeof token !== 'string' || !token) {
			return { error: 'Invalid CAPTCHA' };
		}

		const secret = env.TURNSTILE_SECRET_KEY;
		if (!secret) {
			console.error('TURNSTILE_SECRET_KEY is not set');
			return { error: 'CAPTCHA is not configured' };
		}

		const { success, error } = await validateToken(token, secret);

		if (!success) {
			return {
				error: error || 'Invalid CAPTCHA'
			};
		}

		// CAPTCHA is valid, return success
		return {
			success: true
		};
	}
};
