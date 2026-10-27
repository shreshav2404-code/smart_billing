import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, ImageUp, KeyRound, QrCode, RotateCcw, ScanLine, ShieldCheck, ShieldX, TriangleAlert } from 'lucide-react';
import axios, { apiError } from '../lib/api';
import { formatDateTime, formatINR } from '../lib/format';
import { Button, Card, Input, PageHeader, Tabs, cn } from './ui';

const READER_ID = 'qr-reader';
const MODES = [
  { id: 'qr', label: 'Scan QR', icon: QrCode },
  { id: 'otp', label: 'Enter OTP', icon: KeyRound },
];

const ResultPanel = ({ result, onReset }) => {
  const tone = {
    granted: { icon: ShieldCheck, wrap: 'bg-emerald-50 ring-emerald-200', badge: 'bg-emerald-500', title: 'Access granted', text: 'text-emerald-800' },
    denied: { icon: ShieldX, wrap: 'bg-rose-50 ring-rose-200', badge: 'bg-rose-500', title: 'Access denied', text: 'text-rose-800' },
    error: { icon: TriangleAlert, wrap: 'bg-amber-50 ring-amber-200', badge: 'bg-amber-500', title: 'Could not verify', text: 'text-amber-800' },
  }[result.kind];
  const Icon = tone.icon;

  return (
    <div className={cn('animate-slide-up rounded-3xl p-6 text-center ring-1 ring-inset sm:p-8', tone.wrap)} role="status">
      <div className={cn('mx-auto flex size-16 animate-pop items-center justify-center rounded-full text-white shadow-lg', tone.badge)}>
        <Icon className="size-8" aria-hidden="true" />
      </div>
      <h2 className={cn('mt-4 text-2xl font-bold tracking-tight', tone.text)}>{tone.title}</h2>
      <p className={cn('mt-1 text-sm', tone.text)}>{result.message}</p>
      {result.kind === 'granted' && result.order && (
        <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 rounded-2xl bg-white/70 p-4 text-left text-sm ring-1 ring-emerald-200/60">
          <div>
            <dt className="text-slate-500">Order</dt>
            <dd className="font-semibold text-slate-900">#{result.order.orderId}</dd>
          </div>
          {result.order.total != null && (
            <div>
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-semibold text-slate-900">{formatINR(result.order.total)}</dd>
            </div>
          )}
          {result.order.itemCount != null && (
            <div>
              <dt className="text-slate-500">Items</dt>
              <dd className="font-semibold text-slate-900">{result.order.itemCount}</dd>
            </div>
          )}
          {result.order.createdAt && (
            <div>
              <dt className="text-slate-500">Placed</dt>
              <dd className="font-semibold text-slate-900">{formatDateTime(result.order.createdAt)}</dd>
            </div>
          )}
        </dl>
      )}
      <Button variant="secondary" icon={RotateCcw} onClick={onReset} className="mt-6">Verify another</Button>
    </div>
  );
};

const QRVerify = () => {
  const [mode, setMode] = useState('qr');
  const [otp, setOtp] = useState('');
  const [qrData, setQrData] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const fileRef = useRef(null);
  const decodedRef = useRef(false);

  const scanner = () => {
    if (!scannerRef.current) scannerRef.current = new Html5Qrcode(READER_ID, { verbose: false });
    return scannerRef.current;
  };

  // The reader element remounts between views, so each session gets a fresh instance.
  const stopCamera = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s?.isScanning) {
      try { await s.stop(); } catch { /* already stopped */ }
    }
    setScanning(false);
  };

  useEffect(() => () => {
    const s = scannerRef.current;
    if (s?.isScanning) s.stop().catch(() => {});
  }, []);

  const verify = async (payload) => {
    setVerifying(true);
    try {
      const res = await axios.post('/api/verify-qr', payload);
      setResult(res.data.access
        ? { kind: 'granted', message: 'Payment confirmed. The customer may proceed.', order: res.data }
        : { kind: 'denied', message: res.data.message || 'This order is not paid or has been flagged.' });
    } catch (err) {
      const status = err.response?.status;
      setResult(status === 404 || status === 403
        ? { kind: 'denied', message: apiError(err, 'No matching paid order was found.') }
        : { kind: 'error', message: apiError(err, 'The verification service did not respond.') });
    } finally {
      setVerifying(false);
    }
  };

  const onDecoded = async (text) => {
    // The camera keeps firing frames until stop() resolves; handle only the first hit.
    if (decodedRef.current) return;
    decodedRef.current = true;
    await stopCamera();
    setQrData(text);
    verify({ qrData: text });
  };

  const startCamera = async () => {
    setCameraError('');
    setResult(null);
    decodedRef.current = false;
    try {
      setScanning(true);
      await scanner().start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, onDecoded, () => {});
    } catch (err) {
      setScanning(false);
      setCameraError(String(err?.message || err).includes('Permission') ? 'Camera permission was denied. Allow camera access or upload an image instead.' : 'No camera available on this device. Upload a QR image or paste the code below.');
    }
  };

  const scanFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCameraError('');
    await stopCamera();
    decodedRef.current = false;
    try {
      const text = await scanner().scanFile(file, false);
      onDecoded(text);
    } catch {
      setResult({ kind: 'error', message: 'No QR code was found in that image. Try a sharper photo.' });
    }
  };

  const switchMode = async (next) => {
    await stopCamera();
    setResult(null);
    setMode(next);
  };

  const reset = () => {
    setResult(null);
    setOtp('');
    setQrData('');
  };

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <PageHeader eyebrow="Exit gate" title="Verify a purchase" subtitle="Scan the customer's receipt QR or enter their 6-digit OTP." />

      {result ? (
        <ResultPanel result={result} onReset={reset} />
      ) : (
        <>
          <Tabs tabs={MODES} value={mode} onChange={switchMode} className="mb-5 flex w-full" />

          {mode === 'qr' ? (
            <Card className="p-5 sm:p-6">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-900">
                <div id={READER_ID} className="size-full [&_video]:!size-full [&_video]:object-cover" />
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
                    <ScanLine className="size-12 text-slate-500" aria-hidden="true" />
                    <p className="text-sm">Point the camera at the QR code on the customer's receipt.</p>
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {cameraError}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                {scanning ? (
                  <Button variant="danger" icon={CameraOff} onClick={stopCamera}>Stop camera</Button>
                ) : (
                  <Button icon={Camera} onClick={startCamera} loading={verifying}>Start camera</Button>
                )}
                <Button variant="secondary" icon={ImageUp} onClick={() => fileRef.current?.click()} disabled={verifying}>Upload image</Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={scanFile} />
              </div>

              <details className="group mt-5 border-t border-slate-100 pt-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-500 hover:text-slate-700">
                  <span className="group-open:hidden">Paste QR data manually</span>
                  <span className="hidden group-open:inline">Hide manual entry</span>
                </summary>
                <form onSubmit={(e) => { e.preventDefault(); if (qrData.trim()) verify({ qrData: qrData.trim() }); }} className="mt-3 flex gap-2">
                  <div className="flex-1">
                    <Input placeholder='{"orderId":12,"otp":"123456",…}' value={qrData} onChange={(e) => setQrData(e.target.value)} aria-label="QR data" />
                  </div>
                  <Button type="submit" variant="dark" loading={verifying} disabled={!qrData.trim()}>Verify</Button>
                </form>
              </details>
            </Card>
          ) : (
            <Card className="p-6 sm:p-8">
              <form onSubmit={(e) => { e.preventDefault(); if (otp.length === 6) verify({ otp }); }} className="flex flex-col gap-5">
                <label htmlFor="otp" className="text-center text-sm text-slate-500">Enter the 6-digit code from the customer's receipt</label>
                <input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                  className="w-full rounded-2xl border-0 bg-slate-50 py-5 text-center font-mono text-4xl font-bold tracking-[0.4em] text-slate-900 ring-1 ring-slate-200 ring-inset placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none sm:text-5xl"
                />
                <Button type="submit" size="lg" loading={verifying} disabled={otp.length !== 6}>Verify OTP</Button>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default QRVerify;
