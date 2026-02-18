
import { Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, List, ListOrdered, CheckSquare, AlignLeft, Bold, Italic, Code, Quote, Type as TypeIcon, Calculator, Calendar, Hash, Mail } from 'lucide-react';

export interface TextLibraryItem {
    id: string;
    label: string;
    description: string;
    icon: any;
    defaultProps: {
        text: string;
        fontSize: number;
        fontWeight: string | number;
        fontFamily: string;
        fill: string; // or fabric.Gradient
        textAlign: string;
        lineHeight: number;
        charSpacing: number; // in 1/1000 em, Fabric uses this
        fontStyle: 'normal' | 'italic' | 'oblique';
        underline: boolean;
        linethrough?: boolean;
        overline?: boolean;
        width?: number;
        // Advanced props
        stroke?: string;
        strokeWidth?: number;
        shadow?: fabric.IShadowOptions | string | undefined; // Simplified shadow definition
        // Metadata for custom behaviors
        stitchType?: 'heading' | 'body' | 'list-bullet' | 'list-ordered' | 'list-checklist' | 'quote' | 'code' | 'artistic' | 'dynamic-date' | 'dynamic-page' | 'path' | 'vertical';
        path?: string; // For text on path
        direction?: 'ltr' | 'rtl'; // For vertical text
    };
}

export interface TextCategory {
    id: string;
    label: string;
    items: TextLibraryItem[];
}

