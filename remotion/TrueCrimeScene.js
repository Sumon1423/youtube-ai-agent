import { AbsoluteFill, Audio, Img, useCurrentFrame, interpolate } from 'remotion';

export const TrueCrimeScene = ({ scriptText, audioUrl }) => {
  const frame = useCurrentFrame();

  // সিনেমাটিক জুম-ইন (Ken Burns Effect)
  const scale = interpolate(frame, [0, 1800], [1, 1.25]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      
      {/* ব্যাকগ্রাউন্ড সিনেমাটিক ইমেজ + স্কেলিং এডিটিং */}
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img 
          src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1080&auto=format&fit=crop" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4) contrast(1.2)' }}
        />
      </AbsoluteFill>

      {/* অন্ধকার সিনেমাটিক ওভারলে */}
      <AbsoluteFill style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)' }} />

      {/* আসল ভয়েস-ওভার অডিও (যদি লিংক থাকে) */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* টপ ব্যাজ */}
      <div style={{ position: 'absolute', top: '120px', textAlign: 'center' }}>
        <span style={{ 
          background: 'rgba(239, 68, 68, 0.2)', 
          border: '1px solid #ef4444', 
          color: '#ef4444', 
          padding: '6px 16px', 
          borderRadius: '20px', 
          fontSize: '14px', 
          fontWeight: '900',
          letterSpacing: '3px'
        }}>
          CLASSIFIED FILE
        </span>
      </div>

      {/* ডায়নামিক সাবটাইটেল বক্স */}
      <div style={{ 
        position: 'absolute', 
        bottom: '160px', 
        width: '85%', 
        textAlign: 'center', 
        padding: '20px',
        background: 'rgba(5, 11, 20, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
      }}>
        <p style={{ 
          color: '#ffffff', 
          fontSize: '26px', 
          fontFamily: 'sans-serif', 
          fontWeight: '800',
          lineHeight: '1.4',
          margin: 0,
          textShadow: '0 2px 10px rgba(0,0,0,0.9)'
        }}>
          {scriptText ? scriptText.slice(0, 90) + "..." : "In 1948, a top-secret bomber vanished without a trace..."}
        </p>
      </div>

    </AbsoluteFill>
  );
};
