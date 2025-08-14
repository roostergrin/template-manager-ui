// React import not needed with react-jsx runtime
import './LoadingOverlay.sass';

const LoadingOverlay = () => (
  <div
    className="loading-overlay"
    role="status"
    aria-live="polite"
    aria-label="Loading, please wait"
    tabIndex={0}
  >
    <div className="loading-overlay__content">
      <svg
        className="loading-overlay__spinner"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="loading-overlay__spinner-bg"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="loading-overlay__spinner-fg"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      <span className="loading-overlay__text">Loading, please wait...</span>
      <span className="loading-overlay__sr-only">Loading, please wait...</span>
    </div>
  </div>
);

export default LoadingOverlay; 