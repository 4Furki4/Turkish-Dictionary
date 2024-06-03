import React from "react";

export default function Loading() {
  return (
    <main className="max-w-5xl border border-border shadow-medium rounded-sm grid gap-4 animate-pulse p-8">
      <header className="flex gap-4 sm:gap-0 flex-col sm:flex-row sm:items-center pt-4">
        <h1 className="bg-foreground animate-pulse w-1/2 sm:w-1/4 mx-auto sm:mx-0 h-12 rounded-sm"></h1>
        <div className="bg-foreground animate-pulse h-6 rounded-sm w-24 sm:ml-auto"></div>
      </header>
      <div className="grid gap-4 pt-12">
        <section
          className="animate-pulse rounded-sm grid gap-4"
        >
          <div className="flex flex-col gap-4">
            <div
              className="bg-foreground animate-pulse h-4 rounded-sm w-1/6"
            ></div>
            <div
              className="bg-foreground animate-pulse h-16 rounded-sm w-full"
            ></div>
          </div>
        </section>
      </div>
      <footer
        className="bg-foreground animate-pulse h-6 rounded-sm w-3/4 mx-auto"
      >

      </footer>
    </main>
  );
}
