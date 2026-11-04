import { Composition } from 'remotion';
import { TrueCrimeScene } from './TrueCrimeScene';

export const Root = () => {
  return (
    <Composition
      id="TrueCrimeShort"
      component={TrueCrimeScene}
      durationInFrames={1800} // ৬০ সেকেন্ড (৩০ ফ্রেম প্রতি সেকেন্ড হিসেবে ৩০ * ৬০ = ১৮০০ ফ্রেম)
      fps={30}
      width={1080}
      height={1920} // ভার্টিক্যাল শর্টস সাইজ (9:16)
    />
  );
};
