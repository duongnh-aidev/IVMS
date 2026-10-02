import { useEffect } from 'react';
import { usePresenter } from '../../core/viper';

export default function RecordingView({ presenter }) {
  const {
    addHoliday,
    holidays,
    recBuffers,
    recHours,
    recModes,
    recRows,
    recSummary,
    recTarget,
    recTemplates,
    saveSched,
    setRecTarget,
  } = usePresenter(presenter);
  // A paint stroke ends wherever the mouse is released.
  useEffect(() => {
    window.addEventListener('mouseup', presenter.endPaint);
    return () => window.removeEventListener('mouseup', presenter.endPaint);
  }, [presenter]);
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
        <div style={{ fontSize: 20, fontWeight: 600 }}>Recording</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#5C5E62' }}>Apply to</span>
          <select
            value={recTarget}
            onChange={setRecTarget}
            style={{
              height: 32,
              padding: '0 10px',
              border: '1px solid #D0D1D2',
              borderRadius: 6,
              background: '#FFFFFF',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              color: '#171A20',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All devices</option>
            <option value="hq">Head Office</option>
            <option value="hq-a">Building A</option>
            <option value="hq-b">Building B</option>
            <option value="wh">Warehouse</option>
          </select>
          <button
            onClick={saveSched}
            style={{
              height: 32,
              padding: '0 16px',
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
            Save
          </button>
        </div>
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
        <div
          style={{
            borderRadius: 12,
            background: '#F4F4F4',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Weekly schedule</span>
              <span style={{ fontSize: 12, color: '#5C5E62' }}>
                Pick a mode, then click or drag across the grid to paint.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 2, padding: 3, background: '#FFFFFF', borderRadius: 7 }}>
              {recModes.map((m, i) => (
                <button
                  key={i}
                  onClick={m.onClick}
                  style={{
                    height: 28,
                    padding: '0 12px',
                    border: 'none',
                    borderRadius: 5,
                    background: m.bg,
                    color: m.color,
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'background-color .2s',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: m.swatch,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)',
                    }}
                  />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#5C5E62', alignSelf: 'center', marginRight: 4 }}>Templates</span>
            {recTemplates.map((t, i) => (
              <button
                key={i}
                onClick={t.onClick}
                style={{
                  height: 26,
                  padding: '0 10px',
                  border: 'none',
                  borderRadius: 13,
                  background: t.bg,
                  color: t.color,
                  font: 'inherit',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color .2s',
                  '--hover-background': t.hoverBg,
                }}
                className="hover-bg-var"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, userSelect: 'none' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '40px repeat(24,minmax(0,1fr))',
                gap: 2,
                fontSize: 10,
                color: '#8E8E8E',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span />
              {recHours.map((hr, i) => (
                <span key={i}>{hr}</span>
              ))}
            </div>
            {recRows.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px repeat(24,minmax(0,1fr))', gap: 2 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 500, color: '#393C41', display: 'flex', alignItems: 'center' }}
                >
                  {r.day}
                </span>
                {r.cells.map((c, i1) => (
                  <div
                    key={i1}
                    onMouseDown={c.down}
                    onMouseEnter={c.enter}
                    title={c.title}
                    style={{
                      height: 26,
                      borderRadius: 3,
                      background: c.bg,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.05)',
                      cursor: 'crosshair',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: '#5C5E62' }}>
            {recSummary.map((x, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: x.swatch,
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)',
                  }}
                />
                <span>{x.label}</span> · <span style={{ fontWeight: 600, color: '#171A20' }}>{x.hours}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: '1 1 320px',
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Event recording</span>
            {recBuffers.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: '#171A20' }}>{b.label}</span>
                  <span style={{ fontSize: 12, color: '#5C5E62' }}>{b.desc}</span>
                </div>
                <div
                  style={{ display: 'flex', gap: 2, padding: 3, background: '#FFFFFF', borderRadius: 7, flex: 'none' }}
                >
                  {b.opts.map((o, i1) => (
                    <button
                      key={i1}
                      onClick={o.onClick}
                      style={{
                        height: 26,
                        padding: '0 10px',
                        border: 'none',
                        borderRadius: 5,
                        background: o.bg,
                        color: o.color,
                        font: 'inherit',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              flex: '1 1 320px',
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Holiday exceptions</span>
              <button
                onClick={addHoliday}
                style={{
                  height: 26,
                  padding: '0 10px',
                  border: 'none',
                  borderRadius: 5,
                  background: '#FFFFFF',
                  font: 'inherit',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#171A20',
                  cursor: 'pointer',
                }}
                className="hover-bg-eeeeee"
              >
                Add date
              </button>
            </div>
            {holidays.map((d, i) => (
              <div
                key={i}
                style={{
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  borderBottom: '1px solid #E6E7E9',
                }}
              >
                <span style={{ width: 96, flex: 'none', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                  {d.date}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    color: '#393C41',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.name}
                </span>
                <span style={{ fontSize: 12, color: '#5C5E62' }}>{d.rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
