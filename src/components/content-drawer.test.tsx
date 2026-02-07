import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContentDrawer } from "./content-drawer";
import { Button } from "@/components/ui/button";

describe("ContentDrawer", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ContentDrawer open={true}>
        <div>Test content</div>
      </ContentDrawer>,
    );
    expect(container).toBeDefined();
  });

  it("renders with custom trigger button", () => {
    render(
      <ContentDrawer trigger={<Button variant="ghost">Open Content</Button>}>
        <div>Test content</div>
      </ContentDrawer>,
    );
    expect(screen.getByText("Open Content")).toBeDefined();
  });

  it("renders with controlled open state", () => {
    const onOpenChange = vi.fn();
    render(
      <ContentDrawer open={true} onOpenChange={onOpenChange}>
        <div>Test content</div>
      </ContentDrawer>,
    );
    expect(screen.getByText("Test content")).toBeDefined();
  });

  it("displays custom title", () => {
    render(
      <ContentDrawer open={true} title="Custom Title">
        <div>Test content</div>
      </ContentDrawer>,
    );
    expect(screen.getByText("Custom Title")).toBeDefined();
  });

  it("displays default title when not provided", () => {
    render(
      <ContentDrawer open={true}>
        <div>Test content</div>
      </ContentDrawer>,
    );
    expect(screen.getByText("Content")).toBeDefined();
  });

  it("renders children content", () => {
    render(
      <ContentDrawer open={true}>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </ContentDrawer>,
    );
    expect(screen.getByText("Paragraph 1")).toBeDefined();
    expect(screen.getByText("Paragraph 2")).toBeDefined();
  });

  it("handles onOpenChange callback when trigger is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <ContentDrawer
        open={false}
        onOpenChange={onOpenChange}
        trigger={<Button>Open Drawer</Button>}
      >
        <div>Test content</div>
      </ContentDrawer>,
    );

    const triggerButton = screen.getByText("Open Drawer");
    fireEvent.click(triggerButton);
    expect(onOpenChange).toHaveBeenCalled();
  });

  it("renders close button", () => {
    render(
      <ContentDrawer open={true}>
        <div>Test content</div>
      </ContentDrawer>,
    );
    // Check for close icon (X)
    const closeIcon = document.querySelector(".lucide-x");
    expect(closeIcon).not.toBeNull();
  });
});
