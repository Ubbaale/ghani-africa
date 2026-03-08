import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: "sm" | "default" | "icon";
  variant?: "ghost" | "outline" | "default";
}

export function WishlistButton({ productId, className, size = "icon", variant = "ghost" }: WishlistButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: wishlistStatus } = useQuery<{ inWishlist: boolean }>({
    queryKey: ["/api/wishlist/check", productId],
    queryFn: async () => {
      const res = await fetch(`/api/wishlist/check/${productId}`);
      if (!res.ok) return { inWishlist: false };
      return res.json();
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wishlist", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist/check", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to wishlist",
        description: "Product saved to your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to wishlist",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/wishlist/product/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist/check", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed from wishlist",
        description: "Product removed from your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive",
      });
    },
  });

  const isInWishlist = wishlistStatus?.inWishlist ?? false;
  const isPending = addMutation.isPending || removeMutation.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save products to your wishlist",
        variant: "destructive",
      });
      return;
    }

    if (isInWishlist) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(
        "transition-colors",
        isInWishlist && "text-red-500 hover:text-red-600",
        className
      )}
      onClick={handleClick}
      disabled={isPending}
      data-testid={`button-wishlist-${productId}`}
    >
      <Heart
        className={cn(
          "w-5 h-5",
          isInWishlist && "fill-current"
        )}
      />
    </Button>
  );
}
