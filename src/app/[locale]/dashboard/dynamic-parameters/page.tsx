import { Card } from "@heroui/react";
import { Link } from "@heroui/react";

const parameterPages = [
  {
    title: "Word Attributes",
    href: "/dashboard/dynamic-parameters/word-attributes",
    description: "Manage word attributes used in word creation"
  },
  {
    title: "Meaning Attributes",
    href: "/dashboard/dynamic-parameters/meaning-attributes",
    description: "Manage meaning attributes used in meanings"
  },
  {
    title: "Authors",
    href: "/dashboard/dynamic-parameters/authors",
    description: "Manage authors for word examples"
  },
  {
    title: "Part of Speech",
    href: "/dashboard/dynamic-parameters/part-of-speech",
    description: "Manage parts of speech for word meanings"
  },
  {
    title: "Languages",
    href: "/dashboard/dynamic-parameters/languages",
    description: "Manage languages for words and roots"
  },
  {
    title: "Roots",
    href: "/dashboard/dynamic-parameters/roots",
    description: "Manage word roots"
  }
];

export default function DynamicParameters() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {parameterPages.map((page) => (
        <Card key={page.href} className="hover:scale-105 transition-transform">
          <div className="p-4">
            <Link href={page.href} className="text-xl font-bold">
              {page.title}
            </Link>
            <p className="text-gray-600 mt-2">{page.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
