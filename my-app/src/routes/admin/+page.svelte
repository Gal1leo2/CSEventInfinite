<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import wretch from 'wretch';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import * as Alert from '$lib/components/ui/alert/index.js';
	interface Course {
		course_id: string;
		course_name: string;
		course_lecture: string;
		course_type: string;
		course_date: string;
	}

	interface Student {
		id: number;
		name: string;
		course_id: string;
		Fname: String;
		Lname: String;
		laptop: boolean;
	}

	let courses = writable<Course[]>([]);
	let students = writable<Student[]>([]);
	let isLoading = writable(true); 
	let error = writable<string>(''); 

    // Fetch courses
	async function fetchCourses() {
		try {
			isLoading.set(true);
			const response = await fetch('https://nodejsbackend-ten.vercel.app/user/getcourse');
			if (!response.ok) {
				throw new Error('Failed to fetch courses');
			}
			const data: Course[] = await response.json(); // Type assertion
			courses.set(data);
		} catch (err: unknown) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}
	function getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		return String(error);
	}

    // Add a new course
    async function addCourse() {
       
    }

    // Delete a course
    async function deleteCourse() {
        
    }

    // On mount, fetch courses
    onMount(() => {
        fetchCourses();
    });
</script>

<svelte:head>
    <title>Admin Page</title>
</svelte:head>

<div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Admin Dashboard</h1>

    <!-- Course Form -->


    <!-- Courses List -->
    {#if $isLoading}
        <p>Loading courses...</p>
    {:else if $error}
        <p class="text-red-500">Error: {$error}</p>
    {:else}
        <ul>
            {#each $courses as course}
                <li class="flex justify-between items-center mb-2">
                    <div>
                        <span class="font-medium">{course.course_name}</span> - {course.course_date}
                    </div>
                    <Button on:click={() => deleteCourse()} class="ml-4" variant="outline">
                        Delete
                    </Button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    /* Add any custom styles here */
</style>
