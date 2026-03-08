import { Link } from "wouter";

interface GradientLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  linkTo?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-24 w-24",
};

const gradientSizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-28 w-28",
};

const textSizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function GradientLogo({ size = "sm", showText = true, linkTo = "/", className = "" }: GradientLogoProps) {
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${gradientSizeMap[size]} rounded-full bg-gradient-to-br from-emerald-600 via-green-500 to-amber-400 p-[2px] shadow-lg`}>
        <div className="h-full w-full rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center">
          <img
            src="/images/ghani-africa-logo.png"
            alt="Ghani Africa"
            className={`${sizeMap[size]} object-contain`}
            data-testid="img-logo"
          />
        </div>
      </div>
      {showText && (
        <span className={`font-bold ${textSizeMap[size]} bg-gradient-to-r from-emerald-700 via-green-600 to-amber-500 bg-clip-text text-transparent`} data-testid="link-logo">
          Ghani Africa
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return <Link href={linkTo}>{content}</Link>;
  }

  return content;
}
