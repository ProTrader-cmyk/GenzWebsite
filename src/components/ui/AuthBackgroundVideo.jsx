import bgVideo from '../../assets/Background-Login.mp4';

// Full-bleed looping video behind the login/signup card, with a dark +
// blue-tinted overlay on top so the form stays readable regardless of what's
// playing underneath.
export default function AuthBackgroundVideo() {
  return (
    <>
      <video className="auth-bg-video" autoPlay loop muted playsInline>
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="auth-bg-overlay" />
    </>
  );
}
