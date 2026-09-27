import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/admin';
import { SAFE_ID, supabaseAdmin } from '$lib/server/supabase';

// Called once the browser has uploaded the PDF; links it to the certificate row.
export const PATCH: RequestHandler = async ({ params, request, fetch, url }) => {
	await requireAdmin(request, fetch);
	if (!SAFE_ID.test(params.id)) error(404, 'Certificate not found');

	const { error: updateError } = await supabaseAdmin()
		.from('certificates')
		.update({
			certificate_pdf_url: `certificates/${params.id}.pdf`,
			qr_code_url: `${url.origin}/verify/${params.id}`
		})
		.eq('id', params.id);
	if (updateError) {
		console.error(updateError);
		error(502, 'Failed to update certificate');
	}
	return json({ ok: true });
};
