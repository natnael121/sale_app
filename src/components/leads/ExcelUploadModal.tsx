import React, { useState, useRef } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types';
import { Upload, X, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelUploadModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

interface LeadData {
  companyName: string;
  managerName: string;
  managerPhone: string;
  companyPhone: string;
  sector: string;
  source: string;
  notes?: string;
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({ user, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<LeadData[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      processExcelFile(selectedFile);
    }
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellText: false, cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false }) as any[][];

        if (jsonData.length < 2) {
          setError('Excel file must contain at least a header row and one data row');
          return;
        }

        const headers = jsonData[0].map((h: string) => String(h || '').toLowerCase().trim());
        const requiredColumns = [
          'company name',
          'manager name',
          'manager phone',
          'company phone',
          'sector',
          'source'
        ];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        const leads: LeadData[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const getCellValue = (columnName: string): string => {
            const index = headers.indexOf(columnName);
            if (index === -1) return '';
            const value = row[index];
            return value !== null && value !== undefined ? String(value).trim() : '';
          };

          const lead: LeadData = {
            companyName: getCellValue('company name'),
            managerName: getCellValue('manager name'),
            managerPhone: getCellValue('manager phone'),
            companyPhone: getCellValue('company phone'),
            sector: getCellValue('sector'),
            source: getCellValue('source') || 'excel_import',
            notes: getCellValue('notes')
          };

          if (lead.companyName && lead.managerName && lead.managerPhone) {
            leads.push(lead);
          }
        }

        if (leads.length === 0) {
          setError('No valid leads found in the Excel file');
          return;
        }

        setPreview(leads);
        setUploadStatus('idle');
      } catch (error) {
        setError('Failed to process Excel file. Please check the format.');
        console.error('Excel processing error:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (preview.length === 0) return;

    setLoading(true);
    setUploadStatus('processing');
    setError('');

    try {
      const batch = writeBatch(db);

      preview.forEach((lead) => {
        const docRef = doc(collection(db, 'leads'));
        batch.set(docRef, {
          ...lead,
          organizationId: user.organizationId,
          status: 'new',
          createdBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          notes: lead.notes
            ? [
                {
                  id: Date.now().toString(),
                  content: lead.notes,
                  createdBy: user.id,
                  createdAt: new Date(),
                  type: 'note',
                },
              ]
            : [],
          communications: [],
          meetings: [],
        });
      });

      await batch.commit();
      setUploadStatus('success');
      setTimeout(() => onSuccess(), 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to upload leads');
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Company Name', 'Manager Name', 'Manager Phone', 'Company Phone', 'Sector', 'Source', 'Notes'],
      ['ABC Trading PLC', 'John Doe', '+251911000000', '+251111000000', 'Retail', 'Referral', 'Interested in partnership'],
      ['XYZ Manufacturing', 'Jane Smith', '+251922111111', '+251112222222', 'Manufacturing', 'Website', 'Requested brochure'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
    XLSX.writeFile(wb, 'leads_template.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Upload Leads from Excel</h2>
              <p className="text-gray-600">Import multiple leads with company details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {uploadStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Successful!</h3>
              <p className="text-gray-600">{preview.length} leads have been imported successfully.</p>
            </div>
          ) : (
            <>
              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-800">Need a template?</h3>
                      <p className="text-sm text-gray-600">Download our Excel template to get started</p>
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />

                {file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {preview.length > 0 ? `${preview.length} leads found` : 'Processing...'}
                      </p>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:text-blue-700 text-sm">
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-800">Upload Excel File</p>
                      <p className="text-gray-600">Choose an Excel file (.xlsx or .xls) containing your leads</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Preview ({preview.length} leads)
                  </h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left py-2 px-3">Company Name</th>
                            <th className="text-left py-2 px-3">Manager Name</th>
                            <th className="text-left py-2 px-3">Manager Phone</th>
                            <th className="text-left py-2 px-3">Sector</th>
                            <th className="text-left py-2 px-3">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.slice(0, 10).map((lead, index) => (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="py-2 px-3">{lead.companyName}</td>
                              <td className="py-2 px-3">{lead.managerName}</td>
                              <td className="py-2 px-3">{lead.managerPhone}</td>
                              <td className="py-2 px-3">{lead.sector}</td>
                              <td className="py-2 px-3">{lead.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {preview.length > 10 && (
                      <div className="p-3 bg-gray-100 text-center text-sm text-gray-600">
                        ... and {preview.length - 10} more leads
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading || preview.length === 0}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload {preview.length} Leads</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;
