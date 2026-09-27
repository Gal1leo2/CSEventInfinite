import { error } from '@sveltejs/kit';
import type { z } from 'zod';

export async function readJson<T extends z.ZodTypeAny>(
	request: Request,
	schema: T
): Promise<z.infer<T>> {
	const body = await request.json().catch(() => undefined);
	const parsed = schema.safeParse(body);
	if (!parsed.success) error(400, 'Invalid request body');
	return parsed.data;
}
