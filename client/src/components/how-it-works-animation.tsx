import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  Shield,
  Users,
  Factory,
  Store,
  ArrowRight,
  CreditCard,
  MessageCircle,
  FileText,
  Box,
  User,
  Building2,
  Globe,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlowStep {
  icon: React.ReactNode;
  label: string;
  description: string;
}

interface UserFlow {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  steps: FlowStep[];
}

const userFlows: UserFlow[] = [
  {
    id: "consumer",
    title: "Shop as a Consumer",
    subtitle: "B2C - Buy products from across Africa",
    color: "from-emerald-500 to-teal-600",
    icon: <User className="h-6 w-6" />,
    steps: [
      { icon: <Globe className="h-8 w-8" />, label: "Browse", description: "Explore products from 54 African countries" },
      { icon: <ShoppingCart className="h-8 w-8" />, label: "Add to Cart", description: "Select items and quantities" },
      { icon: <CreditCard className="h-8 w-8" />, label: "Pay Securely", description: "Funds held in escrow protection" },
      { icon: <Truck className="h-8 w-8" />, label: "Track Delivery", description: "Real-time shipment updates" },
      { icon: <CheckCircle className="h-8 w-8" />, label: "Confirm & Review", description: "Release payment when satisfied" },
    ],
  },
  {
    id: "trader",
    title: "Trade as a Business",
    subtitle: "B2B - Buy and sell in bulk quantities",
    color: "from-amber-500 to-orange-600",
    icon: <Store className="h-6 w-6" />,
    steps: [
      { icon: <FileText className="h-8 w-8" />, label: "Submit RFQ", description: "Request quotes for bulk orders" },
      { icon: <MessageCircle className="h-8 w-8" />, label: "Negotiate", description: "Chat directly with suppliers" },
      { icon: <Handshake className="h-8 w-8" />, label: "Accept Quote", description: "Agree on price and terms" },
      { icon: <Shield className="h-8 w-8" />, label: "Escrow Payment", description: "Secure funds until delivery" },
      { icon: <Package className="h-8 w-8" />, label: "Receive Goods", description: "Confirm and release payment" },
    ],
  },
  {
    id: "manufacturer",
    title: "Sell as a Manufacturer",
    subtitle: "M2B - Supply products at scale",
    color: "from-blue-500 to-indigo-600",
    icon: <Factory className="h-6 w-6" />,
    steps: [
      { icon: <Box className="h-8 w-8" />, label: "List Products", description: "Add your manufactured goods" },
      { icon: <Users className="h-8 w-8" />, label: "Reach Buyers", description: "Connect with traders across Africa" },
      { icon: <FileText className="h-8 w-8" />, label: "Receive RFQs", description: "Get bulk order requests" },
      { icon: <Truck className="h-8 w-8" />, label: "Ship Orders", description: "Fulfill with tracking" },
      { icon: <CreditCard className="h-8 w-8" />, label: "Get Paid", description: "Receive funds after confirmation" },
    ],
  },
  {
    id: "dropship",
    title: "Dropship Products",
    subtitle: "Sell without inventory",
    color: "from-purple-500 to-pink-600",
    icon: <Building2 className="h-6 w-6" />,
    steps: [
      { icon: <Store className="h-8 w-8" />, label: "Find Suppliers", description: "Browse dropship offers" },
      { icon: <Package className="h-8 w-8" />, label: "List Products", description: "Add to your store with markup" },
      { icon: <ShoppingCart className="h-8 w-8" />, label: "Receive Orders", description: "Customer buys from you" },
      { icon: <Factory className="h-8 w-8" />, label: "Supplier Ships", description: "Direct to your customer" },
      { icon: <CreditCard className="h-8 w-8" />, label: "Keep Profit", description: "Earn the margin difference" },
    ],
  },
];

export function HowItWorksAnimation() {
  const [activeFlow, setActiveFlow] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        const currentFlow = userFlows[activeFlow];
        if (prev >= currentFlow.steps.length - 1) {
          setActiveFlow((prevFlow) => (prevFlow + 1) % userFlows.length);
          return 0;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(stepInterval);
  }, [activeFlow, isAutoPlaying]);

  const currentFlow = userFlows[activeFlow];

  return (
    <div 
      className="py-16 px-4"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">How Ghani Africa Works</h2>
          <p className="text-muted-foreground text-lg">One platform, endless possibilities for African trade</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {userFlows.map((flow, index) => (
            <Button
              key={flow.id}
              variant={activeFlow === index ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveFlow(index);
                setActiveStep(0);
              }}
              className="gap-2"
              data-testid={`button-flow-${flow.id}`}
            >
              {flow.icon}
              <span className="hidden sm:inline">{flow.title}</span>
            </Button>
          ))}
        </div>

        <div 
          className={`rounded-xl bg-gradient-to-r ${currentFlow.color} p-1 transition-all duration-500`}
          key={currentFlow.id}
        >
          <div className="bg-card rounded-lg p-6 md:p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-1">{currentFlow.title}</h3>
              <p className="text-muted-foreground">{currentFlow.subtitle}</p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0">
                <div
                  className={`h-full bg-gradient-to-r ${currentFlow.color} transition-all duration-500`}
                  style={{ width: `${(activeStep / (currentFlow.steps.length - 1)) * 100}%` }}
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-2 relative z-10">
                {currentFlow.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex md:flex-col items-center gap-3 md:gap-2 flex-1 cursor-pointer transition-all duration-300 ${
                      index <= activeStep ? "opacity-100" : "opacity-40"
                    }`}
                    onClick={() => setActiveStep(index)}
                  >
                    <div
                      className={`p-4 rounded-full bg-gradient-to-br ${currentFlow.color} text-white shrink-0 transition-all duration-300 ${
                        index === activeStep ? "scale-110 shadow-lg" : "scale-100"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="md:text-center">
                      <p className="font-semibold text-sm">{step.label}</p>
                      <p className="text-xs text-muted-foreground hidden md:block max-w-[120px]">
                        {step.description}
                      </p>
                    </div>
                    {index < currentFlow.steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground md:hidden shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${currentFlow.color} text-white transition-all duration-300`}>
                {currentFlow.steps[activeStep].icon}
                <div className="text-left">
                  <p className="font-bold">{currentFlow.steps[activeStep].label}</p>
                  <p className="text-sm opacity-90">{currentFlow.steps[activeStep].description}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {currentFlow.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeStep 
                      ? `w-6 bg-gradient-to-r ${currentFlow.color}` 
                      : "w-2 bg-muted-foreground/30"
                  }`}
                  data-testid={`button-step-indicator-${index}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          {[
            { icon: <Shield className="h-6 w-6" />, label: "Escrow Protection", desc: "Funds secured until delivery" },
            { icon: <Globe className="h-6 w-6" />, label: "54 Countries", desc: "Africa-wide coverage" },
            { icon: <Truck className="h-6 w-6" />, label: "Track Shipments", desc: "Real-time updates" },
            { icon: <MessageCircle className="h-6 w-6" />, label: "Direct Chat", desc: "Negotiate in-app" },
          ].map((feature, index) => (
            <div
              key={index}
              className="text-center p-4"
            >
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-2">
                {feature.icon}
              </div>
              <p className="font-semibold text-sm">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
