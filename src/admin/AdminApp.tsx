import { Refine } from "@refinedev/core";
import { adminDataProvider } from "./data-provider";
import { adminAuthProvider } from "./auth-provider";

export function AdminApp() {
  return (
    <Refine
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
          name: "customers",
          list: "/admin/customers",
          show: "/admin/customers/:email",
          meta: { label: "Customers" },
        },
        {
          name: "admin-users",
          list: "/admin/admin-users",
          meta: { label: "Admin Users" },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    />
  );
}
