import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";

export function StartPage() {
  return (
    <div className="flex-1 h-full flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl flex justify-center">
        <Link to="/upload">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-2xl px-16 py-6 font-semibold shadow-2xl"
          >
            <Upload className="w-6 h-6 mr-3" />
            {t("landing.cta.button")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
