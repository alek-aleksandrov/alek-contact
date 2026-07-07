import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourcesPanel } from "./sources-panel";

describe("SourcesPanel", () => {
  it("renders each citation with company, title, source label, and link", () => {
    render(
      <SourcesPanel
        citations={[
          {
            id: "greenhouse:acme:1",
            source: "greenhouse",
            company: "Acme",
            title: "Senior Software Engineer",
            url: "https://x/1",
            score: 0.82,
          },
        ]}
      />,
    );
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Senior Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Greenhouse")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://x/1");
  });

  it("renders nothing when there are no citations", () => {
    const { container } = render(<SourcesPanel citations={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders workplace/salary/department chips when present", () => {
    render(
      <SourcesPanel
        citations={[
          {
            id: "greenhouse:stripe:1",
            source: "greenhouse",
            company: "Stripe",
            title: "Senior Software Engineer",
            url: "https://x",
            score: 0.82,
            workplace: "Remote",
            salary: "$180k–$240k",
            department: "Payments",
          },
        ]}
      />,
    );
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("$180k–$240k")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
  });
});
