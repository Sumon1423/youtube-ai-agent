import { AbsoluteFill, Audio, useCurrentFrame, interpolate, spring } from 'remotion';

export const TrueCrimeScene = ({ scriptText, audioUrl }) => {
  const frame = useCurrentFrame();

  // সিনেমাটিক স্কেল এবং জুম ইফেক্ট
  const scale = interpolate(frame, [0, 1800], [1, 1.2]);
  
  // ফেইড-ইন অ্যানিমেশন
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050b14', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      
      {/* ব্যাকগ্রাউন্ড সিনেমাটিক গ্রেডিয়েন্ট ও ডার্ক ওভারলে */}
      <AbsoluteFill style={{ 
        transform: `scale(${scale})`, 
        opacity: 0.7, 
        background: 'radial-gradient(circle, #132238 0%, #050b14 100%)' 
      }} />

      {/* ভিন্টেজ বা ক্রাইম থিম গ্রিড ওভারলে */}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        opacity: 0.3
      }} />

      {/* ভয়েস-ওভার অডিও */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* আকর্ষণীয় ও ক্লিন সাবটাইটেল বক্স (প্রফেশনাল লুক) */}
      <div style={{ 
        position: 'absolute', 
        bottom: '180px', 
        width: '85%', 
        textAlign: 'center', 
        padding: '24px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        opacity: opacity
      }}>
        <span style={{ color: '#25d8e8', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>
          TRUE CRIME INVESTIGATION
        </span>
        <p style={{ 
          color: '#ffffff', 
          fontSize: '28px', 
          fontFamily: 'system-ui, sans-serif', 
          fontWeight: '700',
          lineHeight: '1.4',
          textShadow: '0 2px 8px rgba(0,0,0,0.9)', 
          margin: 0 
        }}>
          {scriptText ? scriptText.slice(0, 120) + "..." : "Uncovering the dark secrets of history..."}
        </p>
      </div>
    </AbsoluteFill>
  );
};
