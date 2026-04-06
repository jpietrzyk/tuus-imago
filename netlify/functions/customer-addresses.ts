import { getAuthenticatedUser, createServiceClient } from "./_shared/supabase-auth";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
};

type AddressInput = {
  label?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
};

function validateAddress(input: AddressInput): string | null {
  if (!input.name?.trim()) return "Name is required.";
  if (!input.address?.trim()) return "Address is required.";
  if (!input.city?.trim()) return "City is required.";
  if (!input.postal_code?.trim()) return "Postal code is required.";
  if (!input.country?.trim()) return "Country is required.";
  return null;
}

export const handler = async (event: NetlifyEvent) => {
  const authResult = await getAuthenticatedUser(event);
  if ("error" in authResult) return authResult.error;

  const userId = authResult.user.id;
  const supabase = createServiceClient();

  if (event.httpMethod === "GET") {
    const { data: addresses, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not fetch addresses." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ addresses }),
    };
  }

  if (event.httpMethod === "POST") {
    let input: AddressInput;
    try {
      input = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request payload." }),
      };
    }

    const validationError = validateAddress(input);
    if (validationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: validationError }),
      };
    }

    if (input.is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true);
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .insert({
        user_id: userId,
        label: input.label?.trim() || "Home",
        name: input.name!.trim(),
        phone: input.phone?.trim() || null,
        address: input.address!.trim(),
        city: input.city!.trim(),
        postal_code: input.postal_code!.trim(),
        country: input.country!.trim(),
        is_default: input.is_default ?? false,
      })
      .select()
      .single();

    if (error || !address) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not create address." }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ address }),
    };
  }

  if (event.httpMethod === "PATCH") {
    let input: AddressInput & { id?: string };
    try {
      input = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request payload." }),
      };
    }

    const addressId = input.id;
    if (!addressId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing address id." }),
      };
    }

    if (input.is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true);
    }

    const updateFields: Record<string, unknown> = {};
    if (input.label !== undefined) updateFields.label = input.label.trim();
    if (input.name !== undefined) updateFields.name = input.name.trim();
    if (input.phone !== undefined) updateFields.phone = input.phone.trim() || null;
    if (input.address !== undefined) updateFields.address = input.address.trim();
    if (input.city !== undefined) updateFields.city = input.city.trim();
    if (input.postal_code !== undefined) updateFields.postal_code = input.postal_code.trim();
    if (input.country !== undefined) updateFields.country = input.country.trim();
    if (input.is_default !== undefined) updateFields.is_default = input.is_default;

    const { data: address, error } = await supabase
      .from("addresses")
      .update(updateFields)
      .eq("id", addressId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !address) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not update address." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ address }),
    };
  }

  if (event.httpMethod === "DELETE") {
    const addressId = event.queryStringParameters?.["id"];
    if (!addressId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing address id." }),
      };
    }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not delete address." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
