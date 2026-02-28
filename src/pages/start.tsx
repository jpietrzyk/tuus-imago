import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";

export function StartPage() {
  return (
    <div className="flex-1 h-full flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-full flex items-center justify-center">
        <Link to="/upload">
          <Button
            variant="ghost"
            className="border-2 border-dashed rounded-lg p-6 border-muted-foreground/25 hover:border-muted-foreground/50 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Upload className="h-12 w-12 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">
              {t("landing.cta.button")}
            </span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
