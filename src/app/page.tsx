export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'monospace', color: '#c4b5fd', background: '#030305', minHeight: '100vh' }}>
      <h1>AuraFlow Data Training Engine</h1>
      <p>Diagnostic scoring, XGBoost model training, and Hermes fine-tuning pipeline.</p>
      <hr style={{ borderColor: 'rgba(139,92,246,0.2)', margin: '1rem 0' }} />
      <ul>
        <li>750 mock datasets across 15 verticals</li>
        <li>163 data points → 7 dimensions → Foundation Score (0-100)</li>
        <li>12 diagnostic skills + MasterOrchestrator</li>
        <li>Self-learning feedback loop + vector memory</li>
      </ul>
      <p style={{ marginTop: '1rem', color: '#7c7291' }}>
        API endpoints at /api/webhooks
      </p>
    </main>
  )
}
