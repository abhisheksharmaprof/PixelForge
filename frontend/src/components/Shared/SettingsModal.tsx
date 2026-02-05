import React, { useState } from 'react';
import { Modal } from '../Shared/Modal';
import { Button } from '../Shared/Button';
import { Input } from '../Shared/Input';
import { Dropdown } from '../Shared/Dropdown';
import { Checkbox } from '../Shared/Checkbox';
import { Accordion } from '../Shared/Accordion';
import {
    FaPalette,
    FaRuler,
    FaDownload,
    FaBell,
    FaLock,
    FaSave,
} from 'react-icons/fa';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [settings, setSettings] = useState({
        // General
        language: 'en',
        theme: 'light',
        autoSave: true,
        autoSaveInterval: 5,

        // Canvas
        defaultPageSize: 'A4',
        defaultOrientation: 'portrait',
        defaultUnit: 'px',
        snapToGrid: false,
        gridSize: 10,
        showRulers: true,
        showGrid: false,
        showGuides: true,

        // Performance
        renderQuality: 'high',
        maxUndoSteps: 50,
        smoothScrolling: true,
        hardwareAcceleration: true,

        // Export
        defaultExportFormat: 'pdf',
        defaultDPI: 300,
        compressImages: true,
        embedFonts: true,

        // Notifications
        showNotifications: true,
        notifyOnSave: true,
        notifyOnExport: true,
        notifyOnError: true,

        // Privacy
        analytics: true,
        crashReports: true,

        // Advanced
        developerMode: false,
        debugMode: false,
    });

    const handleSave = () => {
        // Save settings to localStorage or backend
        localStorage.setItem('appSettings', JSON.stringify(settings));
        onClose();
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            // Reset to default settings
            setSettings({
                language: 'en',
                theme: 'light',
                autoSave: true,
                autoSaveInterval: 5,
                defaultPageSize: 'A4',
                defaultOrientation: 'portrait',
                defaultUnit: 'px',
                snapToGrid: false,
                gridSize: 10,
                showRulers: true,
                showGrid: false,
                showGuides: true,
                renderQuality: 'high',
                maxUndoSteps: 50,
                smoothScrolling: true,
                hardwareAcceleration: true,
                defaultExportFormat: 'pdf',
                defaultDPI: 300,
                compressImages: true,
                embedFonts: true,
                showNotifications: true,
                notifyOnSave: true,
                notifyOnExport: true,
                notifyOnError: true,
                analytics: true,
                crashReports: true,
                developerMode: false,
                debugMode: false,
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Settings"
            width={800}
            height={700}
        >
            <div className="settings-modal">
                <div className="settings-content">
                    {/* General Settings */}
                    <Accordion title="General" defaultOpen icon={<FaPalette />}>
                        <div className="settings-section">
                            <div className="setting-item">
                                <label>Language</label>
                                <Dropdown
                                    value={settings.language}
                                    onChange={(value) =>
                                        setSettings({ ...settings, language: value as string })
                                    }
                                    options={[
                                        { label: 'English', value: 'en' },
                                        { label: 'Spanish', value: 'es' },
                                        { label: 'French', value: 'fr' },
                                        { label: 'German', value: 'de' },
                                        { label: 'Hindi', value: 'hi' },
                                    ]}
                                />
                            </div>

                            <div className="setting-item">
                                <label>Theme</label>
                                <Dropdown
                                    value={settings.theme}
                                    onChange={(value) =>
                                        setSettings({ ...settings, theme: value as string })
                                    }
                                    options={[
                                        { label: 'Light', value: 'light' },
                                        { label: 'Dark', value: 'dark' },
                                        { label: 'Auto (System)', value: 'auto' },
                                    ]}
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Auto-save templates"
                                    checked={settings.autoSave}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, autoSave: checked })
                                    }
                                />
                            </div>

                            {settings.autoSave && (
                                <div className="setting-item indented">
                                    <label>Auto-save interval (minutes)</label>
                                    <Input
                                        type="number"
                                        value={settings.autoSaveInterval}
                                        onChange={(value) =>
                                            setSettings({
                                                ...settings,
                                                autoSaveInterval: Number(value),
                                            })
                                        }
                                        min={1}
                                        max={60}
                                    />
                                </div>
                            )}
                        </div>
                    </Accordion>

                    {/* Canvas Settings */}
                    <Accordion title="Canvas" icon={<FaRuler />}>
                        <div className="settings-section">
                            <div className="setting-item">
                                <label>Default Page Size</label>
                                <Dropdown
                                    value={settings.defaultPageSize}
                                    onChange={(value) =>
                                        setSettings({ ...settings, defaultPageSize: value as string })
                                    }
                                    options={[
                                        { label: 'A4', value: 'A4' },
                                        { label: 'Letter', value: 'Letter' },
                                        { label: 'Legal', value: 'Legal' },
                                        { label: 'A3', value: 'A3' },
                                        { label: 'A5', value: 'A5' },
                                    ]}
                                />
                            </div>

                            <div className="setting-item">
                                <label>Default Orientation</label>
                                <Dropdown
                                    value={settings.defaultOrientation}
                                    onChange={(value) =>
                                        setSettings({ ...settings, defaultOrientation: value as string })
                                    }
                                    options={[
                                        { label: 'Portrait', value: 'portrait' },
                                        { label: 'Landscape', value: 'landscape' },
                                    ]}
                                />
                            </div>

                            <div className="setting-item">
                                <label>Measurement Unit</label>
                                <Dropdown
                                    value={settings.defaultUnit}
                                    onChange={(value) =>
                                        setSettings({ ...settings, defaultUnit: value as string })
                                    }
                                    options={[
                                        { label: 'Pixels (px)', value: 'px' },
                                        { label: 'Millimeters (mm)', value: 'mm' },
                                        { label: 'Centimeters (cm)', value: 'cm' },
                                        { label: 'Inches (in)', value: 'in' },
                                    ]}
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Show rulers"
                                    checked={settings.showRulers}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, showRulers: checked })
                                    }
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Show grid"
                                    checked={settings.showGrid}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, showGrid: checked })
                                    }
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Show guides"
                                    checked={settings.showGuides}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, showGuides: checked })
                                    }
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Snap to grid"
                                    checked={settings.snapToGrid}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, snapToGrid: checked })
                                    }
                                />
                            </div>

                            {settings.snapToGrid && (
                                <div className="setting-item indented">
                                    <label>Grid size (px)</label>
                                    <Input
                                        type="number"
                                        value={settings.gridSize}
                                        onChange={(value) =>
                                            setSettings({ ...settings, gridSize: Number(value) })
                                        }
                                        min={5}
                                        max={50}
                                    />
                                </div>
                            )}
                        </div>
                    </Accordion>

                    {/* Performance Settings */}
                    <Accordion title="Performance">
                        <div className="settings-section">
                            <div className="setting-item">
                                <label>Render Quality</label>
                                <Dropdown
                                    value={settings.renderQuality}
                                    onChange={(value) =>
                                        setSettings({ ...settings, renderQuality: value as string })
                                    }
                                    options={[
                                        { label: 'Low (Faster)', value: 'low' },
                                        { label: 'Medium', value: 'medium' },
                                        { label: 'High (Better)', value: 'high' },
                                    ]}
                                />
                            </div>

                            <div className="setting-item">
                                <label>Max undo/redo steps</label>
                                <Input
                                    type="number"
                                    value={settings.maxUndoSteps}
                                    onChange={(value) =>
                                        setSettings({ ...settings, maxUndoSteps: Number(value) })
                                    }
                                    min={10}
                                    max={100}
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Smooth scrolling"
                                    checked={settings.smoothScrolling}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, smoothScrolling: checked })
                                    }
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Hardware acceleration"
                                    checked={settings.hardwareAcceleration}
                                    onChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            hardwareAcceleration: checked,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </Accordion>

                    {/* Export Settings */}
                    <Accordion title="Export" icon={<FaDownload />}>
                        <div className="settings-section">
                            <div className="setting-item">
                                <label>Default Export Format</label>
                                <Dropdown
                                    value={settings.defaultExportFormat}
                                    onChange={(value) =>
                                        setSettings({ ...settings, defaultExportFormat: value as string })
                                    }
                                    options={[
                                        { label: 'PDF', value: 'pdf' },
                                        { label: 'PNG Image', value: 'png' },
                                        { label: 'JPEG Image', value: 'jpeg' },
                                    ]}
                                />
                            </div>

                            <div className="setting-item">
                                <label>Default DPI</label>
                                <Dropdown
                                    value={settings.defaultDPI}
                                    onChange={(value) =>
                                        setSettings({ ...settings, defaultDPI: Number(value) })
                                    }
                                    options={[
                                        { label: '72 DPI (Screen)', value: 72 },
                                        { label: '150 DPI (Standard)', value: 150 },
                                        { label: '300 DPI (High)', value: 300 },
                                        { label: '600 DPI (Print)', value: 600 },
                                    ]}
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Compress images"
                                    checked={settings.compressImages}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, compressImages: checked })
                                    }
                                />
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Embed fonts in PDF"
                                    checked={settings.embedFonts}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, embedFonts: checked })
                                    }
                                />
                            </div>
                        </div>
                    </Accordion>

                    {/* Notifications */}
                    <Accordion title="Notifications" icon={<FaBell />}>
                        <div className="settings-section">
                            <div className="setting-item">
                                <Checkbox
                                    label="Enable notifications"
                                    checked={settings.showNotifications}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, showNotifications: checked })
                                    }
                                />
                            </div>

                            {settings.showNotifications && (
                                <>
                                    <div className="setting-item indented">
                                        <Checkbox
                                            label="Notify on save"
                                            checked={settings.notifyOnSave}
                                            onChange={(checked) =>
                                                setSettings({ ...settings, notifyOnSave: checked })
                                            }
                                        />
                                    </div>

                                    <div className="setting-item indented">
                                        <Checkbox
                                            label="Notify on export"
                                            checked={settings.notifyOnExport}
                                            onChange={(checked) =>
                                                setSettings({ ...settings, notifyOnExport: checked })
                                            }
                                        />
                                    </div>

                                    <div className="setting-item indented">
                                        <Checkbox
                                            label="Notify on error"
                                            checked={settings.notifyOnError}
                                            onChange={(checked) =>
                                                setSettings({ ...settings, notifyOnError: checked })
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </Accordion>

                    {/* Privacy */}
                    <Accordion title="Privacy & Security" icon={<FaLock />}>
                        <div className="settings-section">
                            <div className="setting-item">
                                <Checkbox
                                    label="Send anonymous usage statistics"
                                    checked={settings.analytics}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, analytics: checked })
                                    }
                                />
                                <small>Helps us improve the application</small>
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Send crash reports"
                                    checked={settings.crashReports}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, crashReports: checked })
                                    }
                                />
                                <small>Helps us fix bugs faster</small>
                            </div>
                        </div>
                    </Accordion>

                    {/* Advanced */}
                    <Accordion title="Advanced">
                        <div className="settings-section">
                            <div className="setting-item">
                                <Checkbox
                                    label="Developer mode"
                                    checked={settings.developerMode}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, developerMode: checked })
                                    }
                                />
                                <small>Shows additional development tools</small>
                            </div>

                            <div className="setting-item">
                                <Checkbox
                                    label="Debug mode"
                                    checked={settings.debugMode}
                                    onChange={(checked) =>
                                        setSettings({ ...settings, debugMode: checked })
                                    }
                                />
                                <small>Enables console logging</small>
                            </div>

                            <div className="setting-item">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        localStorage.clear();
                                        alert('Cache cleared successfully!');
                                    }}
                                    fullWidth
                                >
                                    Clear Cache
                                </Button>
                            </div>
                        </div>
                    </Accordion>
                </div>

                {/* Footer */}
                <div className="settings-footer">
                    <Button variant="outline" onClick={handleReset}>
                        Reset to Default
                    </Button>

                    <div className="footer-actions">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave} icon={<FaSave />}>
                            Save Settings
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
