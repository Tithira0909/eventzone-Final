// src/components/QrScanner.jsx
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, RefreshCw, Play, Square } from "lucide-react";

export default function QrScanner({ onDecoded, className = "" }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState("");

  // Ask for permission first, then list cameras
  async function preflightPermission() {
    if (
      typeof window !== "undefined" &&
      location.protocol !== "https:" &&
      location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1"
    ) {
      throw new Error("Camera requires HTTPS (or localhost). Open the site with https://");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API not available in this browser.");
    }

    // Request a minimal stream to trigger the permission prompt
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    // Immediately stop tracks; we only wanted permission
    stream.getTracks().forEach((t) => t.stop());
  }

  async function listCameras() {
    const list = await BrowserMultiFormatReader.listVideoInputDevices();
    setDevices(list || []);
    const preferred =
      list.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
      list[0]?.deviceId ||
      "";
    setDeviceId((prev) => prev || preferred);
  }

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        await preflightPermission();
        await listCameras();
      } catch (e) {
        setErr(e?.message || "Could not access camera. Check site permissions.");
      }
    })();

    return () => {
      try {
        readerRef.current?.reset();
        readerRef.current?._controls?.stop();
      } catch {}
    };
  }, []);

  const start = async () => {
    try {
      setErr("");
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
      setScanning(true);

      // If we have a deviceId, use it. Otherwise use facingMode as a fallback.
      const constraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: { ideal: "environment" } };

      const controls = await readerRef.current.decodeFromConstraints(
        { video: constraints, audio: false },
        videoRef.current,
        (result, e) => {
          if (result) onDecoded?.(result.getText());
          // ignore NotFoundException noise while scanning
        }
      );
      readerRef.current._controls = controls;
    } catch (e) {
      setErr(e?.message || "Failed to start camera.");
      setScanning(false);
    }
  };

  const stop = () => {
    setScanning(false);
    try {
      readerRef.current?.reset();
      readerRef.current?._controls?.stop();
    } catch {}
  };

  const flip = () => {
    if (!devices.length) return;
    const idx = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(idx + 1) % devices.length]?.deviceId || deviceId;
    setDeviceId(next);
    if (scanning) {
      stop();
      setTimeout(() => start(), 150);
    }
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-gray-900/60 p-4 ${className}`}>
      <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
        <Camera className="h-5 w-5" /> QR Scanner
      </h2>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Camera className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-teal-200/60" />
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="appearance-none rounded-lg border border-white/10 bg-gray-900 pl-8 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600"
          >
            {devices.length === 0 ? (
              <option>No camera</option>
            ) : (
              devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || d.deviceId}
                </option>
              ))
            )}
          </select>
        </div>

        <button
          onClick={flip}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10"
          title="Flip camera"
        >
          <RefreshCw className="h-4 w-4" />
          Flip
        </button>

        {!scanning ? (
          <button
            onClick={start}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-200"
          >
            <Play className="h-4 w-4" />
            Start Scan
          </button>
        ) : (
          <button
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
        <video
          ref={videoRef}
          className="block w-full aspect-[3/2] sm:aspect-video"
          autoPlay
          muted
          playsInline
        />
      </div>

      {err ? (
        <p className="mt-2 text-sm text-red-300">{err}</p>
      ) : (
        <ul className="mt-2 list-disc pl-5 text-xs text-teal-200/70">
          <li>Use HTTPS (or localhost) to access the camera.</li>
          <li>Allow camera permission when prompted, then tap <b>Start Scan</b>.</li>
          <li>Use <b>Flip</b> to switch between front/back cameras.</li>
        </ul>
      )}
    </div>
  );
}
