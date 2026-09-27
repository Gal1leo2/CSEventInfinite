import type { PageServerLoad } from './$types';
import { SAFE_ID, supabaseAdmin } from '$lib/server/supabase';

export interface VerifiedCertificate {
	id: string;
	certificate_number: string | null;
	recipient_name: string;
	student_id: number | string | null;
	issue_date: string | null;
	status: string | null;
	has_pdf: boolean;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;
	if (!SAFE_ID.test(id)) return { id, certificate: null };

	const { data, error } = await supabaseAdmin()
		.from('certificates')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (error || !data) return { id, certificate: null };

	// Only what the public page shows. The row also carries the raw CSV import and
	// storage paths, which stay on the server.
	const certificate: VerifiedCertificate = {
		id: data.id,
		certificate_number: data.certificate_number ?? null,
		recipient_name: data.recipient_name,
		student_id: data.student_id ?? null,
		issue_date: data.issue_date ?? data.created_at ?? null,
		status: data.status ?? null,
		has_pdf: Boolean(data.certificate_pdf_url)
	};
	return { id, certificate };
};
