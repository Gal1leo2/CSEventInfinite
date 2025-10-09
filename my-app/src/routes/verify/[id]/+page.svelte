<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { createClient } from '@supabase/supabase-js';
	import { Button } from '$lib/components/ui/button';

	const supabase = createClient(
		'https://cseventdb.poomzi.com',
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTk1MTA4MDAsImV4cCI6MTkxNzI3NzIwMH0.8QxMbL-HG6l7cv5Sif4JtrcMie4gapkZ52eIvLWlhKc'
	);

	interface Certificate {
		id: string;
		certificate_number: string;
		recipient_name: string;
		student_id: number | null;
		issue_date: string;
		status: string;
		certificate_pdf_url: string | null;
	}

	const { id } = $page.params;
	let certificate: Certificate | null = null;
	let loading = true;
	let error = false;

	onMount(async () => {
		const { data, error: fetchError } = await supabase
			.from('certificates')
			.select('*')
			.eq('id', id)
			.single();

		if (fetchError || !data) {
			error = true;
		} else {
			certificate = data;
		}
		loading = false;
	});

	async function downloadCertificate() {
		if (!certificate?.certificate_pdf_url) return;

		const { data } = await supabase.storage
			.from('certificates')
			.download(certificate.certificate_pdf_url);

		if (data) {
			const url = URL.createObjectURL(data);
			const a = document.createElement('a');
			a.href = url;
			a.download = `certificate-${certificate.recipient_name}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
		}
	}
</script>

<div class="min-h-screen bg-white flex items-center justify-center p-4">
	<div class="max-w-2xl w-full border-2 border-black p-8">
		{#if loading}
			<p class="text-center">Verifying...</p>
		{:else if error || !certificate}
			<div class="text-center">
				<h1 class="text-2xl font-bold mb-4 uppercase">Invalid Certificate</h1>
				<p class="mb-4">This certificate could not be verified.</p>
				<p class="text-sm font-mono">{id}</p>
			</div>
		{:else}
			<div class="space-y-6">
				<div class="text-center border-b-2 border-black pb-6">
					<h1 class="text-3xl font-bold mb-2 uppercase">Certificate Verified</h1>
					<p class="uppercase text-sm tracking-wider">{certificate.status}</p>
				</div>

				<div class="space-y-4">
					<div class="border-b border-gray-300 pb-3">
						<p class="text-xs uppercase text-gray-600 mb-1">Recipient</p>
						<p class="text-xl font-bold">{certificate.recipient_name}</p>
					</div>

					<div class="border-b border-gray-300 pb-3">
						<p class="text-xs uppercase text-gray-600 mb-1">Certificate Number</p>
						<p class="font-mono">{certificate.certificate_number || certificate.id.substring(0, 12)}</p>
					</div>

					<div class="border-b border-gray-300 pb-3">
						<p class="text-xs uppercase text-gray-600 mb-1">Issue Date</p>
						<p>{new Date(certificate.issue_date).toLocaleDateString()}</p>
					</div>

					{#if certificate.student_id}
						<div class="border-b border-gray-300 pb-3">
							<p class="text-xs uppercase text-gray-600 mb-1">Student ID</p>
							<p>{certificate.student_id}</p>
						</div>
					{/if}
				</div>

				{#if certificate.certificate_pdf_url}
					<Button on:click={downloadCertificate} class="w-full bg-black hover:bg-gray-800">
						Download Certificate
					</Button>
				{/if}

				<div class="text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
					<p>ID: {certificate.id}</p>
				</div>
			</div>
		{/if}
	</div>
</div>