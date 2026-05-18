export function ShopLandingBackground() {
  return (
    <div
      className="shop-landing-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="hero-glow absolute inset-0" />
      <div className="shop-orb shop-orb--gold" />
      <div className="shop-orb shop-orb--blue" />
      <div className="shop-orb shop-orb--red" />
      <div className="shop-landing-shimmer absolute inset-0" />
    </div>
  );
}
