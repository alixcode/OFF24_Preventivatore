import { redirect } from "next/navigation";

// La root reindirizza alla dashboard
export default function Home() {
  redirect("/dashboard");
}
