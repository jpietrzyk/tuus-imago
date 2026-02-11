import { Upload, Sliders, ShoppingCart, Image } from "lucide-react";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: <Upload className="w-6 h-6 md:w-8 md:h-8" />,
    title: "Upload photo",
    description: "Upload your favorite photo to get started",
  },
  {
    icon: <Sliders className="w-6 h-6 md:w-8 md:h-8" />,
    title: "Adjust photo",
    description: "Fine-tune your image with AI enhancement",
  },
  {
    icon: <ShoppingCart className="w-6 h-6 md:w-8 md:h-8" />,
    title: "Place an order",
    description: "Select your canvas size and place your order",
  },
  {
    icon: <Image className="w-6 h-6 md:w-8 md:h-8" />,
    title: "Get your painting",
    description: "Receive your museum-quality painting at your door",
  },
];

export function ProcessTimeline() {
  return (
    <div className="w-full py-6 md:py-8">
      <div className="bg-black/5 rounded-xl p-6 md:p-8 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-gray-900 dark:text-gray-100">
          How it works
        </h2>

        <div className="relative">
          {/* Timeline line (desktop only) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2 rounded-full" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center text-center space-y-3"
              >
                {/* Icon circle */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  {step.icon}
                </div>

                {/* Step content */}
                <div className="space-y-1">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
                    {step.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-[180px]">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for mobile only */}
                {index < steps.length - 1 && (
                  <div className="md:hidden text-primary mt-2">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
