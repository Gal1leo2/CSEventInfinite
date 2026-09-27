import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SAFE_ID, supabaseAdmin } from '$lib/server/supabase';

// Storage writes the filename into a Content-Disposition header, so keep it ASCII.
const asciiSlug = (value: string) =>
	value
		.replace(/[^A-Za-z0-9._-]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 80);

export const GET: RequestHandler = async ({ params }) => {
	if (!SAFE_ID.test(params.id)) error(404, 'Certificate not found');

	const supabase = supabaseAdmin();
	const { data: cert } = await supabase
		.from('certificates')
		.select('id, certificate_number, recipient_name, certificate_pdf_url')
		.eq('id', params.id)
		.maybeSingle();

	if (!cert?.certificate_pdf_url) error(404, 'Certificate not found');

	const label =
		asciiSlug(cert.recipient_name ?? '') || asciiSlug(cert.certificate_number ?? '') || cert.id;

	// A short-lived link to the private bucket; the browser downloads straight from storage.
	const { data, error: signError } = await supabase.storage
		.from('certificates')
		.createSignedUrl(cert.certificate_pdf_url, 60, { download: `certificate-${label}.pdf` });

	if (signError || !data) error(502, 'Could not prepare the download');
	redirect(303, data.signedUrl);
};
