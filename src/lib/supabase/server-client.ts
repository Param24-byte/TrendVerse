import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

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
          console.warn("Supabase server-side JWT clock skew detected (PGRST303). Retrying in 1 second...");

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

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if handled by middleware
          }
        },
      },
      global: {
        fetch: customFetch,
      },
    }
  );
}
