import Link from "next/link";
import { loginAction, signupAction } from "@/lib/auth/actions";
import { AlertPanel } from "@/components/common/panels";

export function SignupForm({ error, next }: { error?: string; next?: string }) {
  return (
    <section className="card mx-auto max-w-xl p-6">
      {error ? (
        <div className="mb-4">
          <AlertPanel title="Sign-up issue" tone="danger">
            {error}
          </AlertPanel>
        </div>
      ) : null}
      <form action={signupAction} className="grid gap-4">
        <input name="next" type="hidden" value={next || "/account"} />
        <label className="block text-sm font-bold">
          Full name
          <input className="input mt-2 focus-ring" name="name" />
        </label>
        <label className="block text-sm font-bold">
          Email
          <input className="input mt-2 focus-ring" name="email" type="email" />
        </label>
        <label className="block text-sm font-bold">
          Password
          <input className="input mt-2 focus-ring" name="password" type="password" />
        </label>
        <button className="btn btn-primary" type="submit">
          Create account
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-black text-teal-900" href="/account/login">
          Log in
        </Link>
      </p>
    </section>
  );
}

export function LoginForm({
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
          <AlertPanel title="Account message" tone="success">
            {message}
          </AlertPanel>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <AlertPanel title="Login issue" tone="danger">
            {error}
          </AlertPanel>
        </div>
      ) : null}
      <form action={loginAction} className="grid gap-4">
        <input name="next" type="hidden" value={next || "/account"} />
        <label className="block text-sm font-bold">
          Email
          <input className="input mt-2 focus-ring" name="email" type="email" />
        </label>
        <label className="block text-sm font-bold">
          Password
          <input className="input mt-2 focus-ring" name="password" type="password" />
        </label>
        <button className="btn btn-primary" type="submit">
          Log in
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        New to Stun Fry?{" "}
        <Link className="font-black text-teal-900" href="/account/signup">
          Create an account
        </Link>
      </p>
    </section>
  );
}
