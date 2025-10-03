import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Registration, RegistrationStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

declare var XLSX: any;

interface AdminDashboardProps {
  setView: (view: 'form') => void;
}

const getCategoryBadgeClasses = (category: Registration['category']) => {
  switch (category) {
    case 'participant':
      return 'bg-amber-100 text-amber-800'; // Presse écrite
    case 'exhibitor':
      return 'bg-orange-100 text-orange-800'; // Presse électronique
    case 'speaker':
      return 'bg-lime-100 text-lime-800'; // Radio
    case 'television':
      return 'bg-emerald-100 text-emerald-800'; // Télévision
    default:
      return 'bg-stone-100 text-stone-800';
  }
};

const getStatusBadgeClasses = (status: RegistrationStatus) => {
    switch(status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'confirmed':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-stone-100 text-stone-800';
    }
};

const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' }) => (
    <svg
      className={`h-4 w-4 text-stone-600 transition-transform duration-200 ${
        direction === 'descending' ? 'rotate-180' : ''
      }`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M14.78 11.78a.75.75 0 01-1.06 0L10 8.06l-3.72 3.72a.75.75 0 11-1.06-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06z"
        clipRule="evenodd"
      />
    </svg>
);

const SortablePlaceholderIcon = () => (
    <svg className="h-4 w-4 text-stone-300 opacity-50 group-hover:opacity-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:ml-2 ltr:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const AdminDashboard: React.FC<AdminDashboardProps> = ({ setView }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const { t, language } = useLanguage();
  
  type SortableKeys = 'submissionDate' | 'fullName' | 'email' | 'nationalId' | 'category' | 'status';
  type SortDirection = 'ascending' | 'descending';

  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection } | null>({ key: 'submissionDate', direction: 'descending' });

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('registrations');
      if (storedData) {
        setRegistrations(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Failed to parse registrations from localStorage', error);
      setRegistrations([]);
    }
  }, []);

  const handleUpdateStatus = (id: string, status: RegistrationStatus) => {
    const updatedRegistrations = registrations.map(reg =>
      reg.id === id ? { ...reg, status } : reg
    );
    setRegistrations(updatedRegistrations);
    localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));

    const user = updatedRegistrations.find(reg => reg.id === id);
    if (user) {
      if (status === 'confirmed') {
        alert(`${t('emailSimulationConfirm')} ${user.email}`);
      } else if (status === 'rejected') {
        alert(`${t('emailSimulationReject')} ${user.email}`);
      }
    }
  };


  const getCategoryTranslation = useCallback((category: Registration['category']) => {
    switch (category) {
      case 'participant': return t('categoryParticipant');
      case 'exhibitor': return t('categoryExhibitor');
      case 'speaker': return t('categorySpeaker');
      case 'television': return t('categoryTelevision');
      default: return category;
    }
  }, [t]);
  
  const getStatusTranslation = useCallback((status: RegistrationStatus) => {
    switch (status) {
        case 'pending': return t('pending');
        case 'confirmed': return t('confirmed');
        case 'rejected': return t('rejected');
        default: return status;
    }
  }, [t]);

  const sortedRegistrations = useMemo(() => {
    const sortableItems = [...registrations];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        const direction = sortConfig.direction === 'ascending' ? 1 : -1;
        
        const valA = a[key];
        const valB = b[key];

        if (valA == null) return 1;
        if (valB == null) return -1;
        
        if (key === 'submissionDate') {
          return (new Date(valA).getTime() - new Date(valB).getTime()) * direction;
        }

        if (key === 'category') {
            const translatedA = getCategoryTranslation(valA as Registration['category']);
            const translatedB = getCategoryTranslation(valB as Registration['category']);
            return translatedA.localeCompare(translatedB) * direction;
        }

        if (key === 'status') {
            const translatedA = getStatusTranslation(valA as RegistrationStatus);
            const translatedB = getStatusTranslation(valB as RegistrationStatus);
            return translatedA.localeCompare(translatedB) * direction;
        }

        return valA.toString().localeCompare(valB.toString()) * direction;
      });
    }
    return sortableItems;
  }, [registrations, sortConfig, getCategoryTranslation, getStatusTranslation]);

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleDownloadExcel = () => {
    if (registrations.length === 0) return;

    const dataForExcel = sortedRegistrations.map((reg, index) => ({
        [t('registrationNumber')]: index + 1,
        [t('submissionDate')]: new Date(reg.submissionDate).toLocaleString(language),
        [t('fullName')]: reg.fullName,
        [t('email')]: reg.email,
        [t('nationalId')]: reg.nationalId || '-',
        [t('phone')]: reg.phone || '-',
        [t('category')]: getCategoryTranslation(reg.category),
        [t('status')]: getStatusTranslation(reg.status),
        [t('attachmentsColumn')]: reg.attachmentNames?.join(', ') || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // --- STYLING ---
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "b45309" } }, // Amber 700
      alignment: { horizontal: "center", vertical: "center" },
    };
    const zebraStripeStyle = { fill: { fgColor: { rgb: "f5f5f4" } } }; // Stone 100
    const border = {
      top: { style: "thin", color: { auto: 1 } },
      bottom: { style: "thin", color: { auto: 1 } },
      left: { style: "thin", color: { auto: 1 } },
      right: { style: "thin", color: { auto: 1 } },
    };

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
        let cell = worksheet[cellAddress];
        if (!cell) continue;
        
        if (!cell.s) cell.s = {};
        cell.s.border = border;

        if (R === 0) { // Header row
          cell.s = { ...cell.s, ...headerStyle };
        } else { // Data rows
          if (R % 2 === 0) { // Apply zebra stripe to even data rows (R=2, 4, etc.)
            cell.s.fill = zebraStripeStyle.fill;
          }
          if (C === 0 || C === 6 || C === 7) { // Center align #, Category, Status
            if (!cell.s.alignment) cell.s.alignment = {};
            cell.s.alignment.horizontal = "center";
          }
        }
      }
    }
    // --- END STYLING ---

    const columnWidths = [
        { wch: 5 }, // #
        { wch: 20 }, // Submission Date
        { wch: 25 }, // Full Name
        { wch: 30 }, // Email
        { wch: 15 }, // National ID
        { wch: 15 }, // Phone
        { wch: 20 }, // Category
        { wch: 15 }, // Status
        { wch: 40 }, // Attachments
    ];
    worksheet['!cols'] = columnWidths;

    // Add auto-filter to header
    worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(range.e.c)}1`};

    XLSX.writeFile(workbook, "registrations.xlsx");
};


  const renderSortableHeader = (key: SortableKeys, title: string) => (
    <th className="whitespace-nowrap px-4 py-3 text-start font-medium text-stone-900">
        <button type="button" onClick={() => requestSort(key)} className="flex items-center group" aria-label={`Sort by ${title}`}>
            {title}
            <span className="ml-1.5">
                {sortConfig?.key === key ? <SortIcon direction={sortConfig.direction} /> : <SortablePlaceholderIcon />}
            </span>
        </button>
    </th>
  );


  return (
    <>
      <div className="flex justify-between items-center my-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-stone-800">{t('adminDashboardTitle')}</h1>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
             <button
                onClick={handleDownloadExcel}
                disabled={registrations.length === 0}
                className="inline-flex items-center justify-center rounded-md border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <DownloadIcon />
                {t('downloadExcel')}
            </button>
            <button
              onClick={() => setView('form')}
              className="inline-flex items-center rounded-md border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              {t('adminBackToForm')}
            </button>
        </div>
      </div>

      {registrations.length === 0 ? (
        <p className="text-center text-stone-500 py-10">{t('adminNoRegistrations')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 bg-white text-sm">
            <thead className="bg-stone-100">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-start font-medium text-stone-900">{t('registrationNumber')}</th>
                {renderSortableHeader('submissionDate', t('submissionDate'))}
                {renderSortableHeader('fullName', t('fullName'))}
                {renderSortableHeader('email', t('email'))}
                {renderSortableHeader('nationalId', t('nationalId'))}
                <th className="whitespace-nowrap px-4 py-3 text-start font-medium text-stone-900">{t('phone')}</th>
                {renderSortableHeader('category', t('category'))}
                {renderSortableHeader('status', t('status'))}
                <th className="whitespace-nowrap px-4 py-3 text-start font-medium text-stone-900">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {sortedRegistrations.map((reg, index) => (
                <tr key={reg.id} className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-stone-50'} hover:bg-amber-100`}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-600">{index + 1}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{new Date(reg.submissionDate).toLocaleString(language)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-900">{reg.fullName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{reg.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{reg.nationalId || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{reg.phone || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 ${getCategoryBadgeClasses(reg.category)}`}>
                      <p className="whitespace-nowrap text-sm">{getCategoryTranslation(reg.category)}</p>
                    </span>
                  </td>
                   <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClasses(reg.status)}`}>
                        {getStatusTranslation(reg.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {reg.status === 'pending' && (
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <button
                                onClick={() => handleUpdateStatus(reg.id, 'confirmed')}
                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                            >
                                {t('confirm')}
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(reg.id, 'rejected')}
                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-colors"
                            >
                                {t('reject')}
                            </button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;