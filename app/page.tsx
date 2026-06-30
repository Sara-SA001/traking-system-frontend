import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tracking_token")?.value;
  const role = cookieStore.get("tracking_role")?.value;

  if (!token) redirect("/login");

  if (role === "ADMIN") redirect("/admin");
  if (role === "TEACHER") redirect("/teacher");
  if (role === "STUDENT") redirect("/student");

  redirect("/login");
}
