import React from 'react';
import { useUIStore } from '../../store/uiStore';
import {
    Type,
    Shapes,
    Upload,
    Image as ImageIcon,
    QrCode,
    Database,
    Link,
    FolderOpen,
    Palette,
} from 'lucide-react';
import { TextTab } from './TextTab';
import { ElementsTab } from './ElementsTab';
import { ImagesTab } from './ImagesTab';
import { UploadsTab } from './UploadsTab';
import { QRCodeBarcodeTab } from './QRCodeBarcodeTab';
import { DataTab } from './DataTab';
import { DataMappingTab } from './DataMappingTab';
import { TemplatesTab } from './TemplatesTab';
import { BackgroundTab } from './BackgroundTab';
import clsx from 'clsx';

export const LeftSidebar: React.FC = () => {
    const { activeTab, setActiveTab } = useUIStore();

    const tabs = [
        { id: 'templates', icon: FolderOpen, label: 'Templates' },
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'elements', icon: Shapes, label: 'Elements' },
        { id: 'background', icon: Palette, label: 'Background' },
        { id: 'uploads', icon: Upload, label: 'Uploads' },
        { id: 'images', icon: ImageIcon, label: 'Images' },
        { id: 'qr', icon: QrCode, label: 'QR Codes' },
        { id: 'data', icon: Database, label: 'Data' },
        { id: 'mapping', icon: Link, label: 'Mapping' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'templates': return <TemplatesTab />;
            case 'text': return <TextTab />;
            case 'elements': return <ElementsTab />;
            case 'background': return <BackgroundTab />;
            case 'uploads': return <UploadsTab />;
            case 'images': return <ImagesTab />;
            case 'qr': return <QRCodeBarcodeTab />;
            case 'data': return <DataTab />;
            case 'mapping': return <DataMappingTab />;
            default: return <TemplatesTab />;
        }
    };

    return (
        <div className="flex w-full h-full">
            {/* Slim Rail Navigation (Dark Mode) */}
            <nav className="w-[72px] bg-slate-900 flex flex-col items-center py-4 gap-4 shrink-0 transition-colors">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-1 w-full transition-colors group ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                                }`}
                            title={tab.label}
                        >
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-white/10' : ''}`}>
                                <Icon size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-[10px] font-medium">{tab.label}</span>
                        </button>
                    );
                })}

                <div className="mt-auto mb-4 flex flex-col items-center gap-1 w-full text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <div className="p-2">
                        <FolderOpen size={24} strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-medium">Apps</span>
                </div>
            </nav>

            {/* Tool Context Panel (White) */}
            <aside className="w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
                <div className="h-full flex flex-col">
                    {/* Header for Panel */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h2 className="text-base font-bold text-slate-800 capitalize leading-none">{activeTab}</h2>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {renderContent()}
                    </div>
                </div>
            </aside>
        </div>
    );
};
