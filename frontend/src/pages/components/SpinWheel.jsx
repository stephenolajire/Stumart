// components/SpinWheel.jsx
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useGift } from "../../hooks/useGift";
import { GlobalContext } from "../../constant/GlobalContext";

// ── constants ─────────────────────────────────────────────────────────────────
const CANVAS_SIZE = 320;
const SPIN_DURATION = 6000; // ms — long enough to feel like Temu
const MIN_ROTATIONS = 8; // guaranteed full laps before stopping

const SEGMENT_COLORS = [
  "#FF6B35",
  "#FFB800",
  "#FF4E88",
  "#7B5EA7",
  "#4ECDC4",
  "#FF6B6B",
  "#45B7D1",
  "#2ECC71",
];
const SEGMENT_EMOJIS = ["🚚", "🏷️", "📦", "💰", "🎁", "🔄", "✂️", "💳"];

// ── easing ────────────────────────────────────────────────────────────────────
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// ── format next spin ──────────────────────────────────────────────────────────
const formatNextSpin = (isoStr) => {
  if (!isoStr) return "";
  const dt = new Date(isoStr);
  const diffMs = dt.getTime() - Date.now();
  if (diffMs <= 0) return "now";
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffM = Math.floor((diffMs % 3_600_000) / 60_000);
  if (diffH >= 24) return "tomorrow";
  if (diffH > 0) return `in ${diffH}h ${diffM}m`;
  return `in ${diffM}m`;
};

// ── canvas draw ───────────────────────────────────────────────────────────────
const drawWheel = (canvas, items, angle) => {
  const ctx = canvas.getContext("2d");
  if (!ctx || !items.length) return;

  const W = canvas.width,
    H = canvas.height;
  const cx = W / 2,
    cy = H / 2;
  const R = Math.min(cx, cy) - 6;
  const n = items.length;
  const SA = (2 * Math.PI) / n; // segment angle

  ctx.clearRect(0, 0, W, H);

  items.forEach((item, i) => {
    const start = angle + i * SA;
    const end = start + SA;
    const mid = start + SA / 2;
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    // Segment
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, end);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Sheen
    const sheen = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    sheen.addColorStop(0, "rgba(255,255,255,0.22)");
    sheen.addColorStop(0.55, "rgba(255,255,255,0.04)");
    sheen.addColorStop(1, "rgba(0,0,0,0.10)");
    ctx.fillStyle = sheen;
    ctx.fill();

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label pill + text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid);

    const fz = Math.max(9, Math.min(11, R * 0.082));
    ctx.font = `bold ${fz}px sans-serif`;
    const label =
      item.name.length > 12 ? item.name.slice(0, 11) + "…" : item.name;
    const tw = ctx.measureText(label).width;
    const px = R * 0.44,
      pw = tw + 14,
      ph = 17;

    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.roundRect(px - pw / 2, -ph / 2, pw, ph, 8);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 3;
    ctx.fillText(label, px, 0);
    ctx.restore();
  });

  // Outer dot ring
  const dots = n * 3;
  for (let i = 0; i < dots; i++) {
    const a = angle + (i / dots) * 2 * Math.PI;
    const large = i % 3 === 0;
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(a) * (R - 1),
      cy + Math.sin(a) * (R - 1),
      large ? 4.5 : 2.5,
      0,
      2 * Math.PI,
    );
    ctx.fillStyle = large ? "#FFD700" : "#fff";
    ctx.fill();
  }

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center hub
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#FF6B35";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
  const hg = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, 14);
  hg.addColorStop(0, "#FFA040");
  hg.addColorStop(1, "#FF6B35");
  ctx.fillStyle = hg;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
};

