<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { supabase } from './supabase.js'; // Import Supabase client
    import { goto } from '$app/navigation';  // Import goto for redirection

    // Function to handle Google OAuth login
    async function handleGoogleLogin() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });

        if (error) {
            console.error('Google login error:', error);
            return;
        }

        // Check the session after login
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('Session found:', session);
            goto('/home');
        } else {
            console.error('No session found after login');
        }
    } catch (err) {
        console.error('Unexpected error during Google login:', err);
    }
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