import { onEnterAndSpace } from "../key-events";
import { KeyboardEvent } from "react";
describe("space and enter key events", () => {
  it("should be able to run callback on space key", () => {
    const mockCallback = jest.fn();
    const event = { key: " ", preventDefault: () => {} } as KeyboardEvent;
    onEnterAndSpace(event, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
  it("should be able to run callback on enter key", () => {
    const mockCallback = jest.fn();
    const event = { key: "Enter", preventDefault: () => {} } as KeyboardEvent;
    onEnterAndSpace(event, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
});