// ── Result Modal ──────────────────────────────────────────────────────────────
const ResultModal = ({ spinResult, wheelItems, onClose }) => {
  if (!spinResult) return null;

  const item = spinResult.gift_item;
  const idx = wheelItems.findIndex((w) => w.id === item.id);
  const color = SEGMENT_COLORS[idx >= 0 ? idx % SEGMENT_COLORS.length : 0];
  const emoji = SEGMENT_EMOJIS[idx >= 0 ? idx % SEGMENT_EMOJIS.length : 0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "ri-fade 0.22s ease",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.68)",
          backdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 320,
          borderRadius: 28,
          background: "#fff",
          boxShadow: "0 28px 72px rgba(0,0,0,0.32)",
          textAlign: "center",
          overflow: "hidden",
          animation: "ri-pop 0.45s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Colour stripe matching the winning segment */}
        <div style={{ height: 7, background: color }} />

        <div style={{ padding: "24px 22px 22px" }}>
          {/* Big emoji */}
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 10 }}>
            🎉
          </div>

          <h3
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#111",
              margin: "0 0 4px",
            }}
          >
            You Won!
          </h3>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 22px" }}>
            {spinResult.message}
          </p>

          {/* Prize display */}
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 22,
              margin: "0 auto 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              background: color + "20",
              border: `3px solid ${color}`,
            }}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 19,
                }}
              />
            ) : (
              <span style={{ fontSize: 44 }}>{emoji}</span>
            )}
          </div>

          {/* Prize name */}
          <p
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#111",
              margin: "0 0 6px",
            }}
          >
            {item.name}
          </p>

          {/* Cart confirmation */}
          {spinResult.cart_item && (
            <p
              style={{
                fontSize: 12,
                color: "#2ECC71",
                fontWeight: 700,
                margin: "0 0 16px",
              }}
            >
              ✓ Added to your cart
            </p>
          )}

          {/* "You landed on…" pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 20,
              padding: "9px 16px",
              borderRadius: 12,
              background: "#f8f9fa",
              border: "1px solid #e9ecef",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: "#555" }}>
              Wheel stopped on&nbsp;
              <strong style={{ color: "#111" }}>{item.name}</strong>
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 16,
              border: "none",
              background: `linear-gradient(135deg,${color},#FF9900)`,
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 0.2,
            }}
          >
            Awesome! 🎊
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ri-fade { from{opacity:0} to{opacity:1} }
        @keyframes ri-pop  {
          from { transform:scale(0.55) translateY(70px); opacity:0 }
          to   { transform:scale(1)   translateY(0);    opacity:1 }
        }
      `}</style>
    </div>
  );
};

// ── Login nudge ───────────────────────────────────────────────────────────────
const LoginNudge = ({ onLogin }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      padding: "8px 0",
    }}
  >
    <p
      style={{
        fontSize: 12,
        color: "#9ca3af",
        textAlign: "center",
        maxWidth: 200,
        margin: 0,
      }}
    >
      Sign in to spin daily and win free gifts!
    </p>
    <button
      onClick={onLogin}
      style={{
        padding: "10px 28px",
        borderRadius: 999,
        border: "none",
        background: "linear-gradient(135deg,#FF6B35,#FF9900)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(255,107,0,0.35)",
      }}
    >
      Sign in to spin 🎰
    </button>
  </div>
);

// ── ring + pointer CSS ────────────────────────────────────────────────────────
const RING_CSS = `
  @keyframes sw-ring  { to { transform:rotate(360deg); } }
  @keyframes sw-ptr   {
    0%,100% { transform:translateX(-50%) translateY(0); }
    50%     { transform:translateX(-50%) translateY(-4px); }
  }
  @keyframes sw-spin  { to { transform:rotate(360deg); } }
`;

// ── Component ─────────────────────────────────────────────────────────────────
const SpinWheel = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(GlobalContext);

  const {
    wheelItems,
    isLoadingWheel,
    canSpin,
    nextSpin,
    doSpin,
    isSpinning,
    spinResult,
    resetSpin,
  } = useGift();

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const angleRef = useRef(0); // cumulative angle (never reset, so ring looks continuous)

  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Draw idle wheel on mount / when items change
  useEffect(() => {
    const c = canvasRef.current;
    if (c && wheelItems.length) drawWheel(c, wheelItems, angleRef.current);
  }, [wheelItems]);

  // Cleanup RAF on unmount
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // ── Core spin animation ───────────────────────────────────────────────────
  const animateSpin = useCallback(
    (targetIndex) => {
      const canvas = canvasRef.current;
      if (!canvas || !wheelItems.length) return;

      const n = wheelItems.length;
      const SA = (2 * Math.PI) / n;

      /*
       * The pointer sits at the very top of the canvas (12 o'clock).
       * In canvas-angle terms that is -π/2.
       *
       * Segment i's midpoint sits at:
       *   angle + i*SA + SA/2
       *
       * For the pointer to coincide with segment i's midpoint we need:
       *   angle + i*SA + SA/2  ≡  -π/2  (mod 2π)
       *   angle  ≡  -π/2 - i*SA - SA/2  (mod 2π)
       *
       * We compute how far the wheel must still turn (always clockwise = positive)
       * then prepend MIN_ROTATIONS full loops.
       */
      const currentMod =
        ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const desiredMod =
        (((-Math.PI / 2 - targetIndex * SA - SA / 2) % (2 * Math.PI)) +
          2 * Math.PI) %
        (2 * Math.PI);

      let delta = desiredMod - currentMod;
      if (delta < 0.01) delta += 2 * Math.PI; // always move forward
      delta += MIN_ROTATIONS * 2 * Math.PI; // guaranteed full rotations

      const startAngle = angleRef.current;
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / SPIN_DURATION, 1);
        const eased = easeOut(progress);

        angleRef.current = startAngle + delta * eased;
        drawWheel(canvas, wheelItems, angleRef.current);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // Snap cleanly
          angleRef.current = startAngle + delta;
          drawWheel(canvas, wheelItems, angleRef.current);
          setIsAnimating(false);
          setShowResult(true);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [wheelItems],
  );

  // When the API result arrives start animation
  useEffect(() => {
    if (!spinResult || !isAnimating) return;
    const idx = wheelItems.findIndex((w) => w.id === spinResult.gift_item.id);
    animateSpin(idx >= 0 ? idx : 0);
  }, [spinResult, isAnimating, wheelItems, animateSpin]);

  const handleSpin = () => {
    if (!canSpin || isAnimating || isSpinning) return;
    setShowResult(false);
    resetSpin();
    setIsAnimating(true); // wait for API
    doSpin();
  };

  const busy = isAnimating || isSpinning;
  const wrapSz = CANVAS_SIZE + 32; // canvas + 16px ring on each side

  return (
    <>
      <style>{RING_CSS}</style>

      {showResult && spinResult && (
        <ResultModal
          spinResult={spinResult}
          wheelItems={wheelItems}
          onClose={() => {
            setShowResult(false);
            resetSpin();
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          userSelect: "none",
          paddingBottom: 8,
        }}
      >
        {/* ── Wheel wrapper ── */}
        <div style={{ position: "relative", width: wrapSz, height: wrapSz }}>
          {/* Rotating conic ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(#FF6B35,#FFD700,#FF4E88,#7B5EA7,#4ECDC4,#FF6B6B,#45B7D1,#2ECC71,#FF6B35)",
              animation: "sw-ring 5s linear infinite",
            }}
          >
            {/* White gap between ring and canvas */}
            <div
              style={{
                position: "absolute",
                inset: 9,
                borderRadius: "50%",
                background: "#fff",
              }}
            />
          </div>

          {/* Bouncing pointer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              filter: "drop-shadow(0 3px 6px rgba(255,107,0,0.5))",
              animation: "sw-ptr 1.2s ease-in-out infinite",
            }}
          >
            <svg width="30" height="34" viewBox="0 0 30 34">
              <polygon
                points="15,32 1,4 29,4"
                fill="#FF6B35"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <polygon points="15,26 6,7 24,7" fill="#FFA060" />
            </svg>
          </div>

          {/* Canvas / loader */}
          {isLoadingWheel ? (
            <div
              style={{
                position: "relative",
                zIndex: 2,
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                margin: "16px auto 0",
                borderRadius: "50%",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "4px solid #FF6B35",
                  borderTopColor: "transparent",
                  animation: "sw-spin 0.8s linear infinite",
                }}
              />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{
                position: "relative",
                zIndex: 2,
                display: "block",
                borderRadius: "50%",
                margin: "16px auto 0",
                cursor: canSpin && !busy ? "pointer" : "default",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              }}
              onClick={handleSpin}
            />
          )}
        </div>

        {/* ── Controls ── */}
        {!isAuthenticated ? (
          <LoginNudge onLogin={() => navigate("/login")} />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "0 16px",
            }}
          >
            <button
              onClick={handleSpin}
              disabled={!canSpin || busy || isLoadingWheel}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 999,
                border: "none",
                fontSize: 16,
                fontWeight: 800,
                cursor: canSpin && !busy ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                ...(canSpin && !busy
                  ? {
                      background: "linear-gradient(135deg,#FF6B35,#FF9900)",
                      color: "#fff",
                      boxShadow: "0 6px 20px rgba(255,107,0,0.45)",
                    }
                  : {
                      background: "#e5e7eb",
                      color: "#9ca3af",
                    }),
              }}
            >
              {busy
                ? "Spinning…"
                : canSpin
                  ? "🎰 Spin Now!"
                  : "Daily Spun Used"}
            </button>

            {!canSpin && nextSpin && (
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                Next spin {formatNextSpin(nextSpin)}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SpinWheel;
