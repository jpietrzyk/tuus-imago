import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import { adminDataProvider } from "./data-provider";
import { adminAuthProvider } from "./auth-provider";
import type { ReactNode } from "react";

export function AdminApp({ children }: { children: ReactNode }) {
  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={adminDataProvider}
      authProvider={adminAuthProvider}
      resources={[
        {
          name: "dashboard",
          list: "/admin",
          meta: { label: "Dashboard" },
        },
        {
          name: "orders",
          list: "/admin/orders",
          show: "/admin/orders/:id",
          meta: { label: "Orders" },
        },
        {
          name: "coupons",
          list: "/admin/coupons",
          create: "/admin/coupons/new",
          edit: "/admin/coupons/:id/edit",
          show: "/admin/coupons/:id",
          meta: { label: "Coupons" },
        },
        {
          name: "partner_refs",
          list: "/admin/refs",
          show: "/admin/refs/:id",
          edit: "/admin/refs/:id/edit",
          meta: { label: "Referral Codes" },
        },
        {
          name: "partners",
          list: "/admin/partners",
          create: "/admin/partners/new",
          edit: "/admin/partners/:id/edit",
          show: "/admin/partners/:id",
          meta: { label: "Partners" },
        },
        {
          name: "picture_frames",
          list: "/admin/frames",
          create: "/admin/frames/new",
          edit: "/admin/frames/:id/edit",
          show: "/admin/frames/:id",
          meta: { label: "Frames" },
        },
        {
          name: "picture_canvases",
          list: "/admin/canvases",
          create: "/admin/canvases/new",
          edit: "/admin/canvases/:id/edit",
          show: "/admin/canvases/:id",
          meta: { label: "Canvases" },
        },
        {
          name: "customers",
          list: "/admin/customers",
          show: "/admin/customers/:email",
          meta: { label: "Customers" },
        },
        {
          name: "users",
          list: "/admin/users",
          show: "/admin/users/:id",
          meta: { label: "Users" },
        },
        {
          name: "admins",
          list: "/admin/admins",
          show: "/admin/admins/:id",
          meta: { label: "Admins" },
        },
        {
          name: "app_settings",
          list: "/admin/settings",
          meta: { label: "Settings" },
        },
        {
          name: "content_pages",
          list: "/admin/content",
          edit: "/admin/content/:id/edit",
          meta: { label: "Content" },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      {children}
    </Refine>
  );
}
