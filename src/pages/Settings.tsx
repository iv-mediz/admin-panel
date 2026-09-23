import { apiBaseUrl, hasApiBackend, isDevBackend } from '../config/api'
import { getAdminUser } from '../auth/session'

export default function Settings() {
  const user = getAdminUser()

  return (
    <div className="page">
      <div className="grid-2">
        <article className="card card-pad">
          <h4 style={{ marginBottom: 14 }}>API (Vercel env)</h4>
          <p className="muted" style={{ marginBottom: 12 }}>
            Set <code>VITE_API_BASE_URL</code> in Vercel → Environment Variables, then redeploy.
          </p>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Backend URL</label>
            <input
              readOnly
              value={hasApiBackend ? apiBaseUrl : '(not set — demo mode)'}
            />
          </div>
          <div className="field">
            <label>Environment</label>
            <input
              readOnly
              value={
                !hasApiBackend
                  ? 'UI only'
                  : isDevBackend()
                    ? 'Dev / staging API'
                    : 'Production API'
              }
            />
          </div>
          {user ? (
            <p className="muted" style={{ marginTop: 12 }}>
              Signed in as {user.email}
            </p>
          ) : null}
        </article>
        <article className="card card-pad">
          <h4 style={{ marginBottom: 14 }}>Brand</h4>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>App name</label>
            <input defaultValue="iv mediz" />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Tagline</label>
            <input defaultValue="Jobs. Ambulance. Care." />
          </div>
          <div className="field">
            <label>Support email</label>
            <input defaultValue="support@ivmediz.app" />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }}>
            Save changes
          </button>
        </article>
        <article className="card card-pad">
          <h4 style={{ marginBottom: 14 }}>Mobile app alignment</h4>
          <p className="muted" style={{ marginBottom: 12 }}>
            This admin panel uses the same teal, navy and status colours as the Flutter app.
          </p>
          <div className="list-item">
            <div className="icon-box" style={{ background: '#0097a7' }} />
            <div>
              <div className="cell-title">Primary teal</div>
              <div className="cell-sub">#0097A7 — buttons, chips, active nav</div>
            </div>
          </div>
          <div className="list-item">
            <div className="icon-box" style={{ background: 'linear-gradient(135deg,#1E3A5F,#0F766E)' }} />
            <div>
              <div className="cell-title">Header gradient</div>
              <div className="cell-sub">Navy to teal — same as Home header</div>
            </div>
          </div>
          <div className="list-item">
            <div className="icon-box" style={{ background: '#16324F' }} />
            <div>
              <div className="cell-title">Navy deep</div>
              <div className="cell-sub">#16324F — titles and hospital names</div>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
