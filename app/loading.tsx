export default function Loading() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100dvh", background: "var(--bg)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid var(--primary-100)",
        borderTop: "3px solid var(--primary)",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
