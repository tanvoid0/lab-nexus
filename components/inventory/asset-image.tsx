import Image from "next/image";

type AssetImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
};

export function AssetImage({
  src,
  alt,
  sizes,
  className,
  imageClassName,
}: AssetImageProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-lg border border-border bg-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={["object-contain", imageClassName].filter(Boolean).join(" ")}
        sizes={sizes}
      />
    </div>
  );
}
