import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://byviaowigbgthpnxculn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dmlhb3dpZ2JndGhwbnhjdWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTA4MTQsImV4cCI6MjA4MjE4NjgxNH0.2j8qe8knk_w3PbrUl2RqH6gwSByJZ4IwQ5NVl3QtI0c";

export const supabase = createClient(supabaseUrl, supabaseKey);