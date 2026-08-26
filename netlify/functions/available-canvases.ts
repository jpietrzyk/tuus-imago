import { createServiceClient } from "./_shared/supabase-auth";

type NetlifyEvent = {
  httpMethod?: string;
};

type PictureCanvasRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  image_url: string | null;
  color: string | null;
  material: string | null;
  is_default: boolean;
  sort_order: number;
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ canvases: [], error: "Supabase client init failed", detail: e instanceof Error ? e.message : String(e) }),
    };
  }

  const { data: canvases, error: fetchError } = await supabase
    .from("picture_canvases")
    .select("id, name, description, price, currency, image_url, color, material, is_default, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (fetchError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ canvases: [], error: "Query failed", detail: fetchError.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      canvases: (canvases ?? []).map((canvas: PictureCanvasRow) => ({
        id: canvas.id,
        name: canvas.name,
        description: canvas.description,
        price: Number(canvas.price),
        currency: canvas.currency,
        imageUrl: canvas.image_url,
        color: canvas.color,
        material: canvas.material,
        isDefault: canvas.is_default,
      })),
    }),
  };
};
