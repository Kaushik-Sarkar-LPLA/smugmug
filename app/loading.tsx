export default function Loading() {
  return (
    <div className="nav-route-loader nav-route-loader--page" role="status" aria-live="polite" aria-label="Loading page">
      <div className="nav-route-loader__bar" />
      <div className="nav-route-loader__panel">
        <div className="nav-route-loader__spinner" />
        <p className="nav-route-loader__label">Loading</p>
      </div>
    </div>
  );
}
