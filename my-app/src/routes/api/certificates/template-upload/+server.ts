import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/admin';
import { supabaseAdmin } from '$lib/server/supabase';
import { readJson } from '$lib/server/validate';

const Body = z.object({ file_name: z.string().min(1).max(200) });

// Hands out a one-off upload URL so the (possibly large) template image goes straight
// from the browser to storage instead of through a size-limited serverless function.
export const POST: RequestHandler = async ({ request, fetch }) => {
	await requireAdmin(request, fetch);
	const { file_name } = await readJson(request, Body);

	const safeName = file_name.replace(/[^\w.-]+/g, '_');
	const path = `templates/${Date.now()}-${safeName}`;

	const { data, error: signError } = await supabaseAdmin()
		.storage.from('certificate-templates')
		.createSignedUploadUrl(path);

	if (signError || !data) error(502, 'Could not prepare the template upload');
	return json({ path: data.path, signedUrl: data.signedUrl });
};
