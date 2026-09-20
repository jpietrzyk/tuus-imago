import { useRef, useState } from "react"
import { AlertCircle, Upload } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { HONEYPOT_FIELD_A, HONEYPOT_FIELD_B } from "@/lib/honeypot-fields"
import { t } from "@/locales/i18n"

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  orderNumber: "",
  orderDate: "",
  product: "",
  complaintType: "",
  description: "",
  resolution: "",
  consent: false,
}

type FormState = typeof INITIAL_FORM

export function ComplaintPage() {
  const page = getPageBySlug("complaint")
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  )
  const honeypotARef = useRef<HTMLInputElement>(null)
  const honeypotBRef = useRef<HTMLInputElement>(null)

  const updateField =
    (field: keyof FormState) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value =
        event.target instanceof HTMLInputElement &&
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value
      setForm((previous) => ({ ...previous, [field]: value }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("submitting")

    // Read the honeypot inputs from the DOM (not React state) so values that
    // bot scripts inject are still submitted to the server for inspection.
    const honeypotData = new FormData(event.currentTarget)
    if (honeypotARef.current) honeypotARef.current.value = ""
    if (honeypotBRef.current) honeypotBRef.current.value = ""

    try {
      const response = await fetch("/.netlify/functions/submit-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          address: form.address || undefined,
          orderNumber: form.orderNumber,
          orderDate: form.orderDate || undefined,
          product: form.product || undefined,
          complaintType: form.complaintType,
          description: form.description,
          resolution: form.resolution || undefined,
          [HONEYPOT_FIELD_A]: String(honeypotData.get(HONEYPOT_FIELD_A) ?? ""),
          [HONEYPOT_FIELD_B]: String(honeypotData.get(HONEYPOT_FIELD_B) ?? ""),
        }),
      })

      if (!response.ok) {
        throw new Error(t("complaint.form.error"))
      }

      setForm(INITIAL_FORM)
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  return (
    <ContentPageShell page={page}>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">{t("complaint.form.title")}</h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              {t("complaint.form.customerInfo.title")}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t("complaint.form.name.label")} *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("complaint.form.name.placeholder")}
                  value={form.name}
                  onChange={updateField("name")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("complaint.form.email.label")} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("complaint.form.email.placeholder")}
                  value={form.email}
                  onChange={updateField("email")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t("complaint.form.phone.label")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t("complaint.form.phone.placeholder")}
                  value={form.phone}
                  onChange={updateField("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">
                  {t("complaint.form.address.label")}
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder={t("complaint.form.address.placeholder")}
                  value={form.address}
                  onChange={updateField("address")}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              {t("complaint.form.orderInfo.title")}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">
                  {t("complaint.form.orderNumber.label")} *
                </Label>
                <Input
                  id="orderNumber"
                  type="text"
                  placeholder={t("complaint.form.orderNumber.placeholder")}
                  value={form.orderNumber}
                  onChange={updateField("orderNumber")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderDate">
                  {t("complaint.form.orderDate.label")}
                </Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={form.orderDate}
                  onChange={updateField("orderDate")}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              {t("complaint.form.productInfo.title")}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="product">
                {t("complaint.form.product.label")}
              </Label>
              <Input
                id="product"
                type="text"
                placeholder={t("complaint.form.product.placeholder")}
                value={form.product}
                onChange={updateField("product")}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              {t("complaint.form.details.title")}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="complaintType">
                {t("complaint.form.type.label")} *
              </Label>
              <select
                id="complaintType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.complaintType}
                onChange={updateField("complaintType")}
                required
              >
                <option value="">
                  {t("complaint.form.type.select")}
                </option>
                <option value="damaged">
                  {t("complaint.form.type.damaged")}
                </option>
                <option value="defective">
                  {t("complaint.form.type.defective")}
                </option>
                <option value="wrong">
                  {t("complaint.form.type.wrong")}
                </option>
                <option value="missing">
                  {t("complaint.form.type.missing")}
                </option>
                <option value="quality">
                  {t("complaint.form.type.quality")}
                </option>
                <option value="other">
                  {t("complaint.form.type.other")}
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                {t("complaint.form.description.label")} *
              </Label>
              <Textarea
                id="description"
                placeholder={t("complaint.form.description.placeholder")}
                rows={5}
                value={form.description}
                onChange={updateField("description")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution">
                {t("complaint.form.resolution.label")}
              </Label>
              <Textarea
                id="resolution"
                placeholder={t("complaint.form.resolution.placeholder")}
                rows={3}
                value={form.resolution}
                onChange={updateField("resolution")}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              {t("complaint.form.photos.title")}
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">
                {t("complaint.form.photos.description")}
              </p>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-gray-500" />
                <label className="cursor-pointer">
                  <span className="text-sm text-blue-600 hover:text-blue-800">
                    {t("complaint.form.photos.upload")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t("complaint.form.photos.note")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="mt-1"
                checked={form.consent}
                onChange={updateField("consent")}
              />
              <span className="text-sm text-gray-700">
                {t("complaint.form.consent.label")}
              </span>
            </label>
          </div>

          {status === "success" && (
            <p role="status" className="text-sm text-green-700">
              {t("complaint.form.success")}
            </p>
          )}

          {status === "error" && (
            <p role="alert" className="text-sm text-red-700">
              {t("complaint.form.error")}
            </p>
          )}

          {/* Honeypot: off-screen with opaque names so browser/password-manager
              autofill ignores them, while bots that fill every input trip it. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-9999px",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            <input
              ref={honeypotARef}
              id={HONEYPOT_FIELD_A}
              name={HONEYPOT_FIELD_A}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              defaultValue=""
            />
            <input
              ref={honeypotBRef}
              id={HONEYPOT_FIELD_B}
              name={HONEYPOT_FIELD_B}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              defaultValue=""
            />
          </div>

          <Button type="submit" className="w-full" disabled={status === "submitting"}>
            {status === "submitting"
              ? t("complaint.form.submitting")
              : t("complaint.form.submit")}
          </Button>
        </form>
      </section>
    </ContentPageShell>
  )
}
