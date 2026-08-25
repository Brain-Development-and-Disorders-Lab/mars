import React from "react";

// Testing imports
import { screen } from "@testing-library/react";
import { render } from "../render";

// Target component
import TagTimestamp from "../../src/components/TagTimestamp";

const renderTimestampTag = (props: React.ComponentProps<typeof TagTimestamp>) => {
  return render(<TagTimestamp {...props} />);
};

describe("TagTimestamp Component", () => {
  describe("Basic Rendering", () => {
    it("renders with valid timestamp", () => {
      renderTimestampTag({ timestamp: "2023-10-15T10:00:00Z" });
      expect(screen.getByText("Timestamp")).toBeTruthy();
    });

    it("renders with custom description", () => {
      renderTimestampTag({
        timestamp: "2023-10-15T10:00:00Z",
        description: "Created",
      });
      expect(screen.getByText("Created")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string timestamp", () => {
      renderTimestampTag({ timestamp: "" });
      expect(screen.getByText("No Timestamp")).toBeTruthy();
    });

    it("handles invalid timestamp format", () => {
      renderTimestampTag({ timestamp: "invalid-date" });
      expect(screen.getByText("No Timestamp")).toBeTruthy();
    });

    it("handles future dates", () => {
      const futureDate = "2099-12-31T10:00:00Z";
      renderTimestampTag({ timestamp: futureDate });
      expect(screen.getByText("Timestamp")).toBeTruthy();
    });

    it("handles past dates", () => {
      const pastDate = "2000-01-01T10:00:00Z";
      renderTimestampTag({ timestamp: pastDate });
      expect(screen.getByText("Timestamp")).toBeTruthy();
    });

    it("handles ISO format timestamps", () => {
      renderTimestampTag({ timestamp: "2023-10-15T10:30:45.123Z" });
      expect(screen.getByText("Timestamp")).toBeTruthy();
    });

    it("handles date-only format", () => {
      renderTimestampTag({ timestamp: "2023-10-15" });
      expect(screen.getByText("Timestamp")).toBeTruthy();
    });
  });
});
