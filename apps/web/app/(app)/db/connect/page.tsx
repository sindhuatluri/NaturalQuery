import { DBS } from "@/components/db-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="container items-start flex flex-1 flex-col gap-4 p-4 pt-0">
        <Button asChild className="pl-0 gap-4" variant="link">
          <Link href="/">
            <ArrowLeftIcon className="w-4" /> Back
          </Link>
        </Button>

        <div className="gap-y-4">
          <h3 className="text-lg font-semibold">Connect your database</h3>
          <p className="text-sm text-muted-foreground">
            Connect to start querying your database
          </p>
        </div>
        <div className="flex w-full flex-1 flex-col gap-4">
          <div className="grid auto-rows-min gap-4 mt-4 md:grid-cols-3">
            {DBS.map((db) => (
              <Link href={`connect/${db.path}`} key={db.name}>
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
            ))}
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </div>
    </div>
  );
}
