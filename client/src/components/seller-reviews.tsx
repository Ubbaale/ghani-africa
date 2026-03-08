import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, CheckCircle, User, Camera, X, ChevronLeft, ChevronRight, ImageIcon, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReviewData {
  id: number;
  rating: number;
  title: string | null;
  reviewText: string | null;
  images: string[] | null;
  sellerResponse: string | null;
  sellerRespondedAt: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  reviewer: { firstName?: string; lastName?: string; businessName?: string } | null;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  recentReviews: ReviewData[];
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : star <= rating + 0.5
              ? "fill-yellow-200 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function InteractiveStarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          data-testid={`star-rating-${star}`}
        >
          <Star
            className={`h-7 w-7 cursor-pointer transition-colors ${
              star <= (hovered || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right">{star}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

function ReviewPhotoThumbnails({ images, onImageClick }: { images: string[]; onImageClick: (index: number) => void }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {images.map((img, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onImageClick(idx)}
          className="relative w-16 h-16 rounded-md overflow-visible border border-border"
          data-testid={`review-photo-thumb-${idx}`}
        >
          <img src={img} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover rounded-md" />
        </button>
      ))}
    </div>
  );
}

function PhotoLightbox({ images, initialIndex, open, onClose }: { images: string[]; initialIndex: number; open: boolean; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!open || !images || images.length === 0) return null;

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-2">
        <div className="relative flex items-center justify-center min-h-[300px]">
          {images.length > 1 && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-1 z-10"
              onClick={goPrev}
              data-testid="lightbox-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <img
            src={images[currentIndex]}
            alt={`Review photo ${currentIndex + 1}`}
            className="max-h-[70vh] max-w-full object-contain rounded-md"
            data-testid="lightbox-image"
          />
          {images.length > 1 && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 z-10"
              onClick={goNext}
              data-testid="lightbox-next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
        {images.length > 1 && (
          <div className="text-center text-sm text-muted-foreground">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewPhotoUploader({ images, onImagesChange, isUploading, onUploadStart }: {
  images: string[];
  onImagesChange: (imgs: string[]) => void;
  isUploading: boolean;
  onUploadStart: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadStart(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    onImagesChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">Photos (optional)</Label>
      <div className="flex gap-2 flex-wrap">
        {images.map((img, idx) => (
          <div key={idx} className="relative w-16 h-16 rounded-md border border-border">
            <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover rounded-md" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
              data-testid={`remove-review-photo-${idx}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-16 h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover-elevate"
            data-testid="button-add-review-photo"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <p className="text-xs text-muted-foreground">Up to 5 photos. Max 10MB each.</p>
    </div>
  );
}

export function ReviewSubmissionForm({ orderId, revieweeId, sellerId, onSuccess }: {
  orderId: number;
  revieweeId: string;
  sellerId: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reviews", {
        orderId,
        revieweeId,
        role: "buyer_reviewing_seller",
        rating,
        title: title || null,
        reviewText: reviewText || null,
        images: reviewImages.length > 0 ? reviewImages : null,
      });
    },
    onSuccess: () => {
      toast({ title: "Review submitted", description: "Thank you for your feedback!" });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/seller", sellerId, "summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/order", orderId] });
      setRating(0);
      setTitle("");
      setReviewText("");
      setReviewImages([]);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to submit review", variant: "destructive" });
    },
  });

  const handleUploadFile = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, filename: file.name }),
      });
      if (!response.ok) throw new Error("Upload failed");
      const { objectPath } = await response.json();
      setReviewImages((prev) => [...prev, objectPath]);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload the image. Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Card data-testid="review-submission-form">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Write a Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm mb-1 block">Rating</Label>
          <InteractiveStarRating rating={rating} onChange={setRating} />
        </div>
        <div>
          <Label className="text-sm mb-1 block">Title (optional)</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            data-testid="input-review-title"
          />
        </div>
        <div>
          <Label className="text-sm mb-1 block">Your Review</Label>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share details about your experience with this seller..."
            className="resize-none"
            rows={3}
            data-testid="input-review-text"
          />
        </div>
        <ReviewPhotoUploader
          images={reviewImages}
          onImagesChange={setReviewImages}
          isUploading={isUploadingImage}
          onUploadStart={handleUploadFile}
        />
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={rating === 0 || submitMutation.isPending || isUploadingImage}
          className="w-full"
          data-testid="button-submit-review"
        >
          {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Submit Review
        </Button>
      </CardContent>
    </Card>
  );
}

export function SellerReviewsSummary({ sellerId }: { sellerId: string }) {
  const [showPhotosOnly, setShowPhotosOnly] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data, isLoading } = useQuery<ReviewSummary>({
    queryKey: ["/api/reviews/seller", sellerId, "summary"],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/seller/${sellerId}/summary`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!sellerId,
  });

  if (isLoading || !data) return null;
  if (data.totalReviews === 0) return null;

  const filteredReviews = showPhotosOnly
    ? data.recentReviews.filter((r) => r.images && r.images.length > 0)
    : data.recentReviews;

  const photosCount = data.recentReviews.filter((r) => r.images && r.images.length > 0).length;

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Card data-testid="seller-reviews-summary">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            Seller Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 items-start mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold" data-testid="text-avg-rating">{data.averageRating.toFixed(1)}</div>
              <StarRating rating={data.averageRating} size="md" />
              <div className="text-sm text-muted-foreground mt-1" data-testid="text-total-reviews">{data.totalReviews} review{data.totalReviews !== 1 ? 's' : ''}</div>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar key={star} star={star} count={data.distribution[star as keyof typeof data.distribution]} total={data.totalReviews} />
              ))}
            </div>
          </div>

          {data.recentReviews.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-medium text-sm">Recent Reviews</h4>
                {photosCount > 0 && (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="photos-filter" className="text-xs text-muted-foreground cursor-pointer">With Photos ({photosCount})</Label>
                    <Switch
                      id="photos-filter"
                      checked={showPhotosOnly}
                      onCheckedChange={setShowPhotosOnly}
                      data-testid="switch-photos-filter"
                    />
                  </div>
                )}
              </div>
              {filteredReviews.length === 0 && showPhotosOnly && (
                <p className="text-sm text-muted-foreground">No reviews with photos.</p>
              )}
              {filteredReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-3 space-y-2" data-testid={`review-${review.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {review.reviewer?.firstName || review.reviewer?.businessName || "Buyer"}
                        </span>
                        {review.isVerifiedPurchase && (
                          <Badge variant="outline" className="ml-2 text-xs gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" /> Verified Purchase
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    {review.title && <span className="font-medium text-sm">{review.title}</span>}
                  </div>
                  {review.reviewText && (
                    <p className="text-sm text-muted-foreground">{review.reviewText}</p>
                  )}
                  {review.images && review.images.length > 0 && (
                    <ReviewPhotoThumbnails
                      images={review.images}
                      onImageClick={(idx) => openLightbox(review.images!, idx)}
                    />
                  )}
                  {review.sellerResponse && (
                    <div className="bg-muted/50 rounded p-2 mt-2">
                      <p className="text-xs font-medium mb-1">Seller Response:</p>
                      <p className="text-sm text-muted-foreground">{review.sellerResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <PhotoLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

export function SellerRatingBadge({ rating, count }: { rating: number | string; count?: number }) {
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (numRating === 0 && (!count || count === 0)) return null;

  return (
    <div className="flex items-center gap-1" data-testid="seller-rating-badge">
      <StarRating rating={numRating} />
      <span className="text-sm font-medium">{numRating.toFixed(1)}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

export { StarRating };
