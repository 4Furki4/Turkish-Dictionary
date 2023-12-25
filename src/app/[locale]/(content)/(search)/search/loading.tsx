import React from "react";

export default function Loading() {
  return (
    <main className="p-4 lg:p-0 max-w-5xl rounded-lg shadow-sm">
      <div
        style={{ animationDuration: "10s" }}
        className="bg-secondary rounded-lg grid gap-4 animate-pulse p-4"
      >
        <header className="bg-background animate-pulse w-1/2 h-8 mx-auto rounded-lg"></header>
        <div className="bg-background animate-pulse h-4 rounded-md w-1/12"></div>
        {new Array(4).fill(0).map((_, i) => (
          <div className="grid gap-4" key={i}>
            <section
              style={{
                animationDelay: `${i * 0.05}s`,
              }}
              className="bg-background animate-pulse h-32 rounded-lg grid gap-4"
            >
              <div className="flex">
                <div
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                  className="bg-secondary animate-pulse h-8 rounded-lg w-1/6 m-2"
                ></div>
                <div
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                  className="bg-secondary animate-pulse h-8 rounded-lg w-5/6 m-2"
                ></div>
              </div>
              <div className="flex">
                <div
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                  className="bg-secondary animate-pulse h-8 rounded-lg w-1/6 m-2"
                ></div>
                <div
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                  className="bg-secondary animate-pulse h-8 rounded-lg w-5/6 m-2"
                ></div>
              </div>
            </section>
            <hr className="bg-background animate-pulse h-1 rounded-md" />
          </div>
        ))}
      </div>
    </main>
  );
}
