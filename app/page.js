
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

// Existing dashboard data and design will remain here.
// Authentication protection is handled before showing dashboard.

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      setUser(data.session.user);
      setChecking(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
  }

  if (checking) {
    return (
      <main style={{
        minHeight: "100dvh",
        background: "#080d15",
        color: "white",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial"
      }}>
        Checking your session...
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100dvh",
      background: "#080d15",
      color: "white",
      padding: 20,
      fontFamily: "Arial"
    }}>
      <h2>CreatorOS Authentication</h2>
      <p>Logged in as: {user?.email}</p>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        style={{
          background: "#2789ef",
          color: "white",
          padding: "12px 20px",
          border: 0,
          borderRadius: 8,
          marginTop: 15
        }}
      >
        {loggingOut ? "Logging out..." : "Logout"}
      </button>
    </main>
  );
}
