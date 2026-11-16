export default function PageLoader({
  label = 'Carregando página...',
  variant = 'page'
}) {
  const isInline = variant === 'inline';

  return (
    <div
      className={`page-loader${isInline ? ' page-loader-inline' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="page-loader-spinner" aria-hidden="true" />
      <span className="page-loader-label">{label}</span>
    </div>
  );
}
