import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Plus, Trash2, Pencil } from "lucide-react";
import { t } from "@/locales/i18n";import {
  getCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  type CustomerAddress,
} from "@/lib/orders-api";
import { SHIPPING_COUNTRIES } from "@/lib/checkout-constants";

type AddressForm = {
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

const EMPTY_FORM: AddressForm = {
  label: "Home",
  name: "",
  phone: "",
  address: "",
  city: "",
  postal_code: "",
  country: "",
  is_default: false,
};

export function AddressesTab() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AddressForm & { id?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const data = await getCustomerAddresses();
      setAddresses(data);
    } catch {
      setError("Could not load addresses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);

    try {
      if (editing.id) {
        await updateCustomerAddress(editing.id, editing);
      } else {
        await createCustomerAddress(editing);
      }
      setEditing(null);
      await fetchAddresses();
    } catch {
      setError("Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    try {
      await deleteCustomerAddress(addressId);
      await fetchAddresses();
    } catch {
      setError("Could not delete address.");
    }
  };

  const handleEdit = (addr: CustomerAddress) => {
    setEditing({
      id: addr.id,
      label: addr.label,
      name: addr.name,
      phone: addr.phone ?? "",
      address: addr.address,
      city: addr.city,
      postal_code: addr.postal_code,
      country: addr.country,
      is_default: addr.is_default,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {editing.id ? t("account.editAddress") : t("account.addAddress")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="addr-label">{t("account.addressLabel")}</Label>
              <Input
                id="addr-label"
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-name">{t("auth.fullName")}</Label>
              <Input
                id="addr-name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-phone">{t("account.phone")}</Label>
              <Input
                id="addr-phone"
                type="tel"
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-address">{t("checkout.streetAddress")}</Label>
              <Input
                id="addr-address"
                value={editing.address}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-city">{t("checkout.city")}</Label>
              <Input
                id="addr-city"
                value={editing.city}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-postal">{t("checkout.postalCode")}</Label>
              <Input
                id="addr-postal"
                value={editing.postal_code}
                onChange={(e) => setEditing({ ...editing, postal_code: e.target.value })}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("checkout.country")}</Label>
              <Select
                value={editing.country}
                onValueChange={(value) => setEditing({ ...editing, country: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("checkout.selectCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="addr-default"
                type="checkbox"
                checked={editing.is_default}
                onChange={(e) =>
                  setEditing({ ...editing, is_default: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <Label htmlFor="addr-default">{t("account.defaultAddress")}</Label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {t("account.save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                {t("account.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          {t("account.addresses")}
        </h3>
        <Button
          size="sm"
          onClick={() => setEditing({ ...EMPTY_FORM })}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("account.addAddress")}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t("account.noAddresses")}</p>
          </CardContent>
        </Card>
      ) : (
        addresses.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{addr.label}</span>
                    {addr.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        {t("account.default")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{addr.name}</p>
                  <p className="text-sm text-gray-600">{addr.address}</p>
                  <p className="text-sm text-gray-600">
                    {addr.postal_code} {addr.city}
                  </p>
                  <p className="text-sm text-gray-600">{addr.country}</p>
                  {addr.phone && (
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(addr)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
