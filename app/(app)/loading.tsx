export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <div className="skeleton h-12 w-64" />
      <div className="skeleton h-4 w-80 max-w-full" />
      <div className="skeleton h-72" />
      <div className="skeleton h-48" />
    </div>
  );
}
