"use client";

import { dbTypeToIcon } from "@/components/db-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { getDatabaseConnections } from "@/features/http";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const { data, isPending } = useQuery({
    queryKey: ["dbs"],
    queryFn: getDatabaseConnections,
    retry: true,
  });

  const DBS =
    data?.data?.map?.((db) => ({
      id: db.id,
      name: db.name,
      desc: db.type,
      icon: dbTypeToIcon(db.type),
    })) ?? [];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="container items-start flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="w-full items-baseline justify-between flex flex-row">
          <div className="gap-y-4">
            <h3 className="text-lg font-semibold">Databases</h3>
            {isPending ? (
              <Skeleton className="h-3 w-[250px] mt-2" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {DBS.length > 0
                  ? "Your connected datasources ready to chat"
                  : "Connect a new database to get started"}
              </p>
            )}
          </div>

          <Button asChild variant="secondary" className="rounded-full p-5">
            <Link href="/db/connect">
              Connect databse
              <ChevronRightIcon className="w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex w-full flex-1 flex-col gap-4">
          <div className="grid auto-rows-min gap-4 mt-4 md:grid-cols-3">
            {isPending ? (
              // Skeleton loading state
              <>
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="rounded-xl bg-sidebar border-[0.5px] border-gray-50/10 flex flex-col gap-6 p-5 shadow-none"
                  >
                    <Skeleton className="w-[44px] h-[44px] rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-[140px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </Card>
                ))}
              </>
            ) : DBS.length === 0 ? (
              <Link href="/db/connect">
                <Card className="rounded-xl bg-sidebar border-[0.5px] border-gray-50/10 flex flex-row gap-6 p-5 items-center justify-between shadow-none cursor-pointer hover:border-gray-50/30">
                  <div>
                    <h4 className="text-md font-medium text-sidebar-foreground">
                      Create a new database
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Start by connecting a new database
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4" />
                </Card>
              </Link>
            ) : (
              DBS.map((db) => (
                <Link href={`/db/${db.id}`} key={db.id}>
                  <Card className="rounded-xl bg-sidebar border-[0.5px] border-gray-50/10 flex flex-col gap-6 p-5 shadow-none cursor-pointer hover:border-gray-50/30">
                    <div className="w-[44px] bg-muted-foreground/10 text-muted-foreground rounded-md flex items-center justify-center h-[44px]">
                      {db.icon}
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-sidebar-foreground">
                        {db.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{db.desc}</p>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </div>
    </div>
  );
}
