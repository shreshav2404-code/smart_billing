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
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Gate Verification System</h2>

      {/* Mode Selection */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => setVerifyMode('qr')}
          style={{
            padding: '10px 20px',
            backgroundColor: verifyMode === 'qr' ? '#4CAF50' : '#ddd',
            color: verifyMode === 'qr' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📱 Scan QR Code
        </button>
        <button
          onClick={() => setVerifyMode('otp')}
          style={{
            padding: '10px 20px',
            backgroundColor: verifyMode === 'otp' ? '#4CAF50' : '#ddd',
            color: verifyMode === 'otp' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔐 Enter OTP
        </button>
      </div>

      {/* QR Code Mode */}
      {verifyMode === 'qr' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '15px' }}>Point your camera at the entry QR Code</p>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', overflow: 'hidden', borderRadius: '8px' }}></div>
          
          <div style={{ marginTop: '30px', borderTop: '1px dashed #ccc', paddingTop: '20px' }}>
            <p style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>Or verify manually by pasting data below:</p>
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyQRManually(); }} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder='Paste QR data here'
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                required
                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button type="submit" style={{ padding: '10px 20px' }}>Verify</button>
            </form>
          </div>
        </div>
      )}

      {/* OTP Mode */}
      {verifyMode === 'otp' && (
        <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }}>
          <p style={{ color: '#666' }}>Enter the 6-digit OTP from your receipt/order:</p>
          <div>
            <label htmlFor="otp">OTP:</label>
            <input
              id="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.toUpperCase())}
              maxLength="6"
              required
              style={{ width: '100%', padding: '10px', marginBottom: '10px', fontSize: '18px', letterSpacing: '2px', textAlign: 'center' }}
            />
          </div>
          <button type="submit" style={{ width: '100%' }}>Verify OTP</button>
        </form>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          borderRadius: '4px',
          backgroundColor: result.includes('Granted') ? '#e8f5e9' : result.includes('Denied') ? '#ffebee' : '#fff3e0',
          color: result.includes('Granted') ? '#1b5e20' : result.includes('Denied') ? '#b71c1c' : '#e65100'
        }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{result}</p>
        </div>
      )}
    </div>
  );
};

export default QRVerify;