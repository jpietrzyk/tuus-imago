import { useOne, useUpdate } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

type Partner = {
  id: string;
  company_name: string;
  contact_name: string | null;
  nip: string | null;
  contact_email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

function usePartnerFormState() {
  const [dirty, setDirty] = useState<Record<string, string>>({});

  const get = (field: string, fallback: string): string => {
    if (field in dirty) return dirty[field];
    return fallback;
  };

  const set = (field: string, value: string) => {
    setDirty((prev) => ({ ...prev, [field]: value }));
  };

  return { get, set };
}

export function PartnerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updatePartner } = useUpdate();

  const { query: partnerQuery, result: partner } = useOne<Partner>({
    resource: "partners",
    id: id ?? "",
  });

  const form = usePartnerFormState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const companyName = form.get("company_name", partner?.company_name ?? "");
  const contactName = form.get("contact_name", partner?.contact_name ?? "");
  const nip = form.get("nip", partner?.nip ?? "");
  const contactEmail = form.get("contact_email", partner?.contact_email ?? "");
  const phone = form.get("phone", partner?.phone ?? "");
  const city = form.get("city", partner?.city ?? "");
  const address = form.get("address", partner?.address ?? "");
  const notes = form.get("notes", partner?.notes ?? "");
  const isActive = form.get("is_active", partner?.is_active != null ? String(partner.is_active) : "true") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    updatePartner(
      {
        resource: "partners",
        id,
        values: {
          company_name: companyName.trim(),
          contact_name: contactName.trim() || null,
          nip: nip.trim() || null,
          contact_email: contactEmail.trim() || null,
          phone: phone.trim() || null,
          city: city.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          is_active: isActive,
        },
      },
      {
        onSuccess: () => {
          setSaving(false);
          setSuccess(true);
        },
        onError: (err) => {
          setError(err?.message ?? "Update failed");
          setSaving(false);
        },
      },
    );
  };

  if (partnerQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!partner) {
    return <div className="text-center py-12 text-muted-foreground">Partner not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/partners/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Partner</h1>
        <Badge variant={partner.is_active ? "default" : "secondary"} className="ml-2">
          {partner.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">Partner updated.</div>}

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={companyName} onChange={(e) => form.set("company_name", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" value={contactName} onChange={(e) => form.set("contact_name", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP (Tax ID)</Label>
                <Input id="nip" value={nip} onChange={(e) => form.set("nip", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => form.set("contact_email", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => form.set("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => form.set("city", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => form.set("address", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => form.set("notes", e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => form.set("is_active", String(e.target.checked))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/admin/partners/${id}`)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
