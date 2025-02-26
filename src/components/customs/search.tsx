import React from "react";
import SearchForm from "./search-form";
export default function Search({
  children,
  warningParamIntl,
}: {
  children: React.ReactNode;
  warningParamIntl: string;
}) {
  return (
    <>
      <SearchForm warningParamIntl={warningParamIntl} />
      {children}
    </>
  );
}
