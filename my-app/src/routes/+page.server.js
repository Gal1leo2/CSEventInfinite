import { supabase } from "$lib/supabaseClient";

export async function load() {
    const {data} = await supabase.from("courses").select();
    return {
        courses: data ?? [],
    };
}
