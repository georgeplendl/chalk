const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export interface AnnotationRow {
  id: string;
  url: string;
  data: Record<string, unknown>;
  type: 'drawing' | 'text';
  session_token: string;
  created_at: string;
}

export interface NewAnnotation {
  url: string;
  data: Record<string, unknown>;
  type: 'drawing' | 'text';
  session_token: string;
}

export async function fetchAnnotations(url: string): Promise<AnnotationRow[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/annotations?url=eq.${encodeURIComponent(url)}&order=created_at.asc`,
      { headers: HEADERS },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function saveAnnotation(annotation: NewAnnotation): Promise<AnnotationRow | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/annotations`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'return=representation' },
      body: JSON.stringify(annotation),
    });
    if (!res.ok) return null;
    const [row] = await res.json() as AnnotationRow[];
    return row ?? null;
  } catch {
    return null;
  }
}

export async function reportAnnotation(annotationId: string, reporterToken: string): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify({ annotation_id: annotationId, reporter_token: reporterToken }),
    });
  } catch {
    // fail silently
  }
}
