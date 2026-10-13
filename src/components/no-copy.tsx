"use client";

/** Blocks copy/cut/context menu on customer banking content (PIN dialogs stay outside this wrapper). */
export function NoCopy({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="select-none [&_input]:select-text [&_textarea]:select-text"
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}