export const textLibrary: TextCategory[] = [
    {
        id: 'basic',
        label: 'Basic Text',
        items: [
            {
                id: 'body',
                label: 'Body Text',
                description: 'For paragraphs and general content',
                icon: Type,
                defaultProps: {
                    text: 'Add body text here',
                    fontSize: 16,
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.5,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 300,
                    stitchType: 'body'
                }
            },
            {
                id: 'heading1',
                label: 'Heading 1',
                description: 'Main titles and headlines',
                icon: Heading1,
                defaultProps: {
                    text: 'Heading 1',
                    fontSize: 48,
                    fontWeight: 700,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.2,
                    charSpacing: -50,
                    fontStyle: 'normal',
                    underline: false,
                    width: 600,
                    stitchType: 'heading'
                }
            },
            {
                id: 'heading2',
                label: 'Heading 2',
                description: 'Section titles',
                icon: Heading2,
                defaultProps: {
                    text: 'Heading 2',
                    fontSize: 36,
                    fontWeight: 700,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.25,
                    charSpacing: -25,
                    fontStyle: 'normal',
                    underline: false,
                    width: 500,
                    stitchType: 'heading'
                }
            },
            {
                id: 'heading3',
                label: 'Heading 3',
                description: 'Subsection titles',
                icon: Heading3,
                defaultProps: {
                    text: 'Heading 3',
                    fontSize: 28,
                    fontWeight: 600,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.3,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    stitchType: 'heading'
                }
            },
            {
                id: 'heading4',
                label: 'Heading 4',
                description: 'Small section titles',
                icon: Heading4,
                defaultProps: {
                    text: 'Heading 4',
                    fontSize: 24,
                    fontWeight: 600,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.35,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    stitchType: 'heading'
                }
            },
            {
                id: 'heading5',
                label: 'Heading 5',
                description: 'Minor titles',
                icon: Heading5,
                defaultProps: {
                    text: 'Heading 5',
                    fontSize: 20,
                    fontWeight: 500,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.4,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    stitchType: 'heading'
                }
            },
            {
                id: 'heading6',
                label: 'Heading 6',
                description: 'Smallest titles',
                icon: Heading6,
                defaultProps: {
                    text: 'Heading 6',
                    fontSize: 18,
                    fontWeight: 500,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.4,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    stitchType: 'heading'
                }
            },
            {
                id: 'subtitle',
                label: 'Subtitle',
                description: 'Supporting text under headlines',
                icon: Type,
                defaultProps: {
                    text: 'Subtitle Text',
                    fontSize: 24,
                    fontWeight: 300,
                    fontFamily: 'Inter',
                    fill: '#555555',
                    textAlign: 'left',
                    lineHeight: 1.4,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    stitchType: 'body'
                }
            },
            {
                id: 'caption',
                label: 'Caption',
                description: 'Small annotations',
                icon: TypeIcon,
                defaultProps: {
                    text: 'Add a caption',
                    fontSize: 12,
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    fill: '#666666',
                    textAlign: 'left',
                    lineHeight: 1.4,
                    charSpacing: 0,
                    fontStyle: 'italic',
                    underline: false,
                    width: 200,
                    stitchType: 'body'
                }
            }
        ]
    },
    {
        id: 'lists',
        label: 'Lists',
        items: [
            {
                id: 'bullet-list',
                label: 'Bulleted List',
                description: 'Unordered items',
                icon: List,
                defaultProps: {
                    text: '• Item 1\n• Item 2\n• Item 3',
                    fontSize: 16,
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.6,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 300,
                    stitchType: 'list-bullet'
                }
            },
            {
                id: 'numbered-list',
                label: 'Numbered List',
                description: 'Ordered items',
                icon: ListOrdered,
                defaultProps: {
                    text: '1. First item\n2. Second item\n3. Third item',
                    fontSize: 16,
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.6,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 300,
                    stitchType: 'list-ordered'
                }
            },
            {
                id: 'checklist',
                label: 'Checklist',
                description: 'To-do items',
                icon: CheckSquare,
                defaultProps: {
                    text: '☐ Task 1\n☐ Task 2\n☐ Task 3',
                    fontSize: 16,
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.6,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 300,
                    stitchType: 'list-checklist'
                }
            }
        ]
    },
    {
        id: 'quote',
        label: 'Quotes & Code',
        items: [
            {
                id: 'block-quote',
                label: 'Block Quote',
                description: 'Emphasized citation',
                icon: Quote,
                defaultProps: {
                    text: '"Insert meaningful quote here"',
                    fontSize: 20,
                    fontWeight: 400,
                    fontFamily: 'Georgia',
                    fill: '#555555',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    charSpacing: 0,
                    fontStyle: 'italic',
                    underline: false,
                    width: 400,
                    stitchType: 'quote'
                }
            },
            {
                id: 'pull-quote',
                label: 'Pull Quote',
                description: 'Magazine-style callout',
                icon: Quote,
                defaultProps: {
                    text: '“Big Statement”',
                    fontSize: 32,
                    fontWeight: 600,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 400,
                    stitchType: 'quote'
                }
            },
            {
                id: 'code-block',
                label: 'Code Block',
                description: 'Monospace code snippet',
                icon: Code,
                defaultProps: {
                    text: 'console.log("Hello World");',
                    fontSize: 14,
                    fontWeight: 400,
                    fontFamily: 'Courier New',
                    fill: '#333333',
                    textAlign: 'left',
                    lineHeight: 1.5,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 400,
                    stitchType: 'code'
                }
            }
        ]
    },
    {
        id: 'artistic',
        label: 'Artistic & Decorative',
        items: [
            {
                id: 'outlined-text',
                label: 'Outlined Text',
                description: 'Bold text with stroke',
                icon: Type,
                defaultProps: {
                    text: 'OUTLINE',
                    fontSize: 64,
                    fontWeight: 700,
                    fontFamily: 'Inter',
                    fill: 'transparent',
                    stroke: '#000000',
                    strokeWidth: 2,
                    textAlign: 'center',
                    lineHeight: 1,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 400,
                    stitchType: 'artistic'
                }
            },
            {
                id: 'shadow-text',
                label: 'Shadow Text',
                description: 'Text with drop shadow',
                icon: Type,
                defaultProps: {
                    text: 'Shadow',
                    fontSize: 48,
                    fontWeight: 700,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'center',
                    lineHeight: 1,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    shadow: 'rgba(0,0,0,0.3) 5px 5px 5px',
                    width: 400,
                    stitchType: 'artistic'
                }
            },
            {
                id: 'neon-text',
                label: 'Neon Glow',
                description: 'Glowing text effect',
                icon: Type,
                defaultProps: {
                    text: 'NEON',
                    fontSize: 64,
                    fontWeight: 700,
                    fontFamily: 'Inter',
                    fill: '#FF00FF',
                    stroke: '#FFFFFF',
                    strokeWidth: 1,
                    textAlign: 'center',
                    lineHeight: 1,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    shadow: '#FF00FF 0px 0px 20px',
                    width: 400,
                    stitchType: 'artistic'
                }
            }
        ]
    },
    {
        id: 'dynamic',
        label: 'Dynamic',
        items: [
            {
                id: 'date-auto',
                label: 'Date',
                description: 'Current date',
                icon: Calendar,
                defaultProps: {
                    text: new Date().toLocaleDateString(),
                    fontSize: 16,
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    fill: '#000000',
                    textAlign: 'left',
                    lineHeight: 1.5,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 200,
                    stitchType: 'dynamic-date'
                }
            },
            {
                id: 'page-number',
                label: 'Page Number',
                description: 'Page placeholder',
                icon: Hash,
                defaultProps: {
                    text: '#',
                    fontSize: 14,
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    fill: '#555555',
                    textAlign: 'right',
                    lineHeight: 1.5,
                    charSpacing: 0,
                    fontStyle: 'normal',
                    underline: false,
                    width: 50,
                    stitchType: 'dynamic-page'
                }
            }
        ]
    }
];
