import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const speechKey = Deno.env.get('AZURE_SPEECH_KEY');
        const speechRegion = Deno.env.get('AZURE_SPEECH_REGION');

        if (!speechKey || !speechRegion) {
            throw new Error('Azure Speech configuration missing');
        }

        const tokenResponse = await fetch(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Azure Token Error:', errorText);
            throw new Error(`Failed to fetch token: ${tokenResponse.status} ${errorText}`);
        }

        const token = await tokenResponse.text();

        return new Response(
            JSON.stringify({ token, region: speechRegion }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error in speech-token function:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
