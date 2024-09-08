import { redirect } from '@sveltejs/kit';
 
//redirect to /home
export function load() {
  redirect(302, '/Maint'); }