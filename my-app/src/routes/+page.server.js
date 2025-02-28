import { redirect } from '@sveltejs/kit';

// Redirect to /Maint if the path is empty
export function load({ url }) {
  // Check if the path is empty (e.g., user visits the root domain)
  if (url.pathname === '/') {
    throw redirect(302, '/Maint');
  }
}
