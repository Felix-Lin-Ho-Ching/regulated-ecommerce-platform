import { adminLoginAction } from "@/lib/admin/auth";
import { AlertPanel } from "@/components/common/panels";

export function AdminLoginForm({
  error,
  message,
  next,
}: {
  error?: string;
  message?: string;
  next?: string;
}) {
  return (
    <section className="card mx-auto max-w-xl p-6">
      {message ? (
        <div className="mb-4">
          <AlertPanel title="Admin message" tone="success">
            {message}
          </AlertPanel>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <AlertPanel title="Admin login issue" tone="danger">
            {error}
          </AlertPanel>
        </div>
      ) : null}
      <form action={adminLoginAction} className="grid gap-4">
        <input name="next" type="hidden" value={next || "/admin"} />
        <label className="block text-sm font-bold">
          Email
          <input className="input mt-2 focus-ring" name="email" type="email" />
        </label>
        <label className="block text-sm font-bold">
          Password
          <input className="input mt-2 focus-ring" name="password" type="password" />
        </label>
        <button className="btn btn-primary" type="submit">
          Log in to admin
        </button>
      </form>
    </section>
  );
}
