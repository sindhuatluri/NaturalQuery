import {
  DatabaseConnectionForm,
  DatabaseType,
} from "@/features/database/create-db-form";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  if (!["postgres", "mysql", "mssql"].includes(params.slug)) {
    redirect("/db/connect");
  }

  return <DatabaseConnectionForm type={params.slug as DatabaseType} />;
}
