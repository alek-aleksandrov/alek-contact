import { describe, it, expect } from "vitest";

import { renderSkills, renderSummary, renderProjects } from "./profile-render";
import { site } from "./site";

describe("profile-render", () => {
  it("renderSkills emits the heading and a known skill", () => {
    const md = renderSkills();
    expect(md).toContain("# Skills");
    expect(md).toContain("Angular");
  });

  it("renderSummary includes the full name and the Bio section", () => {
    const md = renderSummary();
    expect(md).toContain(site.fullName);
    expect(md).toContain("## Bio");
  });

  it("renderProjects lists a known project title", () => {
    expect(renderProjects()).toContain("Ask About Alek");
  });
});
