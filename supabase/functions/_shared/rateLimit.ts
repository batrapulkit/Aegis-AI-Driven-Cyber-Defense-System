import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function checkRateLimit(req: Request, user_id?: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const url = new URL(req.url);
    const endpoint = url.pathname;

    // Default Limit: 20 req / minute
    const REQUEST_LIMIT = 20;

    // For registered users, we might allow more
    const limit = user_id ? 50 : 20;

    // 1. Check existing record
    // We look for a record for this IP/User + Endpoint that hasn't expired yet
    // actually, simplified approach: we just log every request or update a counter

    // Let's do a simple "Fixed Window" approach based on the `rate_limits` table
    // We try to upsert.

    // First, see if there's an active window for this user/ip
    const { data: currentLimit, error } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('endpoint', endpoint)
        .or(`ip_address.eq.${ip},user_id.eq.${user_id || '00000000-0000-0000-0000-000000000000'}`) // Simple OR logic might be tricky, let's stick to IP if no user
        .gt('reset_at', new Date().toISOString())
        .maybeSingle();

    // Note: The above OR is pseudocode-ish for Supabase, easier to just check one identity
    // If user_id is present, use it. Else use IP.

    let matchQuery = supabase.from('rate_limits').select('*').eq('endpoint', endpoint);
    if (user_id) {
        matchQuery = matchQuery.eq('user_id', user_id);
    } else {
        matchQuery = matchQuery.eq('ip_address', ip);
    }

    const { data: activeWindow } = await matchQuery.gt('reset_at', new Date().toISOString()).maybeSingle();

    if (activeWindow) {
        if (activeWindow.request_count >= limit) {
            throw new Error('Rate limit exceeded');
        }

        // Increment
        await supabase.from('rate_limits').update({
            request_count: activeWindow.request_count + 1
        }).eq('id', activeWindow.id);

    } else {
        // Create new window
        await supabase.from('rate_limits').insert({
            ip_address: ip,
            user_id: user_id,
            endpoint: endpoint,
            request_count: 1,
            reset_at: new Date(Date.now() + 60 * 1000).toISOString() // 1 minute from now
        });
    }
}
