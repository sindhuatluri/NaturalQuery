"use client";

import * as React from "react";
import { Bot, GalleryVerticalEnd } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { deleteChat, getChats, getDatabaseConnections } from "@/features/http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  const { data: dbs } = useQuery({
    queryKey: ["dbs"],
    queryFn: getDatabaseConnections,
  });

  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: getChats,
  });

  const queryClient = useQueryClient();

  const { mutate: deleteChatWithId } = useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
    },
  });

  const DBS =
    dbs?.data?.map?.((db) => ({
      title: db.name,
      url: `/db/${db.id}`,
    })) ?? [];

  const chatsData =
    chats?.data?.map?.((chat) => ({
      id: chat.id,
      name: chat.name,
      url: `/db/${chat.dbConnectionId}/chat/${chat.id}`,
    })) ?? [];

  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Default Workspace",
        logo: GalleryVerticalEnd,
        plan: "Pro",
      },
    ],
    navMain: [
      {
        title: "Databases",
        url: "/",
        icon: Bot,
        items: [
          ...DBS,
          {
            title: "Connect a database",
            url: "/db/connect",
          },
        ],
      },
    ],
    conversations: chatsData,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects
          onDelete={deleteChatWithId}
          projects={data.conversations}
        />
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              email: user?.emailAddresses[0].emailAddress ?? "",
              name: user?.fullName ?? "",
              avatar: user?.imageUrl ?? "",
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
