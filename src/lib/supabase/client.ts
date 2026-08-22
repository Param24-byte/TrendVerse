import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    let response = await fetch(url, options);

    if (!response.ok) {
      const clone = response.clone();
      try {
        const body = await clone.json();
        if (
          body &&
          (body.code === "PGRST303" ||
            (body.message && body.message.includes("JWT issued at future")))
        ) {
          console.warn("Supabase JWT clock skew detected (PGRST303). Retrying in 1 second...");

          // Wait 1 second and retry once
          await new Promise((resolve) => setTimeout(resolve, 1000));
          response = await fetch(url, options);

          if (!response.ok) {
            const secondClone = response.clone();
            const secondBody = await secondClone.json();
            if (
              secondBody &&
              (secondBody.code === "PGRST303" ||
                (secondBody.message && secondBody.message.includes("JWT")))
            ) {
              console.warn("PGRST303 persists. Retrying without user auth token (anonymous fallback)...");

              // Strip Authorization header to fall back to anonymous access
              const headers = new Headers(options?.headers);
              headers.delete("Authorization");
              response = await fetch(url, {
                ...options,
                headers,
              });
            }
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    return response;
  };

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      global: {
        fetch: customFetch,
      },
    }
  );
}
