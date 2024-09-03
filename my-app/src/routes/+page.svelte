<script lang="ts">
  import Activity from "lucide-svelte/icons/activity";
  import ArrowUpRight from "lucide-svelte/icons/arrow-up-right";
  import CircleUser from "lucide-svelte/icons/circle-user";
  import { CalendarClock } from 'lucide-svelte';
  import Menu from "lucide-svelte/icons/menu";
  import { CalendarArrowDown } from 'lucide-svelte';
  import { CalendarCheck } from 'lucide-svelte';
  import Search from "lucide-svelte/icons/search";
  import { CalendarHeart } from 'lucide-svelte';
  import { Skeleton } from "$lib/components/ui/skeleton";

  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
</script>

<svelte:head>
  <link href='https://fonts.googleapis.com/css?family=Noto Sans Thai' rel='stylesheet'>
</svelte:head>

<style>
  .fontUse {
    font-family: 'Noto Sans Thai';
  }
</style>



<div class="flex min-h-screen w-full flex-col fontUse">
<header class="bg-pink-200 text-black sticky top-0 flex h-16 items-center gap-4 border-b px-2 md:px-4">
  <nav class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-3 lg:gap-4">
    <a href="##" class="font-bold text-black hover:text-gray-800 transition-colors">
      CSEvent - Short Course Registration System
    </a>
  </nav>
  
  <div class="flex  items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
    <form class="ml-auto flex-1 sm:flex-initial">
      <div class="relative">
        <Search class="text-gray-600 absolute left-2.5 top-2.5 h-5 w-4" />
        <Input
          type="search"
          placeholder="Search events..."
          class="pl-8 sm:w-[200px] md:w-[200px] lg:w-[200px] text-black"
        />

  </header>
  <main class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <div class="flex flex-col justify-center items-center text-black py-4">
      <h1 class="text-2xl font-bold">CTRL your future</h1>
      <h1 class="text-2xl font-bold">ALT your skill</h1>
      <h1 class="text-2xl font-bold">SHIFT your potential</h1>


    </div>
    <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">This week events</Card.Title>
          <CalendarArrowDown class="text-muted-foreground h-4 w-4" />

        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">7</div>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Upcoming events</Card.Title>
          <CalendarHeart class="text-muted-foreground h-4 w-4" />
          
      </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">4</div>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Past events</Card.Title>
          <CalendarCheck class="text-muted-foreground h-4 w-4"/>
      </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">0</div>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">In this year events</Card.Title>
          <CalendarClock class="text-muted-foreground h-4 w-4"/>
      </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">51</div>
        </Card.Content>
      </Card.Root>
    </div>
    <div class="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <Card.Root class="col-span-full">
        <Card.Header class="flex flex-row items-center">
          <div class="grid gap-2">
            <Card.Title>Events</Card.Title>
            <Card.Description>Event that can registered</Card.Description>
          </div>
          <Button href="##" size="sm" class="ml-auto gap-1">
            View All
            <ArrowUpRight class="h-4 w-4" />
          </Button>
        </Card.Header>
        <Card.Content>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Day</Table.Head>
                <Table.Head>Enroll people</Table.Head>
                <Table.Head class="text-right">See detail</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <div class="font-medium">Introduction to React.js</div>
                  <div class="text-muted-foreground hidden text-sm md:inline">
                    P'ICE [Prachaya Sangkharat]
                  </div>
                </Table.Cell>
                <Table.Cell>Web Development</Table.Cell>
                <Table.Cell>3/8/2024</Table.Cell>
                <Table.Cell>
                  <span>1</span>
                </Table.Cell>
                <Table.Cell class="text-right">
                  <Button size="sm" variant="outline">See detail</Button>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <div class="font-medium">SQL Intermediate</div>
                  <div class="text-muted-foreground hidden text-sm md:inline">
                    P'GUIDE [Yuttapichai Kerdcharoen]
                  </div>
                </Table.Cell>
                <Table.Cell>Database</Table.Cell>
                <Table.Cell>25/8/2024</Table.Cell>
                <Table.Cell>
                  <span>41</span>
                </Table.Cell>
                <Table.Cell class="text-right">
                  <Button size="sm" variant="outline">See detail</Button>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <div class="font-medium">Introduction to Quantum Computing</div>
                  <div class="text-muted-foreground hidden text-sm md:inline">
                    P'POOM [Phuvis Kerdpramote]
                  </div>
                </Table.Cell>
                <Table.Cell>Etc.</Table.Cell>
                <Table.Cell>4/9/2024</Table.Cell>
                <Table.Cell >
                  <span>138</span>
                </Table.Cell>
                <Table.Cell class="text-right">
                  <Button size="sm" variant="outline">See detail</Button>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <div class="font-medium">Capture The Flag EP.1</div>
                  <div class="text-muted-foreground hidden text-sm md:inline">
                    CS30 [N'ICE,N'GOT]
                  </div>
                </Table.Cell>
                <Table.Cell>Cybersecurity</Table.Cell>
                <Table.Cell>4/10/2024</Table.Cell>
                <Table.Cell >
                  <span>5</span>
                </Table.Cell>
                <Table.Cell class="text-right">
                  <Button size="sm" variant="outline">See detail</Button>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
          
          
          
        </Card.Content>
      </Card.Root>
      
    </div>
  </main>
</div>