interface VideoBackgroundProps {
  videoSrc?: string;
}

const VideoBackground = ({ videoSrc }: VideoBackgroundProps) => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {videoSrc ? (
        <video
          src={videoSrc}
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />
      ) : (
        <img
          src="/media/login-bg.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-background/60" />
    </div>
  );
};

export default VideoBackground;
