import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Terminal, ChevronRight } from "lucide-react";
import { ScrambleText } from "./App";
import { LiveScanner } from "./LiveScanner";

export default function ScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loopImages, setLoopImages] = useState<HTMLImageElement[]>([]);
  const [scrollImages, setScrollImages] = useState<HTMLImageElement[]>([]);
  const loopFrameCount = 432;
  const scrollFrameCount = 288;
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Fading content logic based on scroll progress
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Preload frames concurrently
  useEffect(() => {
    const loadedLoopImages: HTMLImageElement[] = [];
    const loadedScrollImages: HTMLImageElement[] = [];
    
    for (let i = 1; i <= loopFrameCount; i++) {
        const img = new Image();
        img.src = `/frame-web-loop/ezgif-frame-${i.toString().padStart(3, '0')}.jpg`;
        img.onload = () => {
          if (i === 1) renderInitialFrame(img);
        };
        loadedLoopImages.push(img);
    }
    setLoopImages(loadedLoopImages);

    for (let i = 1; i <= scrollFrameCount; i++) {
        const img = new Image();
        img.src = `/frames/ezgif-frame-${i.toString().padStart(3, '0')}.jpg`;
        loadedScrollImages.push(img);
    }
    setScrollImages(loadedScrollImages);
  }, []);

  const renderInitialFrame = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    
    // Match the canvas internal buffer exactly to its CSS container display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // draw image centered
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio) * 1.05; // slight zoom to hide letterboxing without over-cropping
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;
    
    context.fillStyle = '#0a0a0a'; // cyber-bg fallback
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
  };

  useEffect(() => {
    if (!loopImages.length || !scrollImages.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    let requestRef: number;
    let isLooping = false;
    let loopStartTime = performance.now();
    const fps = 60; // Increased to 60 FPS for much smoother playback
    const frameDuration = 1000 / fps;

    const drawImageToCanvas = (img: HTMLImageElement, nextImg?: HTMLImageElement, crossfadeAlpha: number = 0) => {
      if (!img || !img.complete) return;
      
      context.fillStyle = '#0a0a0a'; 
      context.fillRect(0, 0, canvas.width, canvas.height);

      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      
      // Increased zoom from 1.05 to 1.15 to push the Veo watermark completely off-screen
      const ratio = Math.max(hRatio, vRatio) * 1.15; 
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;
      
      context.globalAlpha = 1;
      context.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

      if (nextImg && nextImg.complete && crossfadeAlpha > 0) {
          context.globalAlpha = crossfadeAlpha;
          context.drawImage(nextImg, 0, 0, nextImg.width, nextImg.height, centerShift_x, centerShift_y, nextImg.width * ratio, nextImg.height * ratio);
          context.globalAlpha = 1;
      }
    };

    const drawLoop = (time: number) => {
      if (!isLooping) return;
      
      const elapsedTime = time - loopStartTime;
      const totalFramesPassed = Math.floor(elapsedTime / frameDuration);
      
      let currentFrameIndex;
      let nextFrameIndex = -1;
      let crossfadeAlpha = 0;

      const loopLastStartIndex = 224; // Index for ezgif-frame-225.jpg
      const loopLastCount = loopImages.length - loopLastStartIndex; // 208 frames
      const crossfadeFrames = 60; // 1-second crossfade (60fps)

      if (totalFramesPassed < loopLastStartIndex) {
         // Play the initial sequence normally
         currentFrameIndex = totalFramesPassed;
      } else {
         // Continuously loop the "last folder" frames indefinitely with a smooth crossfade
         const elapsedInLoop = totalFramesPassed - loopLastStartIndex;
         let vTime = elapsedInLoop;
         
         if (vTime >= loopLastCount) {
             const extra = vTime - loopLastCount;
             const cycleLen = loopLastCount - crossfadeFrames;
             vTime = crossfadeFrames + (extra % cycleLen);
         }
         
         currentFrameIndex = loopLastStartIndex + vTime;
         
         // Are we in the crossfade window?
         if (vTime >= loopLastCount - crossfadeFrames) {
             const overlap = vTime - (loopLastCount - crossfadeFrames);
             nextFrameIndex = loopLastStartIndex + overlap;
             crossfadeAlpha = overlap / crossfadeFrames;
         }
      }
      
      const nextImg = nextFrameIndex !== -1 ? loopImages[nextFrameIndex] : undefined;
      drawImageToCanvas(loopImages[currentFrameIndex], nextImg, crossfadeAlpha);
      
      requestRef = requestAnimationFrame(drawLoop);
    };

    const handleScrollUpdate = (latest: number) => {
      const topThreshold = 0.005;
      if (latest <= topThreshold) {
         if (!isLooping) {
            isLooping = true;
            loopStartTime = performance.now();
            requestRef = requestAnimationFrame(drawLoop);
         }
      } else {
         if (isLooping) {
            isLooping = false;
            cancelAnimationFrame(requestRef);
         }
         // Map the remaining progress (0.005 to 1.0) to frames
         const progress = Math.max(0, (latest - topThreshold)) / (1 - topThreshold);
         const frameIndex = Math.min(scrollImages.length - 1, Math.floor(progress * scrollImages.length));
         requestRef = requestAnimationFrame(() => drawImageToCanvas(scrollImages[frameIndex]));
      }
    };

    const unsubscribe = scrollYProgress.on("change", handleScrollUpdate);

    const handleResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const topThreshold = 0.005;
      if (scrollYProgress.get() <= topThreshold) {
         if (!isLooping) {
            isLooping = true;
            loopStartTime = performance.now();
            requestRef = requestAnimationFrame(drawLoop);
         }
      } else {
         const progress = Math.max(0, (scrollYProgress.get() - topThreshold)) / (1 - topThreshold);
         const frameIndex = Math.min(scrollImages.length - 1, Math.floor(progress * scrollImages.length));
         drawImageToCanvas(scrollImages[frameIndex]);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);

    const initialProgress = scrollYProgress.get();
    const topThreshold = 0.005;
    if (initialProgress <= topThreshold) {
       isLooping = true;
       loopStartTime = performance.now();
       requestRef = requestAnimationFrame(drawLoop);
    } else {
       const progress = Math.max(0, (initialProgress - topThreshold)) / (1 - topThreshold);
       const frameIndex = Math.min(scrollImages.length - 1, Math.floor(progress * scrollImages.length));
       drawImageToCanvas(scrollImages[frameIndex]);
    }

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(requestRef);
    };
  }, [loopImages, scrollImages, scrollYProgress]);

  // No scroll-based fading for the canvas itself
  
  // Description reveal tied to scroll progression
  // (Removed so it appears on load)

  return (
    <div ref={containerRef} className="h-[600vh] w-full relative bg-cyber-bg" id="hero">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* The Frame Canvas */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full z-0 opacity-40 mix-blend-screen"
          style={{
             filter: 'contrast(1.2) brightness(0.9) saturate(1.2)',
             maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
             WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
          }}
        />

        {/* Cinematic Vignette (Softened so top edge remains visible under navbar) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-cyber-bg/80 z-10 pointer-events-none" />

        {/* Content Overlay */}
        <div 
          className="relative z-20 w-full flex flex-col justify-center items-center max-w-5xl mx-auto px-4 pt-16 text-center"
        >
          <div className="relative overflow-hidden bg-[#050505]/60 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,255,65,0.05)] transition-all max-w-2xl">
              {/* Glossy Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
              
              <motion.p 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ duration: 1, delay: 0.5 }}
                 className="relative z-10 font-mono text-cyber-green mb-4 flex items-center justify-center gap-2 text-xs md:text-sm opacity-80"
              >
                <ChevronRight className="w-4 h-4" /> root@localhost:~# init_sequence --start
              </motion.p>

              <motion.h1 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.8 }}
                 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight"
              >
                  <span className="uppercase text-amber-500">
                    SUDHANSHU SHEKHAR
                  </span>
              </motion.h1>
              
              <motion.h2 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 1.1 }}
                 className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-white mb-6 tracking-tight cursor-default"
              >
                <ScrambleText text="Cybersecurity &" />{" "}
                <ScrambleText
                  text="Digital Forensics"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-green to-cyber-blue drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]"
                />
              </motion.h2>

              <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 1.4 }}
                className="text-base md:text-lg text-gray-300 font-light mb-8 max-w-2xl mx-auto border-l-2 border-cyber-green/50 pl-6 text-left leading-relaxed"
              >
                BCA Student & Security Enthusiast. Specializing in digital investigations, vulnerability analysis, and secure software development.
              </motion.p>

              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="relative z-50 px-8 py-4 bg-cyber-green/10 border border-cyber-green text-cyber-green font-mono font-medium rounded hover:bg-cyber-green hover:text-black hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all flex items-center gap-2 group"
                >
                  <Terminal className="w-5 h-5 group-hover:animate-pulse" /> 
                  Begin Scan
                </button>
              </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-3"
        >
          <span className="font-mono text-xs text-cyber-green/80 tracking-[0.3em] uppercase">Scroll Sequence</span>
          <div className="w-[1px] h-16 bg-cyber-green/20 overflow-hidden relative">
            <motion.div 
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-green to-transparent"
            />
          </div>
        </motion.div>

        <LiveScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      </div>
    </div>
  );
}
