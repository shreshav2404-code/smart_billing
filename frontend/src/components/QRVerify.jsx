import { useState } from 'react';
import axios from 'axios';

const QRVerify = () => {
  const [qrData, setQrData] = useState('');
  const [otp, setOtp] = useState('');
  const [result, setResult] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [verifyMode, setVerifyMode] = useState('qr'); // 'qr' or 'otp'

  const handleVerifyQR = async () => {
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
        <form onSubmit={(e) => { e.preventDefault(); handleVerifyQR(); }}>
          <p style={{ color: '#666' }}>Scan the QR code or paste QR data below:</p>
          <div>
            <label htmlFor="qrData">QR Code Data:</label>
            <textarea
              id="qrData"
              placeholder='Paste full QR data (JSON format like: {"orderId":1,"userId":1,"total":500})'
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              required
              style={{ width: '100%', height: '100px', padding: '10px', marginBottom: '10px' }}
            />
          </div>
          <button type="submit" style={{ width: '100%' }}>Verify QR Code</button>
        </form>
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