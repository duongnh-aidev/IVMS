import { useController } from '../../core/mvc';

export default function DashboardView({ controller }) {
  const { disks, events, eventsTotal, goDevices, health, hours, kpis } = useController(controller);
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
        <div style={{ fontSize: 20, fontWeight: 600 }}>Dashboard</div>
        <div style={{ fontSize: 13, color: '#5C5E62' }}>Last 24 hours · Updated just now</div>
      </header>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
          {kpis.map((k, i) => (
            <div
              key={i}
              style={{
                borderRadius: 12,
                background: '#F4F4F4',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                gap: 10,
              }}
            >
              <span style={{ fontSize: 13, color: '#5C5E62' }}>{k.label}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    fontSize: 28,
                    lineHeight: '32px',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    color: k.color,
                  }}
                >
                  {k.value}
                </span>
                <span style={{ fontSize: 13, color: '#8E8E8E' }}>{k.unit}</span>
              </div>
              <span style={{ fontSize: 12, color: '#5C5E62' }}>{k.note}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div
            style={{
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              gap: 16,
              flex: '1 1 380px',
              minHeight: 240,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Events per hour</span>
              <span style={{ fontSize: 12, color: '#5C5E62' }}>{eventsTotal} events today</span>
            </div>
            <div style={{ flex: 1, minHeight: 140, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {hours.map((b, i) => (
                <div
                  key={i}
                  title={b.title}
                  style={{ flex: 1, minWidth: 0, height: b.h, background: b.bg, borderRadius: '3px 3px 0 0' }}
                />
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#8E8E8E',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>Now</span>
            </div>
          </div>
          <div
            style={{
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              gap: 8,
              flex: '1 1 380px',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20', marginBottom: 6 }}>Recent events</span>
            {events.map((e, i) => (
              <div
                key={i}
                style={{
                  height: 44,
                  display: 'grid',
                  gridTemplateColumns: '56px minmax(0,1.4fr) minmax(0,1fr) auto',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  borderBottom: '1px solid #E6E7E9',
                }}
              >
                <span style={{ color: '#5C5E62', fontVariantNumeric: 'tabular-nums' }}>{e.time}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 6, height: 6, flex: 'none', borderRadius: '50%', background: e.dot }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.type}</span>
                </span>
                <span style={{ color: '#393C41', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.cam}
                </span>
                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12 }}>
                  View clip
                </a>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div
            style={{
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              gap: 16,
              flex: '1 1 0',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Device health</span>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
              {health.map((x, i) => (
                <div key={i} style={{ flex: x.n, background: x.dot }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {health.map((x, i) => (
                <div
                  key={i}
                  style={{
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    borderBottom: '1px solid #E6E7E9',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.dot }} />
                  <span style={{ flex: 1, color: '#393C41' }}>{x.label}</span>
                  <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{x.n}</span>
                </div>
              ))}
            </div>
            <button
              onClick={goDevices}
              style={{
                alignSelf: 'flex-start',
                height: 30,
                padding: '0 12px',
                border: 'none',
                borderRadius: 6,
                background: '#FFFFFF',
                font: 'inherit',
                fontSize: 12,
                fontWeight: 500,
                color: '#171A20',
                cursor: 'pointer',
                transition: 'background-color .33s',
              }}
              className="hover-bg-eeeeee"
            >
              View devices
            </button>
          </div>
          <div
            style={{
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              gap: 16,
              flex: '1 1 0',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Storage</span>
            {disks.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#393C41' }}>{d.name}</span>
                  <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{d.pct}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#E2E3E5', overflow: 'hidden' }}>
                  <div style={{ width: d.pct, height: '100%', background: d.bar }} />
                </div>
                <span style={{ fontSize: 12, color: '#8E8E8E' }}>{d.note}</span>
              </div>
            ))}
            <div
              style={{
                marginTop: 'auto',
                fontSize: 12,
                lineHeight: '17px',
                color: '#5C5E62',
                background: '#FFFFFF',
                padding: '10px 12px',
                borderRadius: 6,
              }}
            >
              About <span style={{ fontWeight: 600, color: '#171A20' }}>18 days</span> of footage retained at current
              bitrate.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
