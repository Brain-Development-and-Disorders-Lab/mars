// Target functions
import {
  getBaseIdentifierFormatHelperText,
  getCustomIdentifierFormatHelperText,
  isValidBaseIdentifierFormat,
  isValidCustomIdentifierFormat,
} from "../../src/lib/util";

// Custom types
import { IdentifierFormatModel } from "../../../types";

// Build an `IdentifierFormatModel`, overriding only the fields relevant to a given test
const createFormat = (overrides: Partial<IdentifierFormatModel> = {}): IdentifierFormatModel => ({
  _id: "identifier-format-id",
  name: "Test Format",
  created: "2026-01-01T00:00:00.000Z",
  workspace: "workspace-id",
  fixedLength: 6,
  alphanumericOnly: true,
  lettersOnly: false,
  numbersOnly: false,
  allowSpecialCharacters: false,
  uppercaseRequired: false,
  ...overrides,
});

describe("isValidCustomIdentifierFormat", () => {
  describe("Length requirements", () => {
    it("accepts a value matching the fixed length", () => {
      expect(isValidCustomIdentifierFormat("abc123", createFormat({ fixedLength: 6 }))).toBeTruthy();
    });

    it("rejects a value shorter than the fixed length", () => {
      expect(isValidCustomIdentifierFormat("abc12", createFormat({ fixedLength: 6 }))).toBeFalsy();
    });

    it("rejects a value longer than the fixed length", () => {
      expect(isValidCustomIdentifierFormat("abc1234", createFormat({ fixedLength: 6 }))).toBeFalsy();
    });

    it("rejects an empty value when a length is required", () => {
      expect(isValidCustomIdentifierFormat("", createFormat({ fixedLength: 6 }))).toBeFalsy();
    });
  });

  describe("Character set requirements", () => {
    it("accepts letters and digits when alphanumeric only", () => {
      const format = createFormat({ alphanumericOnly: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("aB3xY9", format)).toBeTruthy();
    });

    it("rejects special characters when alphanumeric only", () => {
      const format = createFormat({ alphanumericOnly: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("aB3x!9", format)).toBeFalsy();
    });

    it("accepts only letters when letters only", () => {
      const format = createFormat({ alphanumericOnly: false, lettersOnly: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("abcXYZ", format)).toBeTruthy();
    });

    it("rejects digits when letters only", () => {
      const format = createFormat({ alphanumericOnly: false, lettersOnly: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("abcXY9", format)).toBeFalsy();
    });

    it("accepts only digits when numbers only", () => {
      const format = createFormat({ alphanumericOnly: false, numbersOnly: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("123456", format)).toBeTruthy();
    });

    it("rejects letters when numbers only", () => {
      const format = createFormat({ alphanumericOnly: false, numbersOnly: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("12345a", format)).toBeFalsy();
    });

    it("rejects a value when no character set is selected", () => {
      const format = createFormat({ alphanumericOnly: false, lettersOnly: false, numbersOnly: false });
      expect(isValidCustomIdentifierFormat("abc123", format)).toBeFalsy();
    });
  });

  describe("Special character requirements", () => {
    it("accepts allowed special characters when enabled", () => {
      const format = createFormat({ alphanumericOnly: true, allowSpecialCharacters: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("aB3x!@", format)).toBeTruthy();
    });

    it("rejects special characters outside the allowed set", () => {
      const format = createFormat({ alphanumericOnly: true, allowSpecialCharacters: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("aB3x*9", format)).toBeFalsy();
    });

    it("accepts allowed special characters when letters only and the option is enabled", () => {
      const format = createFormat({
        alphanumericOnly: false,
        lettersOnly: true,
        allowSpecialCharacters: true,
        fixedLength: 6,
      });
      expect(isValidCustomIdentifierFormat("abcXY!", format)).toBeTruthy();
      expect(isValidCustomIdentifierFormat("abcXYZ", format)).toBeTruthy();
    });
  });

  describe("Uppercase requirements", () => {
    it("accepts uppercase letters when required", () => {
      const format = createFormat({ alphanumericOnly: true, uppercaseRequired: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("AB3XY9", format)).toBeTruthy();
    });

    it("rejects lowercase letters when uppercase is required", () => {
      const format = createFormat({ alphanumericOnly: true, uppercaseRequired: true, fixedLength: 6 });
      expect(isValidCustomIdentifierFormat("aB3XY9", format)).toBeFalsy();
    });

    it("rejects lowercase letters when letters only and uppercase is required", () => {
      const format = createFormat({
        alphanumericOnly: false,
        lettersOnly: true,
        uppercaseRequired: true,
        fixedLength: 6,
      });
      expect(isValidCustomIdentifierFormat("ABCxYZ", format)).toBeFalsy();
      expect(isValidCustomIdentifierFormat("ABCXYZ", format)).toBeTruthy();
    });
  });

  describe("Combined character, special, and uppercase requirements", () => {
    it("accepts uppercase alphanumeric with special characters", () => {
      const format = createFormat({
        alphanumericOnly: true,
        allowSpecialCharacters: true,
        uppercaseRequired: true,
        fixedLength: 6,
      });
      expect(isValidCustomIdentifierFormat("AB3X!9", format)).toBeTruthy();
      expect(isValidCustomIdentifierFormat("ab3x!9", format)).toBeFalsy();
    });

    it("accepts uppercase letters with special characters, letters only", () => {
      const format = createFormat({
        alphanumericOnly: false,
        lettersOnly: true,
        allowSpecialCharacters: true,
        uppercaseRequired: true,
        fixedLength: 6,
      });
      expect(isValidCustomIdentifierFormat("ABC@XY", format)).toBeTruthy();
      expect(isValidCustomIdentifierFormat("abc@xy", format)).toBeFalsy();
    });

    it("ignores uppercaseRequired for numbers only formats", () => {
      const format = createFormat({
        alphanumericOnly: false,
        numbersOnly: true,
        uppercaseRequired: true,
        fixedLength: 6,
      });
      expect(isValidCustomIdentifierFormat("123456", format)).toBeTruthy();
    });
  });
});

describe("isValidBaseIdentifierFormat", () => {
  describe("NIH NIAA format", () => {
    it("accepts a 12 character uppercase alphanumeric value", () => {
      expect(isValidBaseIdentifierFormat("ABC123DEF456", "guid_nih_niaa")).toBeTruthy();
    });

    it("rejects a value shorter than 12 characters", () => {
      expect(isValidBaseIdentifierFormat("ABC123DEF4", "guid_nih_niaa")).toBeFalsy();
    });

    it("rejects a value longer than 12 characters", () => {
      expect(isValidBaseIdentifierFormat("ABC123DEF45678", "guid_nih_niaa")).toBeFalsy();
    });

    it("rejects lowercase letters", () => {
      expect(isValidBaseIdentifierFormat("abc123def456", "guid_nih_niaa")).toBeFalsy();
    });

    it("rejects special characters", () => {
      expect(isValidBaseIdentifierFormat("ABC123DEF4!6", "guid_nih_niaa")).toBeFalsy();
    });
  });

  it("rejects any value for an unrecognized format", () => {
    expect(isValidBaseIdentifierFormat("ABC123DEF456", "unknown_format")).toBeFalsy();
  });
});

describe("getBaseIdentifierFormatHelperText", () => {
  it("describes the NIH NIAA format", () => {
    expect(getBaseIdentifierFormatHelperText("guid_nih_niaa")).toContain("NIH NIAA");
  });

  it("falls back to a generic message for an unrecognized format", () => {
    expect(getBaseIdentifierFormatHelperText("unknown_format")).toBe("Unknown identifier format");
  });
});

describe("getCustomIdentifierFormatHelperText", () => {
  it("includes the required length", () => {
    const format = createFormat({ fixedLength: 8 });
    expect(getCustomIdentifierFormatHelperText(format)).toContain("Required length: 8");
  });

  it("lists special characters when allowed", () => {
    const format = createFormat({ allowSpecialCharacters: true });
    expect(getCustomIdentifierFormatHelperText(format)).toContain("!");
  });

  it("restricts the character range to uppercase letters only when combined", () => {
    const format = createFormat({ alphanumericOnly: false, lettersOnly: true, uppercaseRequired: true });
    const helperText = getCustomIdentifierFormatHelperText(format);
    expect(helperText).toContain("A-Z");
    expect(helperText).not.toContain("a-z");
  });
});
