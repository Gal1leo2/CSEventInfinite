import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

let client: SupabaseClient | null = null;

// Service-role client. It bypasses row-level security, so it must never reach the
// browser; living under $lib/server makes SvelteKit refuse any client-side import.
export function supabaseAdmin(): SupabaseClient {
	if (client) return client;

	const url = env.SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
		error(500, 'Certificate service is not configured');
	}

	client = createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
	return client;
}

// Certificate and template ids end up in URLs and storage paths.
export const SAFE_ID = /^[\w-]{1,64}$/;
