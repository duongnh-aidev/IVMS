import { usePresenter } from '../../core/viper';

export default function HelpView({ presenter }) {
  const { guides, helpContact, helpLogs, hq, noGuides, setHq, shortcuts } = usePresenter(presenter);
  return (
    <>
      <header
        style={{
          height: 64,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 24px 0',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600 }}>Help</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} />
      </header>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: 480 }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8E8E8E"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ position: 'absolute', left: 12 }}
          >
            <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
          </svg>
          <input
            value={hq}
            onChange={setHq}
            placeholder="Search help articles"
            style={{
              width: '100%',
              height: 38,
              padding: '0 12px 0 34px',
              border: '1px solid #D0D1D2',
              borderRadius: 8,
              background: '#FFFFFF',
              font: 'inherit',
              fontSize: 13,
              color: '#171A20',
              outline: 'none',
              transition: 'box-shadow .2s,border-color .2s',
            }}
            className="hover-border-aeb0b4 focus-ring"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {guides.map((g, i) => (
            <div
              key={i}
              onClick={g.onClick}
              style={{
                borderRadius: 12,
                background: '#F4F4F4',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                gap: 10,
                padding: 16,
                cursor: 'pointer',
                transition: 'background-color .2s',
              }}
              className="hover-bg-eeeeee"
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3E6AE1"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={g.d} />
                </svg>
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>{g.title}</span>
              <span style={{ fontSize: 12, lineHeight: '17px', color: '#5C5E62', textWrap: 'pretty' }}>{g.desc}</span>
            </div>
          ))}
        </div>
        {noGuides && <div style={{ fontSize: 13, color: '#8E8E8E' }}>No articles match your search.</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div
            style={{
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              gap: 0,
              flex: '2 1 340px',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Keyboard shortcuts</span>
            {shortcuts.map((k, i) => (
              <div
                key={i}
                style={{
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderBottom: '1px solid #E6E7E9',
                  fontSize: 13,
                }}
              >
                <span style={{ color: '#393C41' }}>{k.label}</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  {k.keys.map((key, i1) => (
                    <span
                      key={i1}
                      style={{
                        minWidth: 24,
                        height: 22,
                        padding: '0 6px',
                        borderRadius: 5,
                        background: '#FFFFFF',
                        boxShadow: 'inset 0 -1px 0 #D0D1D2,0 0 0 1px #E2E3E5',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#171A20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {key}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              gap: 14,
              flex: '1 1 260px',
              alignSelf: 'flex-start',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Contact support</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#5C5E62' }}>Email</span>
                <a href="mailto:support@ivms.vn">support@ivms.vn</a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#5C5E62' }}>Hotline</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>1900 6868</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#5C5E62' }}>Hours</span>
                <span>Mon–Sat, 8:00–18:00</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={helpContact}
                style={{
                  height: 32,
                  padding: '0 14px',
                  border: 'none',
                  borderRadius: 6,
                  background: '#3E6AE1',
                  color: '#FFFFFF',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color .33s',
                }}
                className="hover-bg-3457c0"
              >
                Email support
              </button>
              <button
                onClick={helpLogs}
                style={{
                  height: 32,
                  padding: '0 14px',
                  border: '1px solid #D0D1D2',
                  borderRadius: 6,
                  background: '#FFFFFF',
                  color: '#171A20',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background-color .2s',
                }}
                className="hover-bg-f4f4f4"
              >
                Send diagnostic logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
