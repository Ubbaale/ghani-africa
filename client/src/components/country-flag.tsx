interface CountryFlagProps {
  code: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { width: 16, height: 12 },
  md: { width: 20, height: 15 },
  lg: { width: 24, height: 18 },
};

export function CountryFlag({ code, size = "md", className = "" }: CountryFlagProps) {
  const { width, height } = sizeMap[size];
  const lowerCode = code.toLowerCase();
  
  return (
    <img
      src={`https://flagcdn.com/${width}x${height}/${lowerCode}.png`}
      srcSet={`https://flagcdn.com/${width * 2}x${height * 2}/${lowerCode}.png 2x`}
      width={width}
      height={height}
      alt={`${code} flag`}
      className={`inline-block ${className}`}
      loading="lazy"
    />
  );
}
