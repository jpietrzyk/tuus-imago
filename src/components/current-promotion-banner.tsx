export interface CurrentPromotionBannerProps {
  slogan?: string | null;
}

export function CurrentPromotionBanner({ slogan }: CurrentPromotionBannerProps) {
  if (!slogan) return null;

  return (
    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 whitespace-nowrap truncate max-w-48">
      {slogan}
    </span>
  );
}
