
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const clientKey = formData.get('x_api_key') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    // Use Server Env OR Client-Provided Key (optimized for local dev)
    const VIRUSTOTAL_API_KEY = Deno.env.get('VIRUSTOTAL_API_KEY') || clientKey;

    if (!VIRUSTOTAL_API_KEY) {
      console.log('VirusTotal API key not configured. Falling back to DEMO MOCK mode.');

      // Simulate scan delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const isClean = true; // Default to clean for demo
      const response = {
        fileName: file.name,
        fileSize: file.size,
        isClean,
        stats: {
          malicious: 0,
          suspicious: 0,
          undetected: 0,
          harmless: 1,
          timeout: 0,
        },
        scanDate: new Date().toISOString(),
        verdict: 'CLEAN (DEMO)',
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Scanning file: ${file.name}, size: ${file.size} bytes`);

    // Upload file to VirusTotal for scanning
    const vtFormData = new FormData();
    vtFormData.append('file', file);

    const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
      },
      body: vtFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('VirusTotal upload error:', errorText);
      throw new Error(`VirusTotal upload failed: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    const analysisId = uploadResult.data.id;

    console.log(`File uploaded, analysis ID: ${analysisId}`);

    // Poll for analysis results (with timeout)
    let analysisResult = null;
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const analysisResponse = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
          headers: {
            'x-apikey': VIRUSTOTAL_API_KEY,
          },
        }
      );

      if (!analysisResponse.ok) {
        console.error('Analysis fetch error:', await analysisResponse.text());
        attempts++;
        continue;
      }

      const result = await analysisResponse.json();

      if (result.data.attributes.status === 'completed') {
        analysisResult = result.data.attributes;
        break;
      }

      attempts++;
      console.log(`Analysis pending, attempt ${attempts}/${maxAttempts}`);
    }

    if (!analysisResult) {
      throw new Error('Analysis timed out');
    }

    const stats = analysisResult.stats;
    const isClean = stats.malicious === 0 && stats.suspicious === 0;

    const response = {
      fileName: file.name,
      fileSize: file.size,
      isClean,
      stats: {
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        undetected: stats.undetected,
        harmless: stats.harmless,
        timeout: stats.timeout,
      },
      scanDate: new Date().toISOString(),
      verdict: isClean ? 'CLEAN' : 'THREAT_DETECTED',
    };

    console.log('Scan complete:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in scan-file function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
