import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { Modal } from './Modal';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import {
    FaSearch,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';
import './DataPreviewModal.css';

interface DataPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { excelData } = useDataStore();

    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Filter and sort data
    const processedData = useMemo(() => {
        if (!excelData) return [];

        let data = [...excelData.rows];

        // Apply search
        if (searchQuery) {
            data = data.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }

        // Apply sort
        if (sortColumn) {
            data.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                }

                const aStr = String(aVal).toLowerCase();
                const bStr = String(bVal).toLowerCase();

                return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
            });
        }

        return data;
    }, [excelData, searchQuery, sortColumn, sortOrder]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / rowsPerPage);
    const startIndex = currentPage * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, processedData.length);
    const currentPageData = processedData.slice(startIndex, endIndex);

    // Handle sort
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortOrder('asc');
        }
    };

    if (!excelData) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Data Preview"
            width={1000}
            height={700}
        >
            <div className="data-preview-modal">
                {/* Controls */}
                <div className="preview-controls">
                    {/* Search */}
                    <div className="search-box">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(0);
                            }}
                        />
                    </div>

                    {/* Rows per page */}
                    <div className="rows-per-page">
                        <label>Rows:</label>
                        <Dropdown
                            value={rowsPerPage}
                            onChange={(val) => {
                                setRowsPerPage(Number(val));
                                setCurrentPage(0);
                            }}
                            options={[
                                { label: '10', value: 10 },
                                { label: '25', value: 25 },
                                { label: '50', value: 50 },
                                { label: '100', value: 100 },
                            ]}
                            width={80}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="row-number-header">#</th>
                                {excelData.columns.map((column, index) => (
                                    <th key={index} onClick={() => handleSort(column.name)} className="sortable-th">
                                        <div className="th-content">
                                            {column.name}
                                            {sortColumn === column.name && (
                                                <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentPageData.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className="row-number">{startIndex + rowIndex + 1}</td>
                                    {excelData.columns.map((column, colIndex) => (
                                        <td key={colIndex}>
                                            {String(row[column.name] || '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                    <Button
                        size="small"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                    >
                        <FaChevronLeft /> Previous
                    </Button>

                    <div className="page-info">
                        Page {currentPage + 1} of {totalPages || 1}
                    </div>

                    <Button
                        size="small"
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage >= totalPages - 1}
                    >
                        Next <FaChevronRight />
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
