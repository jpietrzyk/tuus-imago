import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LegalPageLayout } from "@/components/legal-page-layout"

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}))

const defaultProps = {
  title: "Terms of Service",
  subtitle: "Please read carefully",
  lastUpdated: "2026-01-01",
  markdownContent: "# Hello\n\nThis is **bold** text.",
}

describe("LegalPageLayout", () => {
  it("renders title and subtitle", () => {
    render(<LegalPageLayout {...defaultProps} />)
    expect(screen.getByText("Terms of Service")).toBeInTheDocument()
    expect(screen.getByText("Please read carefully")).toBeInTheDocument()
  })

  it("renders markdown content", () => {
    render(<LegalPageLayout {...defaultProps} />)
    expect(screen.getByRole("heading", { name: "Hello", level: 1 })).toBeInTheDocument()
    expect(screen.getByText("bold")).toBeInTheDocument()
  })

  it("renders lastUpdated date", () => {
    render(<LegalPageLayout {...defaultProps} />)
    expect(screen.getByText(/Ostatnia aktualizacja: 2026-01-01/)).toBeInTheDocument()
  })

  it("renders back button that calls window.history.back()", async () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {})
    render(<LegalPageLayout {...defaultProps} />)
    const button = screen.getByRole("button", { name: "common.backToHome" })
    await userEvent.click(button)
    expect(backSpy).toHaveBeenCalledOnce()
    backSpy.mockRestore()
  })

  it("renders children when provided", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <div>Extra child content</div>
      </LegalPageLayout>
    )
    expect(screen.getByText("Extra child content")).toBeInTheDocument()
  })
})
