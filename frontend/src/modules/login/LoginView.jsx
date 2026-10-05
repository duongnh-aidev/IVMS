import logoUrl from '../../assets/logo.png';
import { useController } from '../../core/mvc';

const label = { fontSize: 13, fontWeight: 600, color: '#171A20' };
const input = {
  height: 32,
  padding: '0 10px',
  border: '1px solid #D0D1D2',
  borderRadius: 6,
  background: '#FFFFFF',
  font: 'inherit',
  fontSize: 13,
  color: '#171A20',
  outline: 'none',
  transition: 'box-shadow .2s,border-color .2s',
};
const inputClass = 'hover-border-aeb0b4 focus-ring';
/** Sign-in window. */
export default function LoginView({ controller }) {
  const {
    showServer,
    server,
    port,
    user,
    pass,
    setServer,
    setPort,
    setUser,
    setPass,
    serverRing,
    userRing,
    passRing,
    show,
    passType,
    showLabel,
    toggleShow,
    remember,
    toggleRemember,
    error,
    loading,
    submit,
    submitLabel,
    title,
    subtitle,
    passPlaceholder,
    editionLabel,
    editionColor,
  } = useController(controller);

  return (
    <div
      style={{
        minWidth: 480,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          width: 380,
          flex: 'none',
          color: '#171A20',
        }}
      >
        <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <img src={logoUrl} alt="" width={64} height={64} style={{ display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 20, lineHeight: '26px', fontWeight: 600 }}>
              {title} <span style={{ color: '#3E6AE1' }}>IVMS</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: '18px', color: '#5C5E62' }}>{subtitle}</div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {showServer && (
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <span style={label}>Server</span>
                  <input
                    value={server}
                    onChange={setServer}
                    placeholder="192.168.1.10"
                    style={{ ...input, boxShadow: serverRing }}
                    className={inputClass}
                  />
                </label>
                <label style={{ width: 76, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={label}>Port</span>
                  <input value={port} onChange={setPort} placeholder="8000" style={input} className={inputClass} />
                </label>
              </div>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={label}>Username</span>
              <input
                value={user}
                onChange={setUser}
                placeholder="admin"
                autoComplete="username"
                style={{ ...input, boxShadow: userRing }}
                className={inputClass}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={label}>Password</span>
              <div style={{ position: 'relative', display: 'flex' }}>
                <input
                  value={pass}
                  onChange={setPass}
                  type={passType}
                  placeholder={passPlaceholder}
                  autoComplete="current-password"
                  style={{
                    ...input,
                    flex: 1,
                    minWidth: 0,
                    padding: '0 36px 0 10px',
                    boxShadow: passRing,
                  }}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={toggleShow}
                  aria-label={showLabel}
                  title={showLabel}
                  style={{
                    position: 'absolute',
                    right: 3,
                    top: 3,
                    width: 26,
                    height: 26,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 4,
                    color: '#5C5E62',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="hover-color-171a20"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                    {show && <path d="M3 3l18 18" />}
                  </svg>
                </button>
              </div>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: '#393C41',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={toggleRemember}
                  style={{ width: 14, height: 14, margin: 0, accentColor: '#3E6AE1' }}
                />
                Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13 }}>
                Forgot password?
              </a>
            </div>

            {error && (
              <div
                style={{
                  fontSize: 12,
                  lineHeight: '17px',
                  color: '#C62828',
                  background: '#FCEDED',
                  padding: '8px 10px',
                  borderRadius: 6,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                height: 34,
                marginTop: 6,
                border: 'none',
                borderRadius: 6,
                background: '#3E6AE1',
                color: '#FFFFFF',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background-color .2s',
              }}
              className="hover-bg-3457c0"
            >
              {loading && (
                <span
                  style={{
                    width: 12,
                    height: 12,
                    border: '2px solid rgba(255,255,255,.35)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin .8s linear infinite',
                    display: 'inline-block',
                  }}
                />
              )}
              {submitLabel}
            </button>
          </form>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: '#8E8E8E',
            }}
          >
            <span>Version 1.0.0</span>
            <span>·</span>
            <span style={{ fontWeight: 500, color: editionColor }}>{editionLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
