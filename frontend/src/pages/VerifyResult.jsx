import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const VerifyResult = () => {
    const { hash } = useParams(); // Get hash from URL
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const certificateRef = useRef(null);
    const [autoDownloaded, setAutoDownloaded] = useState(false);

    useEffect(() => {
        const verify = async () => {
            try {
                // Call the Public API (No token needed)
                const response = await api.get(`/verify/${hash}`);
                setData(response.data.data);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [hash]);

    useEffect(() => {
        const shouldDownload = searchParams.get('download') === '1';
        if (!shouldDownload || autoDownloaded || !data) {
            return;
        }
        setAutoDownloaded(true);
        handleDownload();
    }, [searchParams, autoDownloaded, data]);

    const handleDownload = async () => {
        if (!certificateRef.current) {
            return;
        }

        const canvas = await html2canvas(certificateRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const yOffset = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 0;

        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
        pdf.save(`certificate-${hash}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            {/* Header */}
            <div className="mb-8 text-center">
                <Link to="/" className="text-blue-600 font-bold text-lg hover:underline">← Back to Home</Link>
            </div>

            {loading ? (
                <div className="text-xl text-gray-600 animate-pulse">Verifying on Blockchain...</div>
            ) : error ? (
                <div className="bg-white p-10 rounded-xl shadow-xl text-center max-w-lg border-t-8 border-red-500">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-3xl font-bold text-red-600 mb-2">Invalid Certificate</h2>
                    <p className="text-gray-500">
                        The certificate ID you entered does not exist or has been revoked.
                    </p>
                </div>
            ) : (
                <div className="w-full max-w-2xl">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleDownload}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition"
                        >
                            Download PDF
                        </button>
                    </div>
                    <div
                        ref={certificateRef}
                        className="bg-white p-10 rounded-xl shadow-2xl w-full border-t-8 border-green-500 relative overflow-hidden"
                    >
                    {/* Background Watermark */}
                    <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                        <svg width="300" height="300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                        </svg>
                    </div>

                    <div className="text-center mb-8">
                        <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold mb-6">
                            ✓ OFFICIALLY VERIFIED
                        </div>

                        {/* --- PHOTO DISPLAY SECTION --- */}
                        {data.photo_url ? (
                            <img 
                                src={`http://localhost:5000${data.photo_url}`} 
                                alt="Student" 
                                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center text-4xl shadow-lg border-4 border-white text-gray-400">
                                🎓
                            </div>
                        )}
                        {/* ----------------------------- */}

                        <h1 className="text-3xl font-bold text-gray-800">{data.credential_name}</h1>
                        <p className="text-gray-500 mt-2">Awarded to</p>
                        <h2 className="text-2xl font-semibold text-blue-900">{data.student_name}</h2>
                        <p className="text-gray-600 text-sm mt-4 max-w-xl mx-auto">
                            This is to certify that <span className="font-semibold">{data.student_name}</span> has successfully
                            completed the requirements for <span className="font-semibold">{data.credential_name}</span> awarded
                            by <span className="font-semibold">{data.issuer_name}</span>.
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                            This credential is digitally signed and can be verified via EduAuth Registry.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-t border-b border-gray-100 py-6">
                        <div>
                            <p className="text-gray-500 text-sm">Issued By</p>
                            <p className="font-medium text-gray-800">{data.issuer_name}</p>
                            <p className="text-xs text-gray-400 capitalize">({data.institution_type})</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Issue Date</p>
                            <p className="font-medium text-gray-800">{data.issue_date}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Credential Type</p>
                            <p className="font-medium text-gray-800 capitalize">{data.certificate_type}</p> 
                        </div>
                         <div className="text-right">
                            <p className="text-gray-500 text-sm">Status</p>
                            <p className="font-medium text-green-600 capitalize">{data.status}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Identity Type</p>
                            <p className="font-medium text-gray-800 capitalize">{data.identity_type || 'nid'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Identity Hash</p>
                            <p className="font-mono text-xs text-gray-700 break-all">{data.identity_hash}</p>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                         <p className="text-xs text-gray-400">Digital Signature (SHA-256)</p>
                         <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                             {data.certificate_hash}
                         </p>
                    </div>
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <p className="text-xs text-gray-400">Scan to Verify</p>
                        <div className="bg-white p-2 rounded border">
                            <QRCode value={`${window.location.origin}/verify/${data.certificate_hash}`} size={110} />
                        </div>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};

export default VerifyResult;
