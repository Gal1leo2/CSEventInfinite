<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { writable } from 'svelte/store';
  import * as Card from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Dialog from "$lib/components/ui/dialog";
  import {
    Button,buttonVariants} from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";


  interface Course {
    course_id: string;
    course_name: string;
    course_lecture: string;
    course_type: string;
    course_date: string;
    course_description: string;
    course_image: string; // Assuming each course has an image URL
  }

  let courses = writable<Course[]>([]);
  let isLoading = writable(true);
  let error = writable<string>('');

  const { id } = $page.params;

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  async function fetchCoursesDetails(id: string) {
    try {
      isLoading.set(true);
      const response = await fetch(`https://nodejsbackend-ten.vercel.app/user/getcourse/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data: Course[] = await response.json();
      // Set image URL directly in data
      data.forEach(course => course.course_image = "https://firebasestorage.googleapis.com/v0/b/pguide-e4220.appspot.com/o/Short-course-Deciphering-SQL-Query-Performance-and-more.jpg?alt=media&token=9297cd7d-39bd-4d5d-b7b7-f38076a86bbf");
      courses.set(data);
    } catch (err: unknown) {
      error.set(getErrorMessage(err));
    } finally {
      isLoading.set(false);
    }
  }

  onMount(() => {
    fetchCoursesDetails(id);
  });
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Noto Sans Thai" rel="stylesheet" />
</svelte:head>

<div class="fontUse flex min-h-screen w-full flex-col items-center justify-center bg-gray-100">
  <header class="sticky top-0 flex h-16 items-center justify-between w-full bg-pink-200 px-4 shadow-md">
    <nav class="flex items-center gap-4">
      <a href="##" class="text-xl font-bold text-black transition-colors hover:text-gray-800">
        CSEvent - Short Course Registration System
      </a>
    </nav>
  </header>

  {#if $isLoading}
    <p class="text-gray-500 mt-4">Loading course details...</p>
  {:else if $error}
    <p class="text-red-500 mt-4">Error: {$error}</p>
  {:else if $courses.length}
    {#each $courses as course}
      <Card.Root class="max-w-4xl w-full shadow-md rounded-lg p-6 bg-white mt-6 flex flex-col">
        <div class="flex flex-col lg:flex-row">
          <!-- Top Left: Image -->
          <img src={course.course_image} alt="Course Image" class="w-full lg:w-1/2 h-64 lg:h-auto rounded-lg mb-4 lg:mb-0 object-cover lg:mr-6" />
          
          <!-- Top Right: Course Name -->
          <div class="flex-1 flex flex-col justify-between">
            <Card.Header>
              <Card.Title class="text-base font-semibold mb-2">{course.course_date}</Card.Title>
              <Card.Title class="text-2xl font-semibold mb-2">{course.course_name}</Card.Title>
              <Card.Title class="text-base font-semibold mb-2">{course.course_location}</Card.Title>
              <div class="flex flex-col lg:flex-row justify-between">
                <div class="text-gray-700">
                  <p>Lecturer: {course.course_lecture}</p>
                  <p>Type: {course.course_type}</p>
                </div>
              </div>

            </Card.Header>
            
            <Separator class="my-4 lg:my-6" />
            
            <!-- Bottom Left: Course Description -->
            <Dialog.Root>
              <Dialog.Trigger class={buttonVariants({ variant: "outline" })}
                >Enroll this course</Dialog.Trigger
              >
              <Dialog.Content class="sm:max-w-[425px]">
                <Dialog.Header>
                  <Dialog.Title>Enroll</Dialog.Title>
                  <Dialog.Description>
                    Complete your enrollment here. Fill in your details , and review your choices. Click 'Enroll' when you're ready to submit your application. </Dialog.Description>
                </Dialog.Header>
                <div class="grid gap-4 py-4">
                  <div class="grid grid-cols-4 items-center gap-3">
                    <Label for="StudentIDSent" class="text-right">Student ID </Label>
                    <Input id="stuid" value="" class="col-span-3" />
                  </div>
                  <div class="grid grid-cols-4 items-center gap-3">
                    <Label for="username" class="text-right">Firstname (In Thai)</Label>
                    <Input id="fname" value="" class="col-span-3" />
                  </div>
                  <div class="grid grid-cols-4 items-center gap-3">
                    <Label for="lastnameSent" class="text-right">Lastname (In Thai)</Label>
                    <Input id="lname" value="" class="col-span-3" />
                  </div>
                </div>
                <Dialog.Footer>
                  <Button type="submit">Save changes</Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Root>
          </div>
        </div>
        
        <!-- Bottom Right: Additional Content -->
        <Separator class="my-4 lg:my-6" />
        <div class="flex flex-col lg:flex-row justify-between">
          <div class="text-gray-700">
            <p class="text-base font-bold">Description</p>
            {course.course_description}
          </div>
          <!-- Any additional content or space can be added here -->
        </div>
      </Card.Root>
    {/each}
  {:else}
    <p class="text-gray-500 mt-4">No courses found.</p>
  {/if}
</div>

<style>
  .fontUse {
    font-family: 'Noto Sans Thai';
  }
</style>
