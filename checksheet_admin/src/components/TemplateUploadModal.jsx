import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TemplateUploadModal = ({ isOpen, onClose, onSuccess }) => {
    const [folderName, setFolderName] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setFolderName('');
            setFile(null);
            setUploadProgress(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type !== 'application/x-zip-compressed' && selectedFile.type !== 'application/zip') {
            alert('Please select a valid ZIP file');
            return;
        }
        setFile(selectedFile);

        // Auto-fill folder name from filename if empty
        if (selectedFile && !folderName) {
            const name = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
            setFolderName(name.toUpperCase());
        }
    };

    const handleUpload = async () => {
        if (!folderName || !file) {
            alert('Please provide both folder name and ZIP file');
            return;
        }

        const formData = new FormData();
        formData.append('folderName', folderName);
        formData.append('templateZip', file);

        setIsUploading(true);
        try {
            await axios.post('/api/admin/upload-template', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            alert('✅ Template uploaded and extracted successfully!');
            onSuccess();
        } catch (error) {
            console.error('Upload error:', error);
            alert('❌ Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-blue-600">📦</span> Upload Template
                    </h2>
                    <p className="text-slate-500 text-sm">Upload a built checksheet (ZIP) to the server.</p>
                </div>

                <div className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Folder Name (Machine Model)</label>
                        <input
                            className="bg-slate-50 border border-slate-300 rounded-lg px-4 h-11 w-full text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: FAMB0007_V3"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value.toUpperCase())}
                            disabled={isUploading}
                        />
                        <p className="text-[10px] text-slate-400">This will be the folder name in <code>checksheet_form/</code></p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ZIP File (Build Artifacts)</label>
                        <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}>
                            <input
                                type="file"
                                accept=".zip"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            <div className="text-center">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl mb-1">📄</span>
                                        <span className="text-sm font-medium text-blue-700 truncate max-w-full px-4">{file.name}</span>
                                        <span className="text-xs text-blue-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl mb-1 text-slate-400">☁️</span>
                                        <span className="text-sm font-medium text-slate-600">Click or drag ZIP file here</span>
                                        <span className="text-xs text-slate-400 mt-1">Only .zip files supported</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span>Uploading & Extracting...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isUploading}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition-colors border border-slate-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || !file || !folderName}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none"
                        >
                            {isUploading ? 'Uploading...' : 'Upload Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateUploadModal;
