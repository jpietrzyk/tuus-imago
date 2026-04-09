import { useOne, useCustom } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/pricing";
import { formatDateTime } from "@/lib/format";
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  FileText,
  Tag,
  BarChart3,
  Pencil,
} from "lucide-react";

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
  updated_at: string;
};

type PartnerCoupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  used_count: number;
  is_active: boolean;
};

type PartnerStatDetail = {
  partner_id: string;
  coupon_count: number;
  coupons: PartnerCoupon[];
  total_orders: number;
  total_revenue: number;
  last_order_date: string | null;
};

function unwrapData<T>(raw: unknown): T | null {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as Record<string, unknown>).data as T;
  }
  if (raw) return raw as T;
  return null;
}

export function PartnerShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { query: partnerQuery, result: partner } = useOne<Partner>({
    resource: "partners",
    id: id ?? "",
    meta: { select: "*" },
  });

  const { result: statsResult } = useCustom<PartnerStatDetail>({
    url: "/.netlify/functions/admin-api",
    method: "post",
    config: {
      payload: {
        resource: "orders",
        meta: { aggregateFunction: "partner_stats", groupBy: id },
      },
    },
  });

  const stats = unwrapData<PartnerStatDetail>(statsResult.data);

  if (partnerQuery.isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Partner not found.</p>
        <Button variant="outline" onClick={() => navigate("/admin/partners")} className="mt-4">
          Back to Partners
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/partners")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{partner.company_name}</h1>
          <p className="text-sm text-muted-foreground">
            Created {formatDateTime(partner.created_at)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={partner.is_active ? "default" : "secondary"}>
            {partner.is_active ? "Active" : "Inactive"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/partners/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{stats?.total_orders ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{formatPrice(stats?.total_revenue ?? 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{stats?.coupon_count ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Coupons</p>
                </div>
              </div>
              {stats?.last_order_date && (
                <p className="text-sm text-muted-foreground mt-3">
                  Last order: {formatDateTime(stats.last_order_date)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" /> Coupons ({stats?.coupons.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.coupons.length ? (
                <p className="text-sm text-muted-foreground">No coupons assigned</p>
              ) : (
                <div className="space-y-2">
                  {stats.coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center gap-3 p-2 rounded-md border">
                      <span className="font-mono font-medium text-sm">{coupon.code}</span>
                      <Badge variant="outline">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : `${Number(coupon.discount_value).toFixed(2)} PLN`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Used {coupon.used_count}x
                      </span>
                      <Badge variant={coupon.is_active ? "default" : "secondary"} className="ml-auto">
                        {coupon.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Company:</span> {partner.company_name}</p>
              {partner.nip && <p><span className="font-medium">NIP:</span> {partner.nip}</p>}
              {partner.contact_email && <p><span className="font-medium">Email:</span> {partner.contact_email}</p>}
              {partner.phone && <p><span className="font-medium">Phone:</span> {partner.phone}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {partner.contact_name ? (
                <p>{partner.contact_name}</p>
              ) : (
                <p className="text-muted-foreground">No contact name</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {partner.address && <p>{partner.address}</p>}
              {partner.city && <p>{partner.city}</p>}
              {!partner.address && !partner.city && (
                <p className="text-muted-foreground">No address</p>
              )}
            </CardContent>
          </Card>

          {partner.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">
                {partner.notes}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p>Created: {formatDateTime(partner.created_at)}</p>
              <Separator className="my-2" />
              <p>Updated: {formatDateTime(partner.updated_at)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
