import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/admin';
import { supabaseAdmin } from '$lib/server/supabase';
import { readJson } from '$lib/server/validate';

const Body = z.object({
	template: z.object({
		template_name: z.string().min(1).max(200),
		template_image_url: z.string().startsWith('templates/').max(300),
		name_box_x: z.number(),
		name_box_y: z.number(),
		name_box_width: z.number(),
		name_box_height: z.number(),
		font_size: z.number(),
		font_family: z.string().max(100),
		font_color: z.string().max(20),
		text_align: z.enum(['left', 'center', 'right'])
	}),
	total_certificates: z.number().int().nonnegative()
});

// Records the template layout, then opens a batch that the certificates hang off.
export const POST: RequestHandler = async ({ request, fetch }) => {
	await requireAdmin(request, fetch);
	const { template, total_certificates } = await readJson(request, Body);
	const supabase = supabaseAdmin();

	const { data: templateRecord, error: templateError } = await supabase
		.from('certificate_templates')
		.insert(template)
		.select('id')
		.single();
	if (templateError || !templateRecord) {
		console.error(templateError);
		error(502, 'Failed to save template');
	}

	const { data: batch, error: batchError } = await supabase
		.from('certificate_batches')
		.insert({
			batch_name: `Batch ${new Date().toISOString()}`,
			template_id: templateRecord.id,
			total_certificates,
			status: 'processing'
		})
		.select('id')
		.single();
	if (batchError || !batch) {
		console.error(batchError);
		error(502, 'Failed to create batch');
	}

	return json({ templateId: templateRecord.id, batchId: batch.id });
};
