<script lang="ts">
	import { CalendarArrowDown, LibraryIcon } from 'lucide-svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import { LibraryBig } from 'lucide-svelte';
	import { UsersRound } from 'lucide-svelte';
	import Cookies from 'js-cookie';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Wretch from 'wretch';
	import { toast } from 'svelte-sonner';
	import { Toaster } from 'svelte-sonner';

let username: string;
let password: string;
const login= async () =>{
    await Wretch('https://nodejsbackend-ten.vercel.app/admin/login')
    .post({
        username: username,
        password: password
    })
    .badRequest(async (e)=>{
        toast.warning(JSON.parse(e.message).message)
    })
    .notFound(async(e)=>{
        toast.error(JSON.parse(e.message).message)
    })
    .res(async(e)=>{
        toast.success("Login Successfully!")
        Cookies.set('authUser', username );
        window.location.pathname = 'dev'
    })
}

</script>

<Dialog.Root>
    <Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Admin login</Dialog.Trigger>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Edit profile</Dialog.Title>
            <Dialog.Description>
                Make changes to your profile here. Click save when you're done.
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="Username" class="text-right">Username</Label>
                <Input id="Username" bind:value={username} class="col-span-3" />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="password" class="text-right">Password</Label>
                <Input id="password" bind:value={password} class="col-span-3" />
            </div>
        </div>
        <Dialog.Footer>
            <Button type="submit" on:click={login}>Save changes</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>