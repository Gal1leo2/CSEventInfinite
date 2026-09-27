import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/admin';
import { supabaseAdmin } from '$lib/server/supabase';
import { readJson } from '$lib/server/validate';

const Id = z.union([z.string(), z.number()]);

const Body = z.object({
	batch_id: Id,
	template_id: Id,
	certificate_number: z.string().min(1).max(100),
	recipient_name: z.string().min(1).max(300),
	student_id: Id.nullable(),
	course_id: Id.nullable(),
	additional_data: z.record(z.unknown())
});

// Creates the certificate row first because its id is baked into the QR code, then
// returns an upload URL for the PDF the browser is about to render.
export const POST: RequestHandler = async ({ request, fetch, url }) => {
	await requireAdmin(request, fetch);
	const body = await readJson(request, Body);
	const supabase = supabaseAdmin();

	const { data: cert, error: insertError } = await supabase
		.from('certificates')
		.insert(body)
		.select('id')
		.single();
	if (insertError || !cert) {
		console.error(insertError);
		error(502, 'Failed to create certificate');
	}

	const { data: upload, error: signError } = await supabase.storage
		.from('certificates')
		.createSignedUploadUrl(`certificates/${cert.id}.pdf`);
	if (signError || !upload) {
		console.error(signError);
		error(502, 'Failed to prepare the PDF upload');
	}

	return json({
		id: cert.id,
		qrUrl: `${url.origin}/verify/${cert.id}`,
		uploadUrl: upload.signedUrl
	});
};
