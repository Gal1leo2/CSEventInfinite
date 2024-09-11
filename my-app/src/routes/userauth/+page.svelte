<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { supabase } from './supabase.js'; // Import Supabase client
	import { goto } from '$app/navigation'; // Import goto for redirection

	async function handleGoogleLogin() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				queryParams: {
					access_type: 'offline',
					prompt: 'consent'
				}
			}
		});

		if (error) {
			console.error('Google login error:', error);
			return;
		}

		setTimeout(async () => {
			const { data: { session }, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) {
				console.error('Error fetching session:', sessionError);
				return;
			}

			if (session && session.user) {
				console.log('Session found:', session);
				goto('/home');
			} else {
				console.error('No session found after login');
			}
		}, 1000); 
	}
</script>

<Card.Root class="mx-auto max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Login with your Google account</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			<Button variant="outline" class="w-full" on:click={handleGoogleLogin}>
				Login with Google
			</Button>
		</div>
	</Card.Content>
</Card.Root>
