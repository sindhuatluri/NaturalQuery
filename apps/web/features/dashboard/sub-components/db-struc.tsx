import { Button } from "@/components/ui/button";
import { DatabaseType } from "@/features/database/create-db-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DbType,
  deleteDatabaseConnection,
  getDatabaseSchema,
  getDbConnection,
} from "@/features/http";
import { useParams, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import {
  ChevronDown,
  ChevronRight,
  FolderClosedIcon,
  InfoIcon,
  Loader2,
  PencilIcon,
  TableIcon,
  TrashIcon,
} from "lucide-react";
import { DatabaseConnectionForm } from "@/features/database/create-db-form";
import React, { useState } from "react";

type Column = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
};

type Table = {
  table_name: string;
  columns: Column[];
};

type Schema = {
  schema_name: string;
  tables: Table[] | null;
};

type DatabaseSchema = {
  database_structure: Schema[];
};

const TreeItem = ({
  label,
  icon: Icon,
  children,
  className,
  isExpandable,
}: {
  label: React.ReactNode;
  icon: React.ComponentType<any>;
  children?: React.ReactNode;
  className?: string;
  isExpandable?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <div
        className="flex items-center gap-2 py-1 cursor-pointer"
        onClick={() => isExpandable && setIsOpen(!isOpen)}
      >
        {isExpandable && (
          <div className="w-4 h-4">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {isOpen && <div className="pl-4">{children}</div>}
    </div>
  );
};

function DatabaseSchemaTree({ data }: { data: DatabaseSchema }) {
  const renderTable = (table: Table) => (
    <TreeItem
      key={table.table_name}
      label={<span className="font-medium">{table.table_name}</span>}
      icon={TableIcon}
      isExpandable={true}
    >
      {table.columns.map((column) => (
        <div
          key={column.column_name}
          className="py-0.5 text-sm flex justify-between ml-2 text-muted-foreground"
        >
          <p className="text-sm">{column.column_name}</p>
          <p className="font-mono text-[10px]">
            {column.data_type.split(" ")[0]}
          </p>
        </div>
      ))}
    </TreeItem>
  );

  return (
    <div className="rounded-lg border p-4">
      {data?.database_structure?.map((schema) => (
        <TreeItem
          key={schema.schema_name}
          label={<span className="font-semibold">{schema.schema_name}</span>}
          icon={FolderClosedIcon}
          isExpandable={!!schema.tables?.length}
        >
          {schema.tables?.map((table) => renderTable(table))}
        </TreeItem>
      ))}
    </div>
  );
}

const SkeletonTree = () => {
  return (
    <div className="rounded-lg border p-4 animate-pulse">
      {/* Simulate 3 schema sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-4">
          {/* Schema name skeleton */}
          <div className="flex items-center gap-2 py-1">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
          {/* Tables skeleton */}
          <div className="pl-8">
            {[1, 2].map((j) => (
              <div key={j} className="mb-3">
                {/* Table name skeleton */}
                <div className="flex items-center gap-2 py-1">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                {/* Columns skeleton */}
                <div className="pl-7">
                  {[1, 2, 3].map((k) => (
                    <div
                      key={k}
                      className="py-0.5 flex justify-between items-center"
                    >
                      <div className="h-3 w-20 bg-gray-200 rounded" />
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export function DatabaseSchema() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { dbId } = useParams();
  const { mutate: removeConnection, isPending: isDeleting } = useMutation({
    mutationFn: deleteDatabaseConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dbs"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      router.push("/");
    },
  });
  const { data: databaseStruct, isPending } = useQuery({
    queryKey: ["database-structure", dbId],
    queryFn: () => getDatabaseSchema(dbId as string),
  });

  const { data: dbConnection } = useQuery({
    queryKey: ["db", dbId],
    queryFn: () => getDbConnection(dbId as string),
  });

  const [editOpen, setEditOpen] = useState(false);

  const onDelete = () => {
    removeConnection(dbId as string);
  };

  const getInitialValues = (): { type: DatabaseType; displayName: string } | undefined => {
    if (!dbConnection?.data) return undefined;

    return {
      type: dbConnection.data.type as DatabaseType,
      displayName: dbConnection.data.name,
    };
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="ml-4 mb-2 flex items-center gap-1">
          <p className="text-sm"> {dbConnection?.data?.name} </p>
          <Button className="w-min z-10" variant="ghost">
            <InfoIcon size={12} />
          </Button>
        </div>
      </SheetTrigger>
      <SheetContent className="w-[540px] mt-4 lg:w-[750px]">
        <SheetHeader>
          <div className="flex items-center mt-6 justify-between">
            <SheetTitle>Database Info</SheetTitle>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PencilIcon className="w-4 h-4 mr-2" /> Edit Connection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-content overflow-y-auto">
                <DialogTitle />
                <DatabaseConnectionForm
                  type={dbConnection?.data?.type as DatabaseType}
                  initialValues={getInitialValues()}
                  connectionId={dbId as string}
                  onSuccess={() => setEditOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <SheetDescription>
            View the complete database structure and table relationships
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {isPending ? (
            <SkeletonTree />
          ) : (
            <DatabaseSchemaTree
              data={
                databaseStruct?.data ??
                ({ database_structure: [] } as DatabaseSchema)
              }
            />
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isDeleting}
                className="mt-4"
                variant="destructive"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin " />
                  </>
                ) : (
                  <>
                    <TrashIcon /> Remove connection
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
