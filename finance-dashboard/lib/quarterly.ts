import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { QuarterlyFundamentalRow } from "@/types/quarterly";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function getQuarterlyFundamentals(ticker: string) {
  const tic = ticker.trim().toUpperCase();

  if (!tic) {
    return [] satisfies QuarterlyFundamentalRow[];
  }

  const { data, error } = await supabase
    .from("quarterly_fundamentals")
    .select("tic,datadate,fyearq,fqtr,revtq,niq,epspxq,atq,ltq,dlttq,dlcq")
    .eq("tic", tic)
    .order("datadate", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as QuarterlyFundamentalRow[];
}
