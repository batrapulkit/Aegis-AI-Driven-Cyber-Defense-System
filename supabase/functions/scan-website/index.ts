

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

        // 2. TECH STACK & AI DETECTION
        const lowerHtml = htmlContent.toLowerCase();
        const signatures = {
            'LangChain': /langchain/i,
            'OpenAI API': /openai|sk-proj/i,
            'Vercel AI SDK': /vercel\/ai|ai-sdk/i,
            'HuggingFace': /huggingface|hf-hub/i,
            'Pinecone': /pinecone/i,
            'Replicate': /replicate\.com/i,
            'Anthropic': /anthropic/i,
            'React': /react|next\.js|_next/i,
            'Tailwind CSS': /tailwindcss/i,
            'TensorFlow.js': /tensorflow/i,
            'PyTorch': /pytorch/i
        };

        for (const [tech, regex] of Object.entries(signatures)) {
            if (regex.test(lowerHtml)) {
                techStack.push(tech);
            }
        }

        // Check headers
        const headers = response.headers;
        if (headers.get('server')) techStack.push(`Server: ${headers.get('server')}`);

        // 3. GEOLOCATION (Keep existing logic)
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

        // 4. REAL AI VULNERABILITY CHECKS

        // A. Exposed API Keys (High Risk)
        const openAIKeyMatch = htmlContent.match(/sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}/); // Basic heuristics to avoid false positives on truncated keys
        // We use a broader regex for detection but mask it in output
        if (/sk-proj-[a-zA-Z0-9]{20,}/.test(htmlContent) || /sk-[a-zA-Z0-9]{48}/.test(htmlContent)) {
            vulnerabilities.push({
                type: 'high',
                name: 'Exposed OpenAI API Key',
                description: 'A potential OpenAI API key was found in the client-side code. This can lead to quota theft.',
                fix: 'Rotate the key immediately and move all API calls to a backend proxy.'
            });
        }

        if (/hf_[a-zA-Z0-9]{20,}/.test(htmlContent)) {
            vulnerabilities.push({
                type: 'high',
                name: 'Exposed HuggingFace Token',
                description: 'A HuggingFace Access Token was found in the source code.',
                fix: 'Revoke the token and use backend-only authentication.'
            });
        }

        // B. Robots.txt Analysis (Privacy Risk)
        try {
            const robotsRes = await fetch(`${new URL(url).origin}/robots.txt`);
            if (robotsRes.ok) {
                const robotsTxt = await robotsRes.text();
                // Check if they BLOCK AI bots
                const blocksGPT = /User-agent:.*GPTBot\s*Disallow:\s*\//i.test(robotsTxt);
                const blocksCC = /User-agent:.*CCBot\s*Disallow:\s*\//i.test(robotsTxt);

                if (!blocksGPT && !blocksCC) {
                    vulnerabilities.push({
                        type: 'low',
                        name: 'AI Training Permitted',
                        description: 'robots.txt allows GPTBot (OpenAI) and CCBot to scrape site content for model training.',
                        fix: 'Add "User-agent: GPTBot Disallow: /" to robots.txt if this is private data.'
                    });
                }
            }
        } catch (e) {
            // Ignore robots failure
        }

        // C. Common AI Endpoints (Recon)
        const commonEndpoints = ['/api/chat', '/api/completion', '/api/generate', '/v1/chat/completions'];
        const endpointChecks = await Promise.all(commonEndpoints.map(async (ep) => {
            try {
                const checkUrl = new URL(ep, url).toString();
                const res = await fetch(checkUrl, { method: 'OPTIONS' });
                return res.status !== 404 ? ep : null;
            } catch { return null; }
        }));

        const foundEndpoints = endpointChecks.filter(e => e !== null);
        if (foundEndpoints.length > 0) {
            vulnerabilities.push({
                type: 'medium',
                name: 'Exposed AI Endpoints',
                description: `Publicly accessible API routes detected: ${foundEndpoints.join(', ')}. Ensure they are rate-limited and authenticated.`,
                fix: 'Verify authentication middleware protects these routes.'
            });
        }

        // D. HSTS (Base Security)
        if (url.startsWith('https') && !headers.get('strict-transport-security')) {
            vulnerabilities.push({
                type: 'low',
                name: 'Missing HSTS',
                description: 'Standard security header missing. Recommended for all secure apps.',
                fix: 'Enable HSTS.'
            });
        }

        // 5. CALCULATE SCORE
        let score = 100;
        vulnerabilities.forEach(v => {
            if (v.type === 'high') score -= 40;
            if (v.type === 'medium') score -= 20;
            if (v.type === 'low') score -= 5;
        });
        score = Math.max(0, score);

        let grade = 'A';
        if (score < 90) grade = 'B';
        if (score < 70) grade = 'C';
        if (score < 50) grade = 'D';
        if (score < 30) grade = 'F';

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
