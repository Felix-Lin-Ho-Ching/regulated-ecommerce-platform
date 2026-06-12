import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button className="btn btn-secondary" type="submit">
        Log out
      </button>
    </form>
  );
}
