import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/admin';
import { SAFE_ID, supabaseAdmin } from '$lib/server/supabase';
import { readJson } from '$lib/server/validate';

const Body = z.object({
	status: z.enum(['processing', 'completed']),
	successful_count: z.number().int().nonnegative()
});

export const PATCH: RequestHandler = async ({ params, request, fetch }) => {
	await requireAdmin(request, fetch);
	if (!SAFE_ID.test(params.id)) error(404, 'Batch not found');
	const patch = await readJson(request, Body);

	const { error: updateError } = await supabaseAdmin()
		.from('certificate_batches')
		.update(patch)
		.eq('id', params.id);
	if (updateError) {
		console.error(updateError);
		error(502, 'Failed to update batch');
	}
	return json({ ok: true });
};
