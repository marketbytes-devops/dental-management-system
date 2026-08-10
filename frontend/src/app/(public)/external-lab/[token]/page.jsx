"use client";

import { use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ExternalLabRedirectPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const token = params.token;
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (token) {
      const action = searchParams.get("action");
      const queryString = action ? `?action=${action}` : "";
      router.replace(`/external-lab/respond/${token}${queryString}`);
    }
  }, [token, router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-semibold text-slate-400">Redirecting to External Lab Portal...</p>
      </div>
    </div>
  );
}
