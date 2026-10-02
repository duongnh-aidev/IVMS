import { usePresenter } from '../../core/viper';
import AddStorageModal from './AddStorageModal';

export default function StorageView({ presenter }) {
  const {
    addForm,
    disks2,
    fullOpts,
    openAddStorage,
    resetPolicy,
    retOpts,
    savePolicy,
    stDays,
    stSegs,
    stTotal,
    stUsed,
  } = usePresenter(presenter);
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
        <div style={{ fontSize: 20, fontWeight: 600 }}>Storage</div>
        <button
          onClick={openAddStorage}
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
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'background-color .33s',
          }}
          className="hover-bg-3457c0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add storage
        </button>
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
            minWidth: 0,
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total capacity</span>
            <span style={{ fontSize: 13, color: '#5C5E62', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontWeight: 600, color: '#171A20' }}>{stUsed}</span> used of {stTotal} · about{' '}
              <span style={{ fontWeight: 600, color: '#171A20' }}>{stDays} days</span> of footage
            </span>
          </div>
          <div
            style={{ display: 'flex', height: 10, gap: 2, borderRadius: 5, overflow: 'hidden', background: '#E2E3E5' }}
          >
            {stSegs.map((g, i) => (
              <div key={i} style={{ width: g.w, background: g.bg }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#5C5E62' }}>
            {stSegs.map((g, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: g.bg }} />
                {g.label}
              </span>
            ))}
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
            gap: 0,
            paddingBottom: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Storage locations</span>
          <div
            style={{
              height: 32,
              display: 'grid',
              gridTemplateColumns: 'minmax(120px,1.6fr) minmax(0,1.4fr) minmax(120px,1.4fr) 84px 92px',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              fontWeight: 600,
              color: '#5C5E62',
              borderBottom: '1px solid #E2E3E5',
            }}
          >
            <span>Name</span>
            <span>Path</span>
            <span>Usage</span>
            <span>Role</span>
            <span>Status</span>
          </div>
          {disks2.map((d, i) => (
            <div
              key={i}
              style={{
                height: 56,
                display: 'grid',
                gridTemplateColumns: 'minmax(120px,1.6fr) minmax(0,1.4fr) minmax(120px,1.4fr) 84px 92px',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                borderBottom: '1px solid #E6E7E9',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </span>
                <span style={{ fontSize: 12, color: '#8E8E8E' }}>{d.type}</span>
              </div>
              <span
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 12,
                  color: '#393C41',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.path}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ height: 6, borderRadius: 3, background: '#E2E3E5', overflow: 'hidden' }}>
                  <div style={{ width: d.pct, height: '100%', background: d.bar }} />
                </div>
                <span style={{ fontSize: 12, color: '#5C5E62', fontVariantNumeric: 'tabular-nums' }}>{d.usage}</span>
              </div>
              <span style={{ color: '#393C41' }}>{d.role}</span>
              <div>
                <span
                  style={{
                    height: 22,
                    padding: '0 8px',
                    borderRadius: 11,
                    background: d.sBg,
                    color: d.sColor,
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.sDot }} />
                  {d.status}
                </span>
              </div>
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
            gap: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Recording policy</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              padding: '14px 0',
              borderBottom: '1px solid #E6E7E9',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 200, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Retention period</span>
              <span style={{ fontSize: 12, lineHeight: '17px', color: '#5C5E62' }}>
                Footage older than this is deleted automatically.
              </span>
            </div>
            <div
              style={{ display: 'flex', gap: 2, padding: 3, background: '#FFFFFF', borderRadius: 7, flexWrap: 'wrap' }}
            >
              {retOpts.map((o, i) => (
                <button
                  key={i}
                  onClick={o.onClick}
                  style={{
                    height: 28,
                    padding: '0 12px',
                    border: 'none',
                    borderRadius: 5,
                    background: o.bg,
                    color: o.color,
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color .33s,color .33s',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              padding: '14px 0',
              borderBottom: '1px solid #E6E7E9',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 200, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>When storage is full</span>
              <span style={{ fontSize: 12, lineHeight: '17px', color: '#5C5E62' }}>
                Choose what happens when all recording locations are full.
              </span>
            </div>
            <div
              style={{ display: 'flex', gap: 2, padding: 3, background: '#FFFFFF', borderRadius: 7, flexWrap: 'wrap' }}
            >
              {fullOpts.map((o, i) => (
                <button
                  key={i}
                  onClick={o.onClick}
                  style={{
                    height: 28,
                    padding: '0 12px',
                    border: 'none',
                    borderRadius: 5,
                    background: o.bg,
                    color: o.color,
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color .33s,color .33s',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 14 }}>
            <button
              onClick={resetPolicy}
              style={{
                height: 34,
                padding: '0 16px',
                border: '1px solid #D0D1D2',
                borderRadius: 6,
                background: '#FFFFFF',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                color: '#171A20',
                cursor: 'pointer',
                transition: 'background-color .2s',
              }}
              className="hover-bg-eeeeee"
            >
              Reset
            </button>
            <button
              onClick={savePolicy}
              style={{
                height: 34,
                padding: '0 18px',
                border: 'none',
                borderRadius: 6,
                background: '#3E6AE1',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                color: '#FFFFFF',
                cursor: 'pointer',
                transition: 'background-color .33s',
              }}
              className="hover-bg-3457c0"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
      {addForm && <AddStorageModal {...addForm} />}
    </>
  );
}
