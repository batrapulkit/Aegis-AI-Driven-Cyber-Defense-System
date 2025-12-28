export const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Default, will be overridden by strict check or env var
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function getCorsHeaders(origin: string) {
    const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [];

    // If no allowed origins are set, we might be in dev mode or unconfigured.
    // Warning: This falls back to permissive '*' which is not ideal for prod.
    if (allowedOrigins.length === 0) {
        return corsHeaders;
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return {
            ...corsHeaders,
            'Access-Control-Allow-Origin': origin,
        };
    }

    // If origin not allowed, we don't return the A-C-A-O header, effectively blocking it in browser.
    return corsHeaders;
}
