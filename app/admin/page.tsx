import Link from "next/link";

export default function AdminPage() {
  return <main className="min-h-screen bg-studio-bg p-8"><h1 className="font-display text-4xl">Admin</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{["Users","Templates","Assets","Exports"].map((item) => <Link key={item} href={"/admin/" + item.toLowerCase()} className="border border-studio-border bg-studio-panel p-6 font-semibold">{item}</Link>)}</div></main>;
}
