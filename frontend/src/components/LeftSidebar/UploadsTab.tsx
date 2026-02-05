import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { ElementFactory } from '../../utils/elementFactory';
import { Button } from '../Shared/Button';
import { Dropdown } from '../Shared/Dropdown';
import { Input } from '../Shared/Input';
import {
    FaUpload,
    FaFolder,
    FaImage,
    FaFileSignature,
    FaPalette,
    FaTrash,
    FaSearch,
    FaEllipsisV,
} from 'react-icons/fa';
import './UploadsTab.css';

interface Asset {
    id: string;
    name: string;
    type: 'logo' | 'signature' | 'background' | 'images';
    url: string;
    size: number;
    uploadedAt: Date;
}

export const UploadsTab: React.FC = () => {
    const { canvas } = useCanvasStore();

    const [assets, setAssets] = useState<Asset[]>([]);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Load assets from backend
    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/assets');
            if (response.ok) {
                const data = await response.json();
                setAssets(data);
            }
        } catch (error) {
            // Backend not available - silently fail and show empty state
            setAssets([]);
        }
    };

    // Upload new asset
    const handleUpload = (type: Asset['type']) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files) return;

            const formData = new FormData();

            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            formData.append('type', type);

            try {
                const response = await fetch('http://localhost:3000/api/assets/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    loadAssets();
                }
            } catch (error) {
                console.error('Failed to upload asset:', error);
            }
        };

        input.click();
    };

    // Delete asset
    const deleteAsset = async (assetId: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;

        try {
            const response = await fetch(`http://localhost:3000/api/assets/${assetId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                loadAssets();
            }
        } catch (error) {
            console.error('Failed to delete asset:', error);
        }
    };

    // Add asset to canvas
    const addAssetToCanvas = async (asset: Asset) => {
        if (!canvas) return;

        try {
            const imgElement = await ElementFactory.createImage(asset.url, {
                left: 100,
                top: 100,
            });

            (imgElement as any).assetId = asset.id;
            (imgElement as any).assetType = asset.type;

            canvas.add(imgElement);

            // Auto-scale to fit canvas
            ElementFactory.scaleImageToFit(imgElement, canvas.width || 800, canvas.height || 600);
            imgElement.center();
            imgElement.setCoords();

            canvas.setActiveObject(imgElement);
            canvas.renderAll();
        } catch (error) {
            console.error('Failed to add asset to canvas:', error);
        }
    };

    // Filter assets
    const filteredAssets = assets.filter(asset => {
        const matchesType = filterType === 'all' || asset.type === filterType;
        const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="uploads-tab sidebar-tab-content">
            {/* Upload Buttons */}
            <div className="upload-buttons-grid">
                <Button
                    variant="outline"
                    onClick={() => handleUpload('logo')}
                    icon={<FaPalette />}
                >
                    Upload Logo
                </Button>

                <Button
                    variant="outline"
                    onClick={() => handleUpload('signature')}
                    icon={<FaFileSignature />}
                >
                    Upload Signature
                </Button>

                <Button
                    variant="outline"
                    onClick={() => handleUpload('background')}
                    icon={<FaImage />}
                >
                    Upload Background
                </Button>

                <Button
                    variant="outline"
                    onClick={() => handleUpload('images')}
                    icon={<FaImage />}
                >
                    Upload Image
                </Button>
            </div>

            {/* Filter & Search */}
            <div className="assets-controls">
                <Dropdown
                    value={filterType}
                    onChange={(val) => setFilterType(String(val))}
                    options={[
                        { label: 'All Assets', value: 'all' },
                        { label: 'Logos', value: 'logo' },
                        { label: 'Signatures', value: 'signature' },
                        { label: 'Backgrounds', value: 'background' },
                        { label: 'Images', value: 'images' },
                    ]}
                    width={150}
                />

                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Assets Grid */}
            <div className="assets-grid">
                {filteredAssets.length === 0 ? (
                    <div className="no-assets">
                        <FaFolder size={48} />
                        <p>No assets found</p>
                        <Button
                            variant="primary"
                            onClick={() => handleUpload('images')}
                            size="small"
                        >
                            <FaUpload /> Upload First Asset
                        </Button>
                    </div>
                ) : (
                    filteredAssets.map(asset => (
                        <div
                            key={asset.id}
                            className="asset-card"
                            onClick={() => addAssetToCanvas(asset)}
                        >
                            <div className="asset-thumbnail">
                                <img src={asset.url} alt={asset.name} />
                                <div className="asset-overlay">
                                    <Button
                                        size="small"
                                        variant="primary"
                                    >
                                        Add to Canvas
                                    </Button>
                                </div>
                            </div>

                            <div className="asset-info">
                                <div className="asset-name" title={asset.name}>
                                    {asset.name}
                                </div>
                                <div className="asset-meta">
                                    <span className="asset-type">{asset.type}</span>
                                    <span className="asset-size">
                                        {(asset.size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                            </div>

                            <div className="asset-actions">
                                <button
                                    className="asset-action-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAsset(asset);
                                    }}
                                >
                                    <FaEllipsisV />
                                </button>

                                {selectedAsset?.id === asset.id && (
                                    <div className="asset-context-menu">
                                        <button onClick={() => addAssetToCanvas(asset)}>
                                            Add to Canvas
                                        </button>
                                        <button onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = asset.url;
                                            a.download = asset.name;
                                            a.click();
                                        }}>
                                            Download
                                        </button>
                                        <button
                                            className="danger"
                                            onClick={() => deleteAsset(asset.id)}
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Storage Info */}
            <div className="storage-info">
                <div className="storage-bar">
                    <div
                        className="storage-used"
                        style={{
                            width: `${(assets.reduce((sum, a) => sum + a.size, 0) / (100 * 1024 * 1024)) * 100}%`,
                        }}
                    />
                </div>
                <p className="storage-text">
                    {(assets.reduce((sum, a) => sum + a.size, 0) / (1024 * 1024)).toFixed(2)} MB
                    of 100 MB used
                </p>
            </div>
        </div>
    );
};
