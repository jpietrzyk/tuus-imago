import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HomeUploadEntryPage } from "./home-upload-entry";
import { tr } from "@/test/i18n-test";

describe("HomeUploadEntryPage Component", () => {
  it("should render the upload CTA link", () => {
    render(
      <MemoryRouter>
        <HomeUploadEntryPage />
      </MemoryRouter>,
    );

    const uploadLink = screen.getByRole("link", {
      name: tr("homeUploadEntry.ctaText"),
    });
    expect(uploadLink).toBeInTheDocument();
    expect(uploadLink).toHaveAttribute("href", "/upload");
  });

  it("should render the camera icon", () => {
    render(
      <MemoryRouter>
        <HomeUploadEntryPage />
      </MemoryRouter>,
    );

    const cameraIcon = document.querySelector("svg");
    expect(cameraIcon).toBeInTheDocument();
  });

  it("should render the how it works link", () => {
    render(
      <MemoryRouter>
        <HomeUploadEntryPage />
      </MemoryRouter>,
    );

    const howItWorksLink = screen.getByRole("link", {
      name: tr("homeUploadEntry.howItWorksLink"),
    });
    expect(howItWorksLink).toBeInTheDocument();
    expect(howItWorksLink).toHaveAttribute("href", "/how-it-works");
  });

  it("should render the CTA text", () => {
    render(
      <MemoryRouter>
        <HomeUploadEntryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("homeUploadEntry.ctaText"))).toBeInTheDocument();
  });
});
