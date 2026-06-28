import { describe, expect, it } from "vitest";
import { formatRollFilmLine } from "./film";

describe("formatRollFilmLine", () => {
  const portra = {
    id: "1",
    brand: "Kodak",
    name: "Portra 400",
    iso: 400,
    type: "color",
    notes: null,
  };

  it("shows box speed when shot matches rated ISO", () => {
    expect(formatRollFilmLine(portra, 400)).toBe("Kodak Portra 400 · ISO 400");
  });

  it("shows shot at ISO when pushed/pulled", () => {
    expect(formatRollFilmLine(portra, 200)).toBe(
      "Kodak Portra 400 · shot at ISO 200",
    );
  });
});
