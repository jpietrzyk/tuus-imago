import { useList, useUpdate } from "@refinedev/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { Shield, ShieldOff } from "lucide-react";
import { useState } from "react";

type Profile = {
  id: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
};

type ProfileWithEmail = Profile & {
  email?: string;
};

export function AdminUsersPage() {
  const [toggling, setToggling] = useState<string | null>(null);
  const { mutate: updateProfile } = useUpdate();

  const { query, result } = useList<ProfileWithEmail>({
    resource: "profiles",
    pagination: { pageSize: 100 },
    sorters: [{ field: "created_at", order: "desc" }],
    meta: { select: "id,full_name,is_admin,created_at" },
  });

  const profiles = result?.data ?? [];

  const handleToggleAdmin = async (profile: ProfileWithEmail) => {
    if (toggling) return;
    const action = profile.is_admin ? "revoke admin" : "grant admin";
    if (!confirm(`Are you sure you want to ${action} for ${profile.full_name || profile.id}?`)) return;
    setToggling(profile.id);
    updateProfile(
      {
        resource: "profiles",
        id: profile.id,
        values: { is_admin: !profile.is_admin },
      },
      {
        onSuccess: () => setToggling(null),
        onError: () => setToggling(null),
      },
    );
  };

  if (query.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Admin Users</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No profiles found
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {profile.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.is_admin ? "default" : "secondary"}>
                        {profile.is_admin ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(profile.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={profile.is_admin ? "destructive" : "outline"}
                        disabled={toggling === profile.id}
                        onClick={() => handleToggleAdmin(profile)}
                      >
                        {profile.is_admin ? (
                          <>
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Revoke Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Grant Admin
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
