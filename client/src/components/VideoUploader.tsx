import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Video, Upload, X, Loader2, Play, Pause, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoUploaderProps {
  onVideoUploaded: (videoUrl: string) => void;
  maxDurationSeconds?: number;
  existingVideoUrl?: string | null;
}

export function VideoUploader({
  onVideoUploaded,
  maxDurationSeconds = 60,
  existingVideoUrl = null,
}: VideoUploaderProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file",
          description: "Please select a video file (MP4, WebM, MOV)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video must be under 100MB",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setSelectedVideo(file);
      setDurationError(null);
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        setVideoDuration(duration);
        if (duration > maxDurationSeconds) {
          setDurationError(`Video is ${Math.ceil(duration)} seconds. Maximum allowed is ${maxDurationSeconds} seconds.`);
        }
        URL.revokeObjectURL(video.src);
      };
      video.src = url;
    }
  }, [toast, maxDurationSeconds]);

  const handleUpload = useCallback(async () => {
    if (!selectedVideo || durationError) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const urlResponse = await fetch('/api/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `ad-video-${Date.now()}.${selectedVideo.name.split('.').pop()}`,
          size: selectedVideo.size,
          contentType: selectedVideo.type,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL, objectPath } = await urlResponse.json();

      setUploadProgress(30);

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: selectedVideo,
        headers: { 'Content-Type': selectedVideo.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      setUploadProgress(100);
      onVideoUploaded(objectPath);

      toast({
        title: "Video uploaded",
        description: "Your promotional video has been uploaded successfully",
      });

      resetState();
      setIsOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedVideo, durationError, onVideoUploaded, toast]);

  const resetState = useCallback(() => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedVideo(null);
    setVideoPreviewUrl(null);
    setVideoDuration(0);
    setUploadProgress(0);
    setDurationError(null);
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [videoPreviewUrl]);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeExistingVideo = () => {
    onVideoUploaded("");
  };

  return (
    <>
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-video-select"
      />

      <div className="space-y-3">
        {existingVideoUrl ? (
          <div className="relative rounded-lg overflow-hidden border bg-muted">
            <video
              src={existingVideoUrl}
              className="w-full h-40 object-cover"
              controls
              data-testid="video-existing-preview"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeExistingVideo}
              data-testid="button-remove-video"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="w-full"
            data-testid="button-add-video"
          >
            <Video className="w-4 h-4 mr-2" />
            Add Promotional Video (up to {maxDurationSeconds}s)
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Upload a promotional video up to {maxDurationSeconds} seconds. Supported formats: MP4, WebM, MOV. Max size: 100MB.
        </p>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetState(); setIsOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Promotional Video</DialogTitle>
          </DialogHeader>

          {!videoPreviewUrl ? (
            <div className="flex flex-col gap-4 py-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid="video-upload-dropzone"
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to select or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, WebM, or MOV up to 100MB
                </p>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Videos must be {maxDurationSeconds} seconds or less. Shorter videos tend to perform better!
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  className="w-full max-h-64 object-contain"
                  onEnded={() => setIsPlaying(false)}
                  data-testid="video-preview"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-2 left-2"
                  onClick={togglePlayPause}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(videoDuration)}
                </div>
              </div>

              {durationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{durationError}</AlertDescription>
                </Alert>
              )}

              {!durationError && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {formatDuration(videoDuration)} / {formatDuration(maxDurationSeconds)}</span>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetState(); setIsOpen(false); }}
              data-testid="button-cancel-video"
            >
              Cancel
            </Button>
            {videoPreviewUrl && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetState}
                  disabled={isUploading}
                  data-testid="button-change-video"
                >
                  Change Video
                </Button>
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading || !!durationError}
                  data-testid="button-upload-video"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
