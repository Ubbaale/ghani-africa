import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Camera, Upload, X, RotateCcw, Check, Crop, ImageIcon, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageCaptureUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  aspectRatio?: number;
  maxImages?: number;
  existingImages?: string[];
}

export function ImageCaptureUploader({
  onImageUploaded,
  aspectRatio = 1,
  maxImages = 10,
  existingImages = [],
}: ImageCaptureUploaderProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          setCapturedImage(dataUrl);
          setIsCropping(true);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleCameraCapture = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleGallerySelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const applyCrop = useCallback(() => {
    if (!capturedImage || !canvasRef.current || !cropContainerRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const container = cropContainerRef.current!;
      const containerRect = container.getBoundingClientRect();
      const containerW = containerRect.width;
      const containerH = containerRect.height;

      const imgNatW = img.naturalWidth;
      const imgNatH = img.naturalHeight;

      const fitScale = Math.min(containerW / imgNatW, containerH / imgNatH);
      const displayW = imgNatW * fitScale;
      const displayH = imgNatH * fitScale;

      const scaledW = displayW * zoom;
      const scaledH = displayH * zoom;

      const imgCenterX = containerW / 2 + position.x;
      const imgCenterY = containerH / 2 + position.y;
      const imgLeftInContainer = imgCenterX - scaledW / 2;
      const imgTopInContainer = imgCenterY - scaledH / 2;

      const pixelsPerContainerPixelX = imgNatW / scaledW;
      const pixelsPerContainerPixelY = imgNatH / scaledH;

      let srcX = (0 - imgLeftInContainer) * pixelsPerContainerPixelX;
      let srcY = (0 - imgTopInContainer) * pixelsPerContainerPixelY;
      let srcW = containerW * pixelsPerContainerPixelX;
      let srcH = containerH * pixelsPerContainerPixelY;

      srcX = Math.max(0, Math.min(srcX, imgNatW));
      srcY = Math.max(0, Math.min(srcY, imgNatH));
      srcW = Math.min(srcW, imgNatW - srcX);
      srcH = Math.min(srcH, imgNatH - srcY);

      if (srcW <= 0 || srcH <= 0) {
        srcX = 0; srcY = 0; srcW = imgNatW; srcH = imgNatH;
      }

      const outputSize = 800;
      canvas.width = outputSize;
      canvas.height = Math.round(outputSize / aspectRatio);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCroppedImage(croppedDataUrl);
      setIsCropping(false);
    };
    img.src = capturedImage;
  }, [capturedImage, zoom, position, aspectRatio]);

  const uploadImage = useCallback(async () => {
    const imageToUpload = croppedImage || capturedImage;
    if (!imageToUpload) return;

    setIsUploading(true);
    try {
      const response = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageToUpload,
          filename: `product-image-${Date.now()}.jpg`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { objectPath } = await response.json();
      onImageUploaded(objectPath);

      toast({
        title: "Image uploaded",
        description: "Your product image has been uploaded and auto-resized",
      });

      resetState();
      setIsOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [croppedImage, capturedImage, onImageUploaded, toast]);

  const skipCropAndUpload = useCallback(async () => {
    if (!capturedImage) return;
    setCroppedImage(null);
    setIsCropping(false);

    setIsUploading(true);
    try {
      const response = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: capturedImage,
          filename: `product-image-${Date.now()}.jpg`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { objectPath } = await response.json();
      onImageUploaded(objectPath);

      toast({
        title: "Image uploaded",
        description: "Your image has been auto-resized and uploaded",
      });

      resetState();
      setIsOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [capturedImage, onImageUploaded, toast]);

  const resetState = useCallback(() => {
    setCapturedImage(null);
    setCroppedImage(null);
    setIsCropping(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setNaturalSize({ width: 0, height: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const canAddMore = existingImages.length < maxImages;

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-camera-capture"
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-select"
      />
      <canvas ref={canvasRef} className="hidden" />

      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        disabled={!canAddMore}
        className="w-full"
        data-testid="button-add-image"
      >
        <Camera className="w-4 h-4 mr-2" />
        {existingImages.length > 0 ? 'Add More Images' : 'Add Product Images'}
        {existingImages.length > 0 && (
          <span className="ml-2 text-muted-foreground">
            ({existingImages.length}/{maxImages})
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetState(); setIsOpen(open); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product Image</DialogTitle>
          </DialogHeader>

          {!capturedImage && !croppedImage && (
            <div className="flex flex-col gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Take a photo with your camera or choose from your gallery.
                Images will be auto-resized to fit perfectly.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={handleCameraCapture}
                  className="h-24 flex flex-col gap-2"
                  data-testid="button-take-photo"
                >
                  <Camera className="w-8 h-8" />
                  <span>Take Photo</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGallerySelect}
                  className="h-24 flex flex-col gap-2"
                  data-testid="button-choose-gallery"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span>Gallery</span>
                </Button>
              </div>
            </div>
          )}

          {capturedImage && isCropping && (
            <div className="flex flex-col gap-3 py-2">
              <p className="text-sm text-muted-foreground text-center">
                Drag to position, zoom to adjust. Or skip cropping to upload as-is.
              </p>
              <div
                ref={cropContainerRef}
                className="relative w-full bg-black rounded-md overflow-hidden cursor-move select-none touch-none"
                style={{ aspectRatio: `${aspectRatio}` }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  src={capturedImage}
                  alt="Preview"
                  className="absolute pointer-events-none"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                  draggable={false}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-md" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                </div>
              </div>
              {naturalSize.width > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Original: {naturalSize.width} x {naturalSize.height}px
                  {naturalSize.width > 800 || naturalSize.height > 800 ? " (will be auto-resized)" : ""}
                </p>
              )}
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={(v) => setZoom(v[0])}
                  className="flex-1"
                  data-testid="slider-zoom"
                />
                <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetState}
                  size="sm"
                  data-testid="button-retake"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Retake
                </Button>
                <Button
                  variant="outline"
                  onClick={skipCropAndUpload}
                  disabled={isUploading}
                  size="sm"
                  className="flex-1"
                  data-testid="button-skip-crop"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-1" />
                  )}
                  Upload As-Is
                </Button>
                <Button
                  onClick={applyCrop}
                  size="sm"
                  className="flex-1"
                  data-testid="button-apply-crop"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Crop
                </Button>
              </div>
            </div>
          )}

          {croppedImage && !isCropping && (
            <div className="flex flex-col gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Preview of your cropped image
              </p>
              <div className="relative aspect-square bg-muted rounded-md overflow-hidden">
                <img
                  src={croppedImage}
                  alt="Cropped preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <DialogFooter className="flex gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setCroppedImage(null); setIsCropping(true); setZoom(1); setPosition({ x: 0, y: 0 }); }}
                  disabled={isUploading}
                  data-testid="button-edit-crop"
                >
                  <Crop className="w-4 h-4 mr-2" />
                  Re-crop
                </Button>
                <Button
                  onClick={uploadImage}
                  disabled={isUploading}
                  data-testid="button-upload-image"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ImageGalleryProps {
  images: string[];
  onRemove: (index: number) => void;
}

export function ProductImageGallery({ images, onRemove }: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((image, index) => (
        <div key={index} className="relative aspect-square bg-muted rounded-md overflow-hidden group">
          <img
            src={image.startsWith('/objects/') ? image : image}
            alt={`Product image ${index + 1}`}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`button-remove-image-${index}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
