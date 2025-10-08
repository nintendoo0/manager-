import React from 'react';
import apiClient from '../../utils/api';

const Reports = ({ filters }) => {
  const handleExport = async () => {
    try {
      // filters — объект с параметрами, например { project_id, status, priority }
      const response = await apiClient.get('/reports/defects', {
        params: filters,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'defects_report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка экспорта:', err);
      alert('Не удалось сформировать отчёт');
    }
  };

  return (
    <div>
      <button className="btn btn-primary" onClick={handleExport}>Экспорт в CSV</button>
    </div>
  );
};

export default Reports;