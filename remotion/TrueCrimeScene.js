import { AbsoluteFill, Audio, useCurrentFrame, interpolate } from 'remotion';

export const TrueCrimeScene = ({ scriptText, audioUrl }) => {
  const frame = useCurrentFrame();

  // ব্যাকগ্রাউন্ডে সিনেমাটিক জুম-ইন অ্যানিমেশন
  const scale = interpolate(frame, [0, 1800], [1, 1.15]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#030812', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      {/* ব্যাকগ্রাউন্ড ভিজ্যুয়াল */}
      <AbsoluteFill style={{ transform: `scale(${scale})`, opacity: 0.6, background: 'radial-gradient(circle, #1a2b4c 0%, #030812 100%)' }} />

      {/* ইলেভেন ল্যাবসের ভয়েস-ওভার অডিও */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* সাবটাইটেল বা টেক্সট ওভারলে */}
      <div style={{ position: 'absolute', bottom: '150px', width: '85%', textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#ffffff', fontSize: '42px', fontFamily: 'sans-serif', textShadow: '0 4px 10px rgba(0,0,0,0.8)', margin: 0 }}>
          {scriptText || "Uncovering the dark secrets..."}
        </h2>
      </div>
    </AbsoluteFill>
  );
};
