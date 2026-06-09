import Script from "next/script";

interface JsonLdProps {
  id: string;
  data: object;
}

export function JsonLd({ id, data }: JsonLdProps) {
  const serializedData = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <Script id={id} type="application/ld+json">
      {serializedData}
    </Script>
  );
}
