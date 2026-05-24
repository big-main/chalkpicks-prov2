import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, AlertCircle } from "lucide-react";

export function PromoCodeInput({
  tier,
  onPromoApplied,
}: {
  tier: "daily" | "monthly" | "yearly";
  onPromoApplied: (code: string, discount: number, finalPrice: number) => void;
}) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);

  const validatePromo = trpc.promoCode.validate.useQuery(
    { code: code.toUpperCase(), tier },
    { enabled: code.length > 0 && !applied }
  );

  const handleApply = () => {
    if (validatePromo.data) {
      setApplied(true);
      onPromoApplied(code, validatePromo.data.discount, validatePromo.data.finalPrice);
      toast.success(`✓ ${validatePromo.data.discountPercentage}% off applied!`);
    }
  };

  const handleClear = () => {
    setCode("");
    setApplied(false);
    onPromoApplied("", 0, 0);
  };

  if (applied) {
    return (
      <div className="flex items-center gap-2 p-3 rounded bg-green-900/20 border border-green-500/50">
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400">Promo code applied: {code}</span>
        <button
          onClick={handleClear}
          className="ml-auto text-xs text-green-400 hover:text-green-300 underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="flex-1 px-3 py-2 bg-gray-900/50 border border-green-500/30 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
        <button
          onClick={handleApply}
          disabled={!code || validatePromo.isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm font-medium text-white transition"
        >
          Apply
        </button>
      </div>
      {validatePromo.error && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          {validatePromo.error.message}
        </div>
      )}
    </div>
  );
}
