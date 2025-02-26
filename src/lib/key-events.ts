import { KeyboardEvent } from "react";

export function onEnterAndSpace(event: KeyboardEvent<any>, cb: () => any) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    cb();
  }
}
