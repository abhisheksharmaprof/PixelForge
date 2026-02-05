import React from 'react';
import { useUIStore } from '../../store/uiStore';
import {
    FaFont,
    FaShapes,
    FaUpload,
    FaImage,
    FaQrcode,
    FaDatabase,
    FaLink,
    FaFolderOpen,
    FaPalette,
} from 'react-icons/fa';
import { TextTab } from './TextTab';
import { ElementsTab } from './ElementsTab';
import { ImagesTab } from './ImagesTab';
import { UploadsTab } from './UploadsTab';
import { QRCodeBarcodeTab } from './QRCodeBarcodeTab';
import { DataTab } from './DataTab';
import { DataMappingTab } from './DataMappingTab';
import { TemplatesTab } from './TemplatesTab';
import { BackgroundTab } from './BackgroundTab';
import './LeftSidebar.css';

export const LeftSidebar: React.FC = () => {
    const { activeTab, setActiveTab } = useUIStore();

    const tabs = [
        { id: 'templates', icon: <FaFolderOpen />, label: 'Templates' },
        { id: 'text', icon: <FaFont />, label: 'Text' },
        { id: 'elements', icon: <FaShapes />, label: 'Elements' },
        { id: 'background', icon: <FaPalette />, label: 'Background' },
        { id: 'uploads', icon: <FaUpload />, label: 'Uploads' },
        { id: 'images', icon: <FaImage />, label: 'Images' },
        { id: 'qr', icon: <FaQrcode />, label: 'QR/Codes' },
        { id: 'data', icon: <FaDatabase />, label: 'Data' },
        { id: 'mapping', icon: <FaLink />, label: 'Mapping' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'templates':
                return <TemplatesTab />;
            case 'text':
                return <TextTab />;
            case 'elements':
                return <ElementsTab />;
            case 'background':
                return <BackgroundTab />;
            case 'uploads':
                return <UploadsTab />;
            case 'images':
                return <ImagesTab />;
            case 'qr':
                return <QRCodeBarcodeTab />;
            case 'data':
                return <DataTab />;
            case 'mapping':
                return <DataMappingTab />;
            default:
                return <TemplatesTab />;
        }
    };

    return (
        <div className="left-sidebar">
            <div className="sidebar-rail">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`rail-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.label}
                    >
                        <div className="rail-icon">{tab.icon}</div>
                        <span className="rail-label">{tab.label}</span>
                    </button>
                ))}
            </div>
            <div className="sidebar-content">
                {renderContent()}
            </div>
        </div>
    );
};
