<script>
	import { Calendar, AlertTriangle, Clock, ArrowRight } from 'lucide-svelte';
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://fonts.googleapis.com/css?family=Noto+Sans+Thai:400,500,600,700&display=swap" rel="stylesheet" />
	<title>CSEvent - Maintenance Mode</title>
</svelte:head>

<div class="font-family min-h-screen flex flex-col bg-gray-50">
	<div class="flex-1 flex items-center justify-center p-4">
		<div class="max-w-2xl w-full">
			<div class="bg-white rounded-2xl shadow-lg overflow-hidden">
				<!-- Orange Header -->
				<div class="bg-[#E35205] p-6 text-white flex items-center justify-between">
					<div>
						<h1 class="text-2xl font-bold">CSEvent</h1>
						<p class="text-white/80">Short Course Registration System</p>
					</div>
					<AlertTriangle class="h-10 w-10" />
				</div>
				
				<!-- Content -->
				<div class="p-8">
					<div class="flex flex-col items-center text-center mb-8">
						<div class="relative mb-6">
							<div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
								<Clock class="h-12 w-12 text-[#E35205]" />
							</div>
							<div class="absolute -bottom-1 -right-1 bg-[#E35205] text-white rounded-full w-8 h-8 flex items-center justify-center">
								<span class="text-sm font-bold">!</span>
							</div>
						</div>
						
						<h2 class="text-3xl font-bold text-gray-800 mb-3">We're Upgrading Our Site</h2>
						<p class="text-gray-600 max-w-md mb-6">
							The CSEvent registration system is temporarily closed for maintenance while we prepare an exciting new version for you.
						</p>
						
						<div class="w-full max-w-md bg-gray-100 rounded-lg p-6">
							<div class="flex items-center justify-center gap-2 mb-2">
								<Calendar class="h-5 w-5 text-[#E35205]" />
								<span class="font-semibold text-gray-800">Coming Soon</span>
							</div>
							<div class="text-3xl font-bold text-[#E35205] mb-3">03/03/2025</div>
							<p class="text-sm text-gray-600">We're working hard to bring you a better experience</p>
						</div>
					</div>
					
					<hr class="my-6 border-gray-200" />
					
					<div class="flex flex-col md:flex-row gap-6">
						<div class="flex-1">
							<h3 class="font-medium text-gray-800 mb-2">What's Happening?</h3>
							<p class="text-sm text-gray-600 mb-4">
								We're updating our course registration system with new features and an improved design. The new system will make it easier to find and register for courses.
							</p>
						</div>
						

					</div>
				</div>
				
				<!-- Footer -->
				<div class="border-t border-gray-200 p-6">
					<div class="flex flex-col md:flex-row justify-between items-center gap-4">
						<div class="text-center md:text-left">
							<div class="text-xl font-bold mb-2">
								<span class="text-[#E35205]">CTRL</span> your future
								<span class="text-[#E35205]">ALT</span> your dream
								<span class="text-[#E35205]">SHIFT UP</span> your skills
							</div>
						</div>
						
						<div class="flex gap-4">
							<a href="https://facebook.com" class="text-gray-500 hover:text-[#E35205] transition-colors">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
								</svg>
							</a>
							<a href="https://github.com" class="text-gray-500 hover:text-[#E35205] transition-colors">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
								</svg>
							</a>
							<a href="https://twitter.com" class="text-gray-500 hover:text-[#E35205] transition-colors">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
								</svg>
							</a>
						</div>
					</div>
				</div>
			</div>
			
			<div class="text-center mt-6 text-sm text-gray-500">
				© 2024 - 2025 | Computer Science, King Mongkut's Institute of Technology Ladkrabang
			</div>
		</div>
	</div>
</div>

<style>
	.font-family {
		font-family: 'Noto Sans Thai', sans-serif;
	}
</style>