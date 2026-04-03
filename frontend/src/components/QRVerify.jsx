import { useState, useEffect } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRVerify = () => {
  const [qrData, setQrData] = useState('');
  const [otp, setOtp] = useState('');
  const [result, setResult] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [verifyMode, setVerifyMode] = useState('qr'); // 'qr' or 'otp'
  const [scannerInitialized, setScannerInitialized] = useState(false);

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (verifyMode === 'qr') {
      html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      html5QrcodeScanner.render(
        async (decodedText, decodedResult) => {
          setQrData(decodedText);
          html5QrcodeScanner.pause(true); // Pause scanning once successful
          
          try {
            const res = await axios.post('/api/verify-qr', { qrData: decodedText });
            setOrderInfo(res.data);
            if (res.data.access) {
              setResult('✅ Access Granted - You may proceed');
            } else {
              setResult('❌ Access Denied - Invalid Order/OTP');
              html5QrcodeScanner.resume(); // Resume if invalid
            }
          } catch (err) {
            setResult('⚠️ Error Verifying Order');
            html5QrcodeScanner.resume(); // Resume if error
          }
        },
        (error) => {
          // Ignore parse errors, they happen continuously until a QR code is detected
        }
      );
      setScannerInitialized(true);
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        setScannerInitialized(false);
      }
    };
  }, [verifyMode]);

  const handleVerifyQRManually = async () => {
    try {
      const res = await axios.post('/api/verify-qr', { qrData });
      setOrderInfo(res.data);
      if (res.data.access) {
        setResult('✅ Access Granted - You may proceed');
      } else {
        setResult('❌ Access Denied - Invalid Order/OTP');
      }
    } catch (err) {
      setResult('⚠️ Error Verifying Order');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setResult('⚠️ Please enter OTP');
      return;
    }
    try {
      // Try to verify by searching for the OTP
      const res = await axios.post('/api/verify-qr', { otp });
      setOrderInfo(res.data);
      if (res.data.access) {
        setResult('✅ Access Granted - You may proceed');
      } else {
        setResult('❌ Access Denied - Invalid OTP');
      }
    } catch (err) {
      setResult('⚠️ OTP not found or invalid');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-800">Gate Verification</h2>
        <p className="text-slate-500 mt-2">Verify checkout status using QR or OTP</p>
      </div>

      {result && (
        <div className={`mb-8 p-4 rounded-xl border font-bold text-center flex items-center justify-center gap-2 shadow-sm ${
          result.includes('Granted') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
          result.includes('Denied') ? 'bg-red-50 border-red-200 text-red-700' : 
          'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {result}
        </div>
      )}

      {/* Mode Selection */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button
          onClick={() => setVerifyMode('qr')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            verifyMode === 'qr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
          }`}
        >
          📱 Scan QR Code
        </button>
        <button
          onClick={() => setVerifyMode('otp')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            verifyMode === 'otp' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
          }`}
        >
          🔐 Enter OTP
        </button>
      </div>

      {/* QR Code Mode */}
      {verifyMode === 'qr' && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
          <p className="text-slate-500 text-center font-medium mb-6">Point your camera at the entry QR Code</p>
          
          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 mb-6">
            <div id="qr-reader" className="w-full mx-auto border-none"></div>
          </div>
          
          <div className="border-t border-slate-100 pt-6">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-center mb-4">Or verify manually</p>
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyQRManually(); }} className="flex gap-2">
              <input
                type="text"
                placeholder="Paste QR data here"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit" 
                className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors"
              >
                Verify
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OTP Mode */}
      {verifyMode === 'otp' && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }} className="flex flex-col gap-6">
            <div className="text-center">
              <p className="text-slate-500 font-medium">Enter the 6-digit OTP from</p>
              <p className="text-slate-500 font-medium">the customer's order receipt</p>
            </div>
            
            <div>
              <input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                maxLength="6"
                required
                className="w-full text-center text-4xl tracking-[0.5em] font-black text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-2xl py-6 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors uppercase placeholder:text-slate-300"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all text-lg"
            >
              Verify OTP
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default QRVerify;