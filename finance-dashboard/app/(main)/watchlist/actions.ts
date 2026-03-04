"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getOrCreateWatchlist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("watchlists")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("watchlists")
    .insert({ user_id: userId, name: "My Watchlist", is_default: true })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create watchlist");
  return created.id;
}

export async function addToWatchlist(ticker: string, companyName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Ensure the stock exists in the reference table.
  // If the upsert is blocked by RLS, fall back to checking if it already exists.
  const { error: upsertError } = await supabase
    .from("stocks")
    .upsert({ ticker, company_name: companyName }, { onConflict: "ticker" });

  if (upsertError) {
    const { data: existingStock } = await supabase
      .from("stocks")
      .select("ticker")
      .eq("ticker", ticker)
      .maybeSingle();

    if (!existingStock) {
      throw new Error(
        `Unable to add ${ticker}: stock not found in the reference table and could not be created. Check your database RLS policies for the stocks table.`
      );
    }
  }

  const watchlistId = await getOrCreateWatchlist(supabase, user.id);

  // Prevent duplicates
  const { data: existing } = await supabase
    .from("watchlist_items")
    .select("id")
    .eq("watchlist_id", watchlistId)
    .eq("stock_ticker", ticker)
    .maybeSingle();

  if (existing) return { alreadyExists: true, itemId: existing.id };

  const { data: newItem, error } = await supabase
    .from("watchlist_items")
    .insert({ watchlist_id: watchlistId, stock_ticker: ticker })
    .select("id")
    .single();

  if (error || !newItem) throw new Error(error?.message ?? "Failed to add to watchlist");

  revalidatePath("/watchlist");
  return { success: true, itemId: newItem.id };
}

export async function removeFromWatchlist(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath("/watchlist");
}
