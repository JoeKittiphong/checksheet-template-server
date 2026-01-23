import { useState } from 'react';
import axios from 'axios';

// กำหนด style 
const inputStyle = "border-b border-black w-40 text-center bg-transparent outline-none";
const labelStyle = "text-right font-semibold w-40";
const rowStyle = "flex items-center gap-4 mb-3";

function DetailPage({ data, onBack }) {
    // Parse checksheet_data ถ้าเป็น string
    const parsedChecksheetData = (() => {
        if (!data?.checksheet_data) return {};
        if (typeof data.checksheet_data === 'string') {
            try {
                return JSON.parse(data.checksheet_data);
            } catch {
                return {};
            }
        }
        return data.checksheet_data;
    })();

    const [formData, setFormData] = useState({
        department: data?.department || '',
        model: data?.model || '',
        machineNo: data?.machine_no || '',
        asGroup: data?.as_group || '',
        controllerNo: parsedChecksheetData?.controllerNo || '',
        startDate: parsedChecksheetData?.startDate || '',
        finishDate: parsedChecksheetData?.finishDate || '',
        option1: parsedChecksheetData?.option1 || '',
        option2: parsedChecksheetData?.option2 || ''
    });
    const [checksheetName, setChecksheetName] = useState(data?.checksheet_name || '');
    const [saving, setSaving] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // function สำหรับบันทึกข้อมูล
    const handleSave = async () => {
        if (!data?.id) {
            alert('ไม่พบ ID สำหรับอัพเดท');
            return;
        }

        setSaving(true);
        try {
            const checksheetData = {
                controllerNo: formData.controllerNo,
                startDate: formData.startDate,
                finishDate: formData.finishDate,
                option1: formData.option1,
                option2: formData.option2
            };

            await axios.put(`${import.meta.env.VITE_DATABASE_URL}/update/${data.id}`, {
                checksheet_name: checksheetName,
                checksheet_data: checksheetData
            });

            alert('บันทึกข้อมูลสำเร็จ!');
        } catch (error) {
            console.error('Error saving data:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex gap-2 mb-6">
                <button
                    onClick={onBack}
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                    ← Back
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
                {/* CHECKSHEET NAME */}
                <div className={rowStyle}>
                    <span className={labelStyle}>CHECKSHEET NAME :</span>
                    <input
                        type="text"
                        className={inputStyle}
                        value={checksheetName}
                        onChange={(e) => setChecksheetName(e.target.value)}
                    />
                </div>

                {/* MODEL */}
                <div className={rowStyle}>
                    <span className={labelStyle}>MODEL :</span>
                    <span className="border-b border-black w-40 text-center">{formData.model}</span>
                </div>

                {/* MACHINE NO. */}
                <div className={rowStyle}>
                    <span className={labelStyle}>MACHINE NO.</span>
                    <span className="border-b border-black w-40 text-center">{formData.machineNo}</span>
                </div>

                {/* CONTROLLER NO. */}
                <div className={rowStyle}>
                    <span className={labelStyle}>CONTROLLER NO.</span>
                    <input
                        type="text"
                        className={inputStyle}
                        value={formData.controllerNo}
                        onChange={(e) => handleChange('controllerNo', e.target.value)}
                    />
                </div>

                {/* START DATE */}
                <div className={rowStyle}>
                    <span className={labelStyle}>START DATE :</span>
                    <input
                        type="text"
                        className={inputStyle}
                        value={formData.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                    />
                </div>

                {/* FINISH DATE */}
                <div className={rowStyle}>
                    <span className={labelStyle}>FINISH DATE :</span>
                    <input
                        type="text"
                        className={inputStyle}
                        value={formData.finishDate}
                        onChange={(e) => handleChange('finishDate', e.target.value)}
                    />
                </div>

                {/* OPTION 1 */}
                <div className={rowStyle}>
                    <span className={labelStyle}>OPTION :</span>
                    <input
                        type="text"
                        className={inputStyle}
                        value={formData.option1}
                        onChange={(e) => handleChange('option1', e.target.value)}
                    />
                </div>

                {/* OPTION 2 */}
                <div className={rowStyle}>
                    <span className={labelStyle}></span>
                    <input
                        type="text"
                        className={inputStyle}
                        value={formData.option2}
                        onChange={(e) => handleChange('option2', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

export default DetailPage;

