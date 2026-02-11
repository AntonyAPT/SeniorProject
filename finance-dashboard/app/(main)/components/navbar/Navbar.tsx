import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import styles from "./navbar.module.css";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile with avatar_url
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user?.id)
    .single();

  const displayName =
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User";
  const avatarUrl = profile?.avatar_url || null;

  return (
    <nav className={styles.navbar}>
      {/* Logo with blue square and gradient text */}
      <div className="flex items-center gap-3">
        {/* <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center font-bold text-xl">
          S
        </div> */}
        <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          [ STONKS ]
        </span>
      </div>

      <NavLinks />
      <UserMenu avatarUrl={avatarUrl} username={displayName} />
    </nav>
  );
}
