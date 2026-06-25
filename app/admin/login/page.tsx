import { redirect } from "next/navigation";

function appendParam(params: URLSearchParams, name: string, value?: string) {
  if (value) {
    params.set(name, value);
  }
}

export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  appendParam(params, "next", sp.next);
  appendParam(params, "error", sp.error);
  appendParam(params, "message", sp.message);

  const query = params.toString();
  redirect(query ? `/staff/login?${query}` : "/staff/login");
}
