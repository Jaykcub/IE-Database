import { redirect } from "next/navigation";

/** Landing route — jobs console is the primary surface after login */
export default function Home() {
  redirect("/jobs");
}
