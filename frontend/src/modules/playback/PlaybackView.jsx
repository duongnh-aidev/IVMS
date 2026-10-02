import { useEffect, useRef } from 'react';
import { useElementWidth } from '../../core/useElementWidth';
import { usePresenter } from '../../core/viper';
import ExportModal from './ExportModal';
import { Fragment } from 'react';

export default function PlaybackView({ presenter }) {
  const {
    exportForm,
    addBookmark,
    calBtnBg,
    calDays,
    calNext,
    calOpen,
    calPrev,
    calTitle,
    calToday,
    nextDayColor,
    openExport,
    pbCamList,
    pbDateLabel,
    pbEvFilters,
    pbEvList,
    pbHeadLeft,
    pbHoverCam,
    pbHoverLeft,
    pbHoverOn,
    pbHoverShift,
    pbHoverThumb,
    pbHoverTime,
    pbIsToday,
    pbMarkFlags,
    pbMarkList,
    pbNextDay,
    pbNoEvents,
    pbNoMarks,
    pbPlayD,
    pbPlayTitle,
    pbPrevDay,
    pbReverse,
    pbRows,
    pbSelInfo,
    pbSpeedVal,
    pbStepBack,
    pbStepFwd,
    pbTabCams,
    pbTabEvents,
    pbTabMarks,
    pbTabs,
    pbTicks,
    pbTimeLabel,
    pbToggle,
    pbZooms,
    pvCenter,
    pvCenterColor,
    pvName,
    pvState,
    setPbSpeed,
    toggleCal,
  } = usePresenter(presenter);

  // Timeline pointer -> fraction of the visible window; dragging keeps seeking until mouseup anywhere.
  const tlRef = useElementWidth(presenter.setTimelineWidth);
  const dragging = useRef(false);
  const fractionAt = (clientX) => {
    const r = tlRef.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const tlDown = (e) => {
    dragging.current = true;
    presenter.seekToFraction(fractionAt(e.clientX));
  };
  const tlMove = (e) => presenter.hoverAt(fractionAt(e.clientX));
  const tlLeave = () => presenter.hoverAt(null);
  useEffect(() => {
    const move = (e) => dragging.current && tlRef.current && presenter.seekToFraction(fractionAt(e.clientX));
    const up = () => (dragging.current = false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
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
        <div style={{ fontSize: 20, fontWeight: 600 }}>Playback</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 32,
                border: '1px solid #D0D1D2',
                borderRadius: 6,
                background: '#FFFFFF',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={pbPrevDay}
                title="Previous day"
                style={{
                  width: 30,
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: '#393C41',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="hover-bg-f4f4f4"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                onClick={toggleCal}
                style={{
                  height: '100%',
                  padding: '0 12px',
                  border: 'none',
                  borderLeft: '1px solid #EEEEEE',
                  borderRight: '1px solid #EEEEEE',
                  background: calBtnBg,
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#171A20',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                className="hover-bg-f4f4f4"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5C5E62"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" />
                </svg>
                {pbDateLabel}
              </button>
              <button
                onClick={pbNextDay}
                title="Next day"
                disabled={pbIsToday}
                style={{
                  width: 30,
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: nextDayColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="hover-bg-f4f4f4"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            {calOpen && (
              <>
                <div onClick={toggleCal} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 40,
                    zIndex: 10,
                    width: 280,
                    padding: 14,
                    background: '#FFFFFF',
                    borderRadius: 10,
                    boxShadow: '0 0 0 0.5px rgba(0,0,0,.14),0 14px 36px rgba(0,0,0,.16)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={calPrev}
                      title="Previous month"
                      style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        borderRadius: 6,
                        background: 'transparent',
                        color: '#393C41',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="hover-bg-f4f4f4"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 6l-6 6 6 6" />
                      </svg>
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>{calTitle}</span>
                    <button
                      onClick={calNext}
                      title="Next month"
                      style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        borderRadius: 6,
                        background: 'transparent',
                        color: '#393C41',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="hover-bg-f4f4f4"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7,minmax(0,1fr))',
                      gap: 2,
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#8E8E8E',
                      textAlign: 'center',
                    }}
                  >
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                    <span>Su</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 2 }}>
                    {calDays.map((d, i) => (
                      <button
                        key={i}
                        onClick={d.onClick}
                        disabled={d.disabled}
                        style={{
                          position: 'relative',
                          height: 32,
                          border: 'none',
                          borderRadius: 6,
                          background: d.bg,
                          boxShadow: d.ring,
                          color: d.color,
                          font: 'inherit',
                          fontSize: 12,
                          fontWeight: d.weight,
                          fontVariantNumeric: 'tabular-nums',
                          cursor: d.cursor,
                          visibility: d.vis,
                          '--hover-background': d.hoverBg,
                        }}
                        className="hover-bg-var"
                      >
                        {d.label}
                        <span
                          style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: 4,
                            width: 4,
                            height: 4,
                            marginLeft: -2,
                            borderRadius: '50%',
                            background: d.dot,
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 8,
                      borderTop: '1px solid #EEEEEE',
                      fontSize: 11,
                      color: '#5C5E62',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3E6AE1' }} />
                      Has recordings
                    </span>
                    <button
                      onClick={calToday}
                      style={{
                        height: 24,
                        padding: '0 10px',
                        border: 'none',
                        borderRadius: 5,
                        background: '#F4F4F4',
                        font: 'inherit',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#171A20',
                        cursor: 'pointer',
                      }}
                      className="hover-bg-eeeeee"
                    >
                      Today
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={openExport}
            style={{
              height: 32,
              padding: '0 14px',
              border: 'none',
              borderRadius: 6,
              background: '#171A20',
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
            className="hover-bg-393c41"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            Export
          </button>
        </div>
      </header>
      <div
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 24px 12px' }}
      >
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12 }}>
          <div
            style={{
              width: 220,
              flex: 'none',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 12,
              background: '#F4F4F4',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 10px 6px' }}>
              <div style={{ display: 'flex', gap: 2, padding: 3, background: '#E6E7E9', borderRadius: 7 }}>
                {pbTabs.map((o, i) => (
                  <button
                    key={i}
                    onClick={o.onClick}
                    style={{
                      flex: 1,
                      height: 26,
                      border: 'none',
                      borderRadius: 5,
                      background: o.bg,
                      color: o.color,
                      boxShadow: o.shadow,
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
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '4px 8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {pbTabCams && (
                <>
                  <div style={{ fontSize: 12, color: '#5C5E62', padding: '4px 10px 6px' }}>{pbSelInfo}</div>
                  {pbCamList.map((c, i) => (
                    <div
                      key={i}
                      onClick={c.onClick}
                      style={{
                        height: 34,
                        flex: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0 10px',
                        borderRadius: 6,
                        background: c.rowBg,
                        fontSize: 13,
                        fontWeight: c.weight,
                        color: c.color,
                        cursor: 'default',
                        transition: 'background-color .2s',
                      }}
                      className="hover-bg-ebecee"
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          flex: 'none',
                          borderRadius: '50%',
                          border: `1px solid ${c.boxBorder}`,
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {c.on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3E6AE1' }} />}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.name}
                      </span>
                    </div>
                  ))}
                </>
              )}
              {pbTabEvents && (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '2px 2px 8px' }}>
                    {pbEvFilters.map((f, i) => (
                      <button
                        key={i}
                        onClick={f.onClick}
                        style={{
                          height: 24,
                          padding: '0 10px',
                          border: 'none',
                          borderRadius: 12,
                          background: f.bg,
                          color: f.color,
                          font: 'inherit',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {pbEvList.map((e, i) => (
                    <div
                      key={i}
                      onClick={e.onClick}
                      style={{
                        flex: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: e.bg,
                        cursor: 'default',
                        transition: 'background-color .2s',
                      }}
                      className="hover-bg-ebecee"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#171A20' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.dot, flex: 'none' }} />
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.type}
                        </span>
                        <span style={{ fontSize: 12, color: '#5C5E62', fontVariantNumeric: 'tabular-nums' }}>
                          {e.time}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#8E8E8E',
                          paddingLeft: 14,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {e.cam}
                      </span>
                    </div>
                  ))}
                  {pbNoEvents && (
                    <div style={{ fontSize: 12, color: '#8E8E8E', padding: '12px 10px' }}>
                      No events for the selected cameras.
                    </div>
                  )}
                </>
              )}
              {pbTabMarks && (
                <>
                  {pbMarkList.map((m, i) => (
                    <div
                      key={i}
                      onClick={m.onClick}
                      style={{
                        flex: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'default',
                        transition: 'background-color .2s',
                      }}
                      className="hover-bg-ebecee"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#171A20' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#171A20">
                          <path d="M6 3h12v18l-6-4-6 4z" />
                        </svg>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.note}
                        </span>
                        <span style={{ fontSize: 12, color: '#5C5E62', fontVariantNumeric: 'tabular-nums' }}>
                          {m.time}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#8E8E8E',
                          paddingLeft: 20,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.cams}
                      </span>
                    </div>
                  ))}
                  {pbNoMarks && (
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: '17px',
                        color: '#8E8E8E',
                        padding: '12px 10px',
                        textWrap: 'pretty',
                      }}
                    >
                      No bookmarks yet. Use the bookmark button in the player to mark a moment.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: 0,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#171A20',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'repeating-linear-gradient(135deg,#1d2027 0 14px,#191c22 14px 28px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: pvCenterColor,
              }}
            >
              {pvCenter}
            </div>
            <div
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                top: 14,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pvName}
                </span>
                <span style={{ fontSize: 12, color: '#D0D1D2', fontVariantNumeric: 'tabular-nums' }}>
                  {pbDateLabel} · {pbTimeLabel}
                </span>
              </div>
              <span
                style={{
                  flex: 'none',
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 11,
                  background: 'rgba(255,255,255,.14)',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {pvState}
              </span>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                bottom: 12,
                height: 48,
                padding: '0 8px',
                borderRadius: 10,
                background: 'rgba(23,26,32,.72)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#FFFFFF',
              }}
            >
              <button
                onClick={pbReverse}
                title="Play backward"
                style={{
                  width: 32,
                  height: 32,
                  flex: 'none',
                  padding: 0,
                  border: 'none',
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color .2s',
                }}
                className="hover-bg-white-14"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 5v14L6 12z" />
                </svg>
              </button>
              <button
                onClick={pbStepBack}
                title="Previous frame"
                style={{
                  width: 32,
                  height: 32,
                  flex: 'none',
                  padding: 0,
                  border: 'none',
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color .2s',
                }}
                className="hover-bg-white-14"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5h2v14H6zM18 5v14L9 12z" />
                </svg>
              </button>
              <button
                onClick={pbToggle}
                title={pbPlayTitle}
                style={{
                  width: 36,
                  height: 36,
                  flex: 'none',
                  padding: 0,
                  border: 'none',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  color: '#171A20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color .2s',
                }}
                className="hover-bg-e6e7e9"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={pbPlayD} />
                </svg>
              </button>
              <button
                onClick={pbStepFwd}
                title="Next frame"
                style={{
                  width: 32,
                  height: 32,
                  flex: 'none',
                  padding: 0,
                  border: 'none',
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color .2s',
                }}
                className="hover-bg-white-14"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 5h2v14h-2zM6 5v14l9-7z" />
                </svg>
              </button>
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  flex: 'none',
                }}
              >
                {pbTimeLabel}
              </span>
              <div style={{ flex: 1, minWidth: 0 }} />
              <select
                value={pbSpeedVal}
                onChange={setPbSpeed}
                title="Playback speed"
                style={{
                  height: 30,
                  padding: '0 8px',
                  border: '1px solid rgba(255,255,255,.24)',
                  borderRadius: 6,
                  background: 'transparent',
                  font: 'inherit',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="0.25" style={{ color: '#171A20' }}>
                  0.25×
                </option>
                <option value="0.5" style={{ color: '#171A20' }}>
                  0.5×
                </option>
                <option value="1" style={{ color: '#171A20' }}>
                  1×
                </option>
                <option value="2" style={{ color: '#171A20' }}>
                  2×
                </option>
                <option value="4" style={{ color: '#171A20' }}>
                  4×
                </option>
                <option value="8" style={{ color: '#171A20' }}>
                  8×
                </option>
                <option value="16" style={{ color: '#171A20' }}>
                  16×
                </option>
              </select>
              <button
                onClick={addBookmark}
                title="Bookmark this moment"
                style={{
                  width: 32,
                  height: 32,
                  flex: 'none',
                  padding: 0,
                  border: 'none',
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color .2s',
                }}
                className="hover-bg-white-14"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                >
                  <path d="M6 3h12v18l-6-4-6 4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 'none',
            borderRadius: 12,
            background: '#FFFFFF',
            boxShadow: 'inset 0 0 0 1px #EEEEEE',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 140, flex: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 2, padding: 2, background: '#F4F4F4', borderRadius: 7 }}>
                  {pbZooms.map((o, i) => (
                    <button
                      key={i}
                      onClick={o.onClick}
                      title={o.title}
                      style={{
                        minWidth: 30,
                        height: 18,
                        padding: '0 8px',
                        border: 'none',
                        borderRadius: 5,
                        background: o.bg,
                        color: o.color,
                        boxShadow: o.shadow,
                        font: 'inherit',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontVariantNumeric: 'tabular-nums',
                        transition: 'background-color .33s,color .33s',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {pbRows.map((r, i) => (
                <div
                  key={i}
                  onClick={r.onFocus}
                  title="Show in preview"
                  style={{
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0 6px',
                    borderRadius: 4,
                    background: r.labelBg,
                    fontSize: 12,
                    fontWeight: r.weight,
                    color: r.color,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ width: 6, height: 6, flex: 'none', borderRadius: '50%', background: r.dot }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                </div>
              ))}
            </div>
            <div
              ref={tlRef}
              onMouseDown={tlDown}
              onMouseMove={tlMove}
              onMouseLeave={tlLeave}
              style={{
                position: 'relative',
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ position: 'relative', height: 22, borderBottom: '1px solid #EEEEEE' }}>
                {pbTicks.map((k, i) => (
                  <Fragment key={i}>
                    <div
                      style={{
                        position: 'absolute',
                        left: k.left,
                        bottom: 0,
                        height: 6,
                        width: 1,
                        background: '#D0D1D2',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: k.left,
                        top: 0,
                        transform: 'translateX(-50%)',
                        fontSize: 10,
                        color: '#8E8E8E',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {k.label}
                    </div>
                  </Fragment>
                ))}
                {pbMarkFlags.map((m, i) => (
                  <div
                    key={i}
                    title={m.note}
                    style={{
                      position: 'absolute',
                      left: m.left,
                      bottom: -1,
                      transform: 'translateX(-50%)',
                      width: 8,
                      height: 10,
                      background: '#171A20',
                      clipPath: 'polygon(0 0,100% 0,100% 100%,50% 70%,0 100%)',
                    }}
                  />
                ))}
              </div>
              {pbRows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    height: 20,
                    borderRadius: 3,
                    background: r.trackBg,
                    overflow: 'hidden',
                  }}
                >
                  {r.segs.map((g, i1) => (
                    <div
                      key={i1}
                      style={{
                        position: 'absolute',
                        top: 4,
                        bottom: 4,
                        left: g.left,
                        width: g.width,
                        background: '#B9BBBF',
                        borderRadius: 2,
                      }}
                    />
                  ))}
                  {r.evts.map((e, i1) => (
                    <div
                      key={i1}
                      title={e.title}
                      style={{
                        position: 'absolute',
                        top: 2,
                        bottom: 2,
                        left: e.left,
                        width: 3,
                        background: e.color,
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </div>
              ))}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pbHeadLeft,
                  width: 2,
                  marginLeft: -1,
                  background: '#3E6AE1',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: -4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#3E6AE1',
                  }}
                />
              </div>
              {pbHoverOn && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: pbHoverLeft,
                      width: 1,
                      background: 'rgba(23,26,32,.35)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: pbHoverLeft,
                      transform: `translateX(${pbHoverShift})`,
                      zIndex: 5,
                      width: 168,
                      padding: 6,
                      background: '#FFFFFF',
                      borderRadius: 8,
                      boxShadow: '0 0 0 0.5px rgba(0,0,0,.14),0 10px 24px rgba(0,0,0,.16)',
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        height: 88,
                        borderRadius: 4,
                        background: 'repeating-linear-gradient(135deg,#1d2027 0 10px,#191c22 10px 20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 10,
                        color: '#8E8E8E',
                      }}
                    >
                      {pbHoverThumb}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span
                        style={{ color: '#5C5E62', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {pbHoverCam}
                      </span>
                      <span style={{ fontWeight: 500, color: '#171A20', fontVariantNumeric: 'tabular-nums' }}>
                        {pbHoverTime}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, paddingLeft: 150, fontSize: 11, color: '#5C5E62', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 6, borderRadius: 2, background: '#B9BBBF' }} />
              Recording
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 10, borderRadius: 1, background: '#3E6AE1' }} />
              Motion / AI event
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 10, borderRadius: 1, background: '#E5484D' }} />
              Tampering / signal loss
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 10,
                  background: '#171A20',
                  clipPath: 'polygon(0 0,100% 0,100% 100%,50% 70%,0 100%)',
                }}
              />
              Bookmark
            </span>
          </div>
        </div>
      </div>
      {exportForm && <ExportModal {...exportForm} />}
    </>
  );
}
