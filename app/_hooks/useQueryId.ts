"use client";

import { useState } from "react";

export function useQueryId(): {
  id: number;
  setId: (id: number) => void;
} {
  const [id, setId] = useState(() => {
    if (typeof window === "undefined") return 0;
    const params = new URLSearchParams(window.location.search);
    const parsed = parseInt(params.get("id") ?? "0", 10);
    return isNaN(parsed) ? 0 : parsed;
  });

  return { id, setId };
}
