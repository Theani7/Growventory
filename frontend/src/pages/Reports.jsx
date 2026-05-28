import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Download, FileSpreadsheet, BarChart3, Loader2, FileBarChart, Heart, Package, Sparkles } from 'lucide-react';

const Reports = () => {
  const [downloading, setDownloading] = useState(null);

  const downloadReport = async (key, endpoint, filename) => {
    setDownloading(key);
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      key: 'inventory',
      title: 'Plant Inventory',
      description: 'Complete list of all plants with stock levels, health status, and pricing details.',
      csvEndpoint: '/reports/inventory-csv',
      pdfEndpoint: '/reports/inventory-pdf',
      csvFilename: 'inventory_report.csv',
      pdfFilename: 'inventory_report.pdf',
      icon: Package,
      bg: 'bg-moss-50',
      ring: 'ring-moss-100',
      text: 'text-moss-700',
    },
    {
      key: 'stock',
      title: 'Stock Movements',
      description: 'All stock in, out, and adjustment movements with timestamps and notes.',
      csvEndpoint: '/reports/stock-movements-csv',
      pdfEndpoint: '/reports/stock-movements-pdf',
      csvFilename: 'stock_movements_report.csv',
      pdfFilename: 'stock_movements_report.pdf',
      icon: BarChart3,
      bg: 'bg-blue-50',
      ring: 'ring-blue-100',
      text: 'text-blue-700',
    },
    {
      key: 'health',
      title: 'Health Logs',
      description: 'Complete history of plant health checks and status changes over time.',
      endpoint: '/reports/health-logs-csv',
      filename: 'health_logs_report.csv',
      icon: Heart,
      bg: 'bg-rose-50',
      ring: 'ring-rose-100',
      text: 'text-rose-700',
    },
    {
      key: 'summary',
      title: 'Operational Summary',
      description: 'Overview statistics and key performance metrics for your nursery.',
      endpoint: '/reports/summary?download=csv',
      filename: 'summary_report.csv',
      icon: FileBarChart,
      bg: 'bg-purple-50',
      ring: 'ring-purple-100',
      text: 'text-purple-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Export Center</p>
        <h1 className="page-title mt-1">Reports</h1>
        <p className="page-subtitle">Download CSV or PDF reports for analysis and record keeping</p>
      </div>

      {/* Info banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-moss-700 via-moss-600 to-accent-teal p-6 shadow-elevated">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-accent-mint/20 rounded-full blur-3xl"></div>
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur ring-1 ring-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-white font-display text-lg">Export your nursery data</h3>
            <p className="text-sm text-white/85 mt-1 max-w-2xl">
              Download reports in CSV format for spreadsheets and data analysis, or PDF format for printing and sharing with stakeholders.
            </p>
          </div>
        </div>
      </div>

      {/* Reports grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          const isDownloading = downloading === report.key;
          return (
            <div key={report.key} className="card card-hover p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${report.bg} ${report.text} ring-1 ${report.ring} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink-900 text-base font-display">{report.title}</h3>
                  <p className="text-sm text-ink-500 mt-1 leading-relaxed">{report.description}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => downloadReport(report.key, report.csvEndpoint || report.endpoint, report.csvFilename || report.filename)}
                      disabled={isDownloading}
                      className="btn-primary flex-1"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          CSV
                        </>
                      )}
                    </button>
                    {report.pdfEndpoint && (
                      <button
                        onClick={() => downloadReport(report.key, report.pdfEndpoint, report.pdfFilename)}
                        disabled={isDownloading}
                        className="btn-secondary flex-1"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
