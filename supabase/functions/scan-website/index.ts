

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { url } = await req.json();

        if (!url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const domain = new URL(url).hostname;
        console.log(`Scanning target: ${domain}`);

        const vulnerabilities = [];
        let techStack = [];
        let location = { country: 'Unknown', city: 'Unknown', isp: 'Unknown', ip: 'Unknown' };
        let latency = 0;
        let response;
        let htmlContent = "";

        // 1. LATENCY & CONTENT FETCH
        const startTime = performance.now();
        try {
            response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });
            htmlContent = await response.text();
            latency = Math.round(performance.now() - startTime);
        } catch (fetchError) {
            return new Response(JSON.stringify({
                error: `Failed to connect to ${url}. Target might be down.`,
                details: fetchError.message
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
        }

        // 2. TECH STACK DETECTION
        const lowerHtml = htmlContent.toLowerCase();
        const signatures = {
            'WordPress': /wp-content|wordpress/i,
            'React': /react|next\.js|_next|data-reactroot/i,
            'Vue.js': /vue|nuxt/i,
            'Bootstrap': /bootstrap/i,
            'Tailwind CSS': /tailwindcss/i,
            'jQuery': /jquery/i,
            'Cloudflare': /cloudflare/i,
            'Shopify': /myshopify/i,
            'Stripe': /stripe\.com/i,
            'Google Analytics': /google-analytics|gtag/i,
            'ASP.NET': /asp\.net|__viewstate/i,
            'Django': /csrfmiddlewaretoken/i
        };

        for (const [tech, regex] of Object.entries(signatures)) {
            if (regex.test(lowerHtml)) {
                techStack.push(tech);
            }
        }

        // Check headers for tech too
        const headers = response.headers;
        if (headers.get('server')) techStack.push(`Server: ${headers.get('server')}`);
        if (headers.get('x-powered-by')) techStack.push(headers.get('x-powered-by'));

        // 3. GEOLOCATION & RECON (Server-side)
        try {
            const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}`);
            const dnsJson = await dnsRes.json();

            if (dnsJson.Answer && dnsJson.Answer.length > 0) {
                const ipRecord = dnsJson.Answer.find((r: any) => r.type === 1);
                if (ipRecord) {
                    location.ip = ipRecord.data;
                    const geoRes = await fetch(`http://ip-api.com/json/${location.ip}`);
                    const geoJson = await geoRes.json();
                    if (geoJson.status === 'success') {
                        location.country = geoJson.country;
                        location.city = geoJson.city;
                        location.isp = geoJson.isp;
                    }
                }
            }
        } catch (geoError) {
            console.error("GeoIP lookup failed:", geoError);
        }

        // 4. VULNERABILITY CHECKS (Refined Severity & Realism)

        // HSTS (High Risk) - Check final URL protocol
        const isHttps = response.url.startsWith('https:');
        if (isHttps && !headers.get('strict-transport-security')) {
            vulnerabilities.push({
                type: 'high',
                name: 'Missing HSTS',
                description: 'HTTP Strict Transport Security is missing. Users can be downgraded to HTTP.',
                fix: 'Enable HSTS with long max-age (e.g., max-age=31536000).'
            });
        }

        // CSP (Medium Risk)
        if (!headers.get('content-security-policy')) {
            vulnerabilities.push({
                type: 'medium',
                name: 'No Content Security Policy',
                description: 'Site lacks CSP, increasing XSS and Injection risks.',
                fix: 'Implement a strict Content-Security-Policy.'
            });
        }

        // X-Frame-Options (Medium Risk)
        if (!headers.get('x-frame-options')) {
            vulnerabilities.push({
                type: 'medium',
                name: 'Clickjacking Risk',
                description: 'Missing X-Frame-Options header allows site to be embedded in iframes.',
                fix: 'Set X-Frame-Options to DENY or SAMEORIGIN.'
            });
        }

        // X-Content-Type-Options (Low Risk)
        if (!headers.get('x-content-type-options')) {
            vulnerabilities.push({
                type: 'low',
                name: 'MIME Sniffing Risk',
                description: 'Missing X-Content-Type-Options: nosniff header.',
                fix: 'Set X-Content-Type-Options to nosniff.'
            });
        }

        // Referrer-Policy (Low Risk)
        if (!headers.get('referrer-policy')) {
            vulnerabilities.push({
                type: 'low',
                name: 'Missing Referrer Policy',
                description: 'Controls how much referrer information is sent with requests.',
                fix: 'Set Referrer-Policy to strict-origin-when-cross-origin.'
            });
        }

        // Server Leakage (Low Risk) - Only if verbose
        const serverHeader = headers.get('server');
        if (serverHeader && serverHeader.length > 10) {
            vulnerabilities.push({
                type: 'low',
                name: 'Server Info Leak',
                description: `Server header exposes detailed technology: ${serverHeader}`,
                fix: 'Suppress or obscure the Server header.'
            });
        }

        // 5. CALCULATE SCORE & GRADE
        let score = 100;
        vulnerabilities.forEach(v => {
            if (v.type === 'high') score -= 25;   // Was 30
            if (v.type === 'medium') score -= 10; // Was 15
            if (v.type === 'low') score -= 5;     // Was 5
        });
        score = Math.max(0, score);

        let grade = 'A';
        if (score < 90) grade = 'B';
        if (score < 80) grade = 'C';
        if (score < 70) grade = 'D';
        if (score < 60) grade = 'F';

        const finalTechStack = [...new Set(techStack)];

        // 6. SAVE TO DB (Persistence)
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            const supabase = createClient(supabaseUrl, supabaseKey);

            const { error: dbError } = await supabase
                .from('scan_history')
                .insert({
                    url: url,
                    grade: grade,
                    score: score,
                    vulnerabilities: vulnerabilities,
                    meta_data: {
                        latency,
                        location,
                        techStack: finalTechStack
                    }
                });

            if (dbError) {
                console.error('Failed to save history:', dbError);
            }
        } catch (saveError) {
            console.error('Database save failed:', saveError);
        }

        return new Response(JSON.stringify({
            url,
            status: response.status,
            latency,
            techStack: finalTechStack,
            location,
            vulnerabilities,
            grade,
            score
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
