I'll analyze the comprehensive specification you shared and create a significantly expanded tasks.md that includes ALL missing tasks, with special emphasis on mouse/keyboard interactions and UI/UX details.

# Project Roadmap: CanvaWord Template Builder - COMPREHENSIVE EDITION

This roadmap includes ALL tasks extracted from the complete project specification, with detailed breakdowns of UI components, interactions, and backend requirements.

## 1. Project Setup & Core Infrastructure

### 1.1 Technology Stack & Dependencies
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install core dependencies (Fabric.js, React, TypeScript)
- [ ] Install UI dependencies (Lucide icons, clsx, tailwindcss)
- [ ] Install utility libraries (uuid, lodash, moment)
- [ ] Install file handling (xlsx, jspdf, html2canvas, file-saver, jszip)
- [ ] Install QR/Barcode (qrcode, jsbarcode)
- [ ] Install state management (zustand, @tanstack/react-query)
- [ ] Install additional tools (tiptap, react-color, react-dropzone, framer-motion)
- [ ] Setup backend (Express, CORS, Multer, dotenv)

### 1.2 Project Structure & Architecture
- [ ] Create complete folder structure (components, hooks, store, services, utils, types)
- [ ] Setup CSS architecture (globals.css, variables.css, components.css)
- [ ] Create TypeScript type definitions (canvas.types, element.types, template.types, data.types)
- [ ] Define design system tokens (colors, spacing, typography, shadows)
- [ ] Setup environment variables (.env files)

### 1.3 State Management (Zustand Stores)
- [ ] Implement canvasStore (canvas instance, size, background, zoom, grid, guides)
- [ ] Implement selectionStore (selected objects, selection type, multi-select)
- [ ] Implement uiStore (sidebar states, modal states, loading, notifications)
- [ ] Implement historyStore (undo/redo with 50-100 state limit)
- [ ] Implement templateStore (current template, save state, auto-save)
- [ ] Implement dataStore (Excel data, placeholders, mappings, preview)

### 1.4 Persistent Storage
- [ ] Implement LocalStorage for templates
- [ ] Implement auto-save (every 30 seconds)
- [ ] Implement recovery on page reload
- [ ] Implement IndexedDB for large assets (optional)

### 1.5 Backend Setup
- [ ] Setup Express server with routes
- [ ] Configure CORS for frontend
- [ ] Setup file upload middleware (Multer)
- [ ] Create storage directory structure
- [ ] Implement file system helpers
- [ ] Setup static file serving

### 1.6 Network & File System
- [ ] Configure network proxy settings
- [ ] Setup read-only mount directories
- [ ] Implement file validation middleware
- [ ] Setup error handling middleware

## 2. Layout & Navigation Structure

### 2.1 Main Layout Container
- [ ] Fixed 100vh/100vw layout (no scrolling)
- [ ] Responsive breakpoints (1440px, 1024px)
- [ ] Desktop recommendation message for < 1024px
- [ ] Fullscreen mode toggle

### 2.2 Header Bar (Top Toolbar)
- [ ] Fixed header (48-56px height)
- [ ] Application menu button (hamburger/logo)
- [ ] File operations dropdown
- [ ] Edit dropdown
- [ ] View dropdown
- [ ] Template name (editable inline)
- [ ] Save status indicator
- [ ] Undo/Redo buttons with tooltips
- [ ] Mail Merge button with badge
- [ ] Preview mode toggle
- [ ] Share button
- [ ] User avatar/account menu
- [ ] Generate Documents button (primary CTA)

### 2.3 Secondary Toolbar (Contextual Ribbon)
- [ ] Dynamic toolbar (44-52px height)
- [ ] Switches based on selection type
- [ ] Smooth transitions between toolbars
- [ ] Overflow handling for narrow screens

### 2.4 Left Sidebar
- [ ] Fixed width (280-320px), collapsible to 72px
- [ ] Vertical tab navigation (48-56px wide)
- [ ] Smooth collapse/expand animation
- [ ] Icon-only mode with expandable flyouts
- [ ] Hover states on tabs
- [ ] Active tab highlighting
- [ ] Tab tooltips on hover

### 2.5 Right Sidebar
- [ ] Fixed width (280-320px), collapsible
- [ ] Panel switching (Properties, Layers, Data, History)
- [ ] Resize handle for width adjustment
- [ ] Panel state persistence

### 2.6 Bottom Status Bar
- [ ] Fixed height (32-40px)
- [ ] Zoom slider with presets dropdown
- [ ] Page navigation controls
- [ ] Element count display
- [ ] Cursor position display
- [ ] Canvas dimensions display
- [ ] Grid/ruler toggle icons

### 2.7 Responsive Behavior
- [ ] Auto-collapse sidebars < 1440px
- [ ] Flyout panels for collapsed sidebars
- [ ] Touch-friendly controls for tablets
- [ ] Keyboard navigation for all UI

## 3. Editor UI Components

### 3.1 Top Menu Dropdowns

#### Application Menu
- [ ] Return to Dashboard
- [ ] My Templates (with count)
- [ ] Recent Files (last 10)
- [ ] Settings (opens modal)
- [ ] Help & Tutorials
- [ ] Keyboard Shortcuts (Ctrl+/)
- [ ] About page

#### File Menu
- [ ] New Template (with size presets submenu)
- [ ] Open from Drive
- [ ] Save (Ctrl+S) with loading state
- [ ] Save As (with category selector)
- [ ] Make a Copy
- [ ] Rename (inline or modal)
- [ ] Move to Folder
- [ ] Download As submenu (PDF, PNG, JPG, SVG, JSON)
- [ ] Print (Ctrl+P)
- [ ] Version History (slider UI)
- [ ] Template Info/Properties

#### Edit Menu
- [ ] Undo (Ctrl+Z) with action name
- [ ] Redo (Ctrl+Y/Ctrl+Shift+Z)
- [ ] Cut (Ctrl+X)
- [ ] Copy (Ctrl+C)
- [ ] Paste (Ctrl+V)
- [ ] Paste without formatting
- [ ] Duplicate (Ctrl+D)
- [ ] Delete (Del)
- [ ] Select All (Ctrl+A)
- [ ] Find and Replace (Ctrl+F)

#### View Menu
- [ ] Zoom In (Ctrl++)
- [ ] Zoom Out (Ctrl+-)
- [ ] Zoom to Fit (Ctrl+1)
- [ ] Zoom to 100% (Ctrl+0)
- [ ] Show/Hide Rulers (Ctrl+R)
- [ ] Show/Hide Grid (Ctrl+')
- [ ] Grid Settings submenu
- [ ] Show/Hide Guides
- [ ] Show/Hide Element Boundaries
- [ ] Show/Hide Placeholder Highlights
- [ ] Preview Mode
- [ ] Presentation Mode (F11)

### 3.2 Interactive Controls
- [ ] Editable template name with click-to-edit
- [ ] Save status icon (saved/unsaved/saving)
- [ ] Undo/Redo with action preview tooltips
- [ ] Disabled state styling for buttons
- [ ] Loading spinners for async operations

### 3.3 Hover States
- [ ] All buttons: background color change + scale
- [ ] All links: underline + color change
- [ ] Dropdowns: arrow rotation + highlight
- [ ] Inputs: border color + shadow
- [ ] Icons: color change + scale
- [ ] Thumbnails: scale up + shadow
- [ ] Layer items: background highlight
- [ ] Tabs: background + border bottom

### 3.4 Click Interactions
- [ ] Single-click: select, activate, toggle
- [ ] Double-click: enter edit mode (text, images, tables)
- [ ] Shift-click: multi-select, range select
- [ ] Ctrl-click: toggle selection
- [ ] Click-and-drag: move, resize, rotate, pan
- [ ] Click outside: deselect, close menus

## 4. Main Canvas Workspace

### 4.1 Canvas Initialization
- [ ] Fabric.js canvas setup
- [ ] Custom object prototypes
- [ ] Default selection styling
- [ ] Canvas dimensions from page size
- [ ] Touch support configuration

### 4.2 Canvas Background & Presentation
- [ ] Neutral gray workspace background (#e0e0e0)
- [ ] White page canvas with shadow
- [ ] Centering logic (horizontal + vertical)
- [ ] Page boundary visualization
- [ ] Content clipping to page

### 4.3 Rulers
- [ ] Horizontal ruler (top of canvas)
- [ ] Vertical ruler (left of canvas)
- [ ] Unit switching (px, mm, cm, inch)
- [ ] Tick marks at logical intervals based on zoom
- [ ] Number labels at major ticks
- [ ] Click ruler to create guide
- [ ] Cursor position marker on ruler
- [ ] Drag origin point to reposition zero
- [ ] Ruler units toggle button (top-left corner)

### 4.4 Grid System
- [ ] Toggle visibility (View menu or shortcut)
- [ ] Spacing settings (8px, 16px, 32px, custom)
- [ ] Grid color picker
- [ ] Grid opacity slider
- [ ] Snap-to-grid toggle
- [ ] Grid not included in exports

### 4.5 Guides
- [ ] Horizontal guides (drag from horizontal ruler)
- [ ] Vertical guides (drag from vertical ruler)
- [ ] Guide color (usually blue/cyan)
- [ ] Draggable to reposition
- [ ] Double-click for precise position input
- [ ] Right-click to delete individual guide
- [ ] Measurement label while dragging
- [ ] Smart guides (auto-appear during drag)
- [ ] Snap-to-guide behavior
- [ ] Lock guides option
- [ ] Clear all guides button

### 4.6 Selection & Manipulation

#### Selection Behavior
- [ ] Click to select single element
- [ ] Click empty area to deselect
- [ ] Shift+click to add/remove from selection
- [ ] Drag rectangle to multi-select
- [ ] Ctrl+A to select all
- [ ] Tab to cycle through elements
- [ ] Escape to deselect

#### Selection Handles
- [ ] 8 resize handles (corners + edge midpoints)
- [ ] Rotation handle (above top-center)
- [ ] Handle size: 10-12px squares
- [ ] Handle color: primary blue
- [ ] Handle hover: scale up
- [ ] Cursor changes per handle direction

#### Dragging Elements
- [ ] Click-and-drag to move
- [ ] Show X/Y coordinates while dragging
- [ ] Smart guides appear when aligning
- [ ] Snap to grid (if enabled)
- [ ] Snap to guides (if enabled)
- [ ] Snap to other objects (if enabled)
- [ ] Hold Shift: constrain to horizontal/vertical
- [ ] Hold Alt: duplicate while dragging
- [ ] Drag outside bounds: auto-pan canvas (optional)

#### Resizing Elements
- [ ] Drag corner handles
- [ ] Default: proportional resize
- [ ] Hold Shift: non-proportional resize (toggle)
- [ ] Drag edge handles: resize in one dimension
- [ ] Show W×H dimensions while resizing
- [ ] Hold Alt: resize from center
- [ ] Minimum size constraints (prevent too small)
- [ ] Snap to grid/guides during resize

#### Rotating Elements
- [ ] Drag rotation handle
- [ ] Show angle in degrees while rotating
- [ ] Hold Shift: snap to 15° increments
- [ ] Rotation point: default center (customizable)
- [ ] Visual rotation indicator/arc

#### Multi-Selection
- [ ] Bounding box around all selected
- [ ] Resize all proportionally
- [ ] Maintain relative positions
- [ ] Group/ungroup controls visible

### 4.7 Context Menu (Right-Click)

#### Canvas Empty Area
- [ ] Paste (Ctrl+V)
- [ ] Select All (Ctrl+A)
- [ ] Add Text
- [ ] Add Shape submenu
- [ ] Add Image
- [ ] Add Table
- [ ] Grid Settings
- [ ] Rulers Settings
- [ ] Canvas Properties

#### Text Element
- [ ] Cut (Ctrl+X)
- [ ] Copy (Ctrl+C)
- [ ] Paste (Ctrl+V)
- [ ] Duplicate (Ctrl+D)
- [ ] Delete (Del)
- [ ] Edit Text (Enter)
- [ ] Font submenu
- [ ] Text Style submenu
- [ ] Convert to Placeholder
- [ ] Bring to Front/Forward
- [ ] Send to Back/Backward
- [ ] Group (if multiple selected)
- [ ] Lock Position
- [ ] Copy Style
- [ ] Paste Style

#### Image Element
- [ ] Cut, Copy, Paste, Duplicate, Delete
- [ ] Replace Image
- [ ] Edit Image (crop mode)
- [ ] Flip Horizontal
- [ ] Flip Vertical
- [ ] Rotate 90° CW/CCW
- [ ] Filters submenu
- [ ] Adjustments submenu
- [ ] Remove Background (AI)
- [ ] Layer controls
- [ ] Lock/Unlock

#### Shape Element
- [ ] Standard edit options
- [ ] Edit Points (for paths)
- [ ] Fill submenu
- [ ] Stroke submenu
- [ ] Convert to Image
- [ ] Layer controls

#### Table Element
- [ ] Standard edit options
- [ ] Insert Row Above/Below
- [ ] Insert Column Left/Right
- [ ] Delete Row/Column
- [ ] Merge Cells
- [ ] Split Cells
- [ ] Table Properties
- [ ] Select Row/Column/All

#### Group Element
- [ ] Ungroup (Ctrl+Shift+G)
- [ ] Enter Group (double-click)
- [ ] Exit Group
- [ ] Layer controls

#### Placeholder Element
- [ ] Edit Placeholder
- [ ] Map to Field
- [ ] Format submenu
- [ ] Preview with Data
- [ ] Conditional Rules

### 4.8 Keyboard Shortcuts (Canvas-Specific)
- [ ] Arrow keys: Move 1px
- [ ] Shift+Arrow: Move 10px
- [ ] Ctrl+]: Bring forward
- [ ] Ctrl+[: Send backward
- [ ] Ctrl+Shift+]: Bring to front
- [ ] Ctrl+Shift+[: Send to back
- [ ] Ctrl+G: Group
- [ ] Ctrl+Shift+G: Ungroup
- [ ] Ctrl+L: Lock
- [ ] Ctrl+Shift+L: Unlock
- [ ] Del/Backspace: Delete
- [ ] Escape: Deselect/Cancel
- [ ] Enter: Edit mode (text)
- [ ] Tab: Next element
- [ ] Shift+Tab: Previous element

### 4.9 Zoom & Pan
- [ ] Zoom slider in status bar
- [ ] Zoom dropdown with presets
- [ ] Ctrl+Scroll wheel: zoom
- [ ] Ctrl++ / Ctrl+-: zoom in/out
- [ ] Ctrl+0: 100% zoom
- [ ] Ctrl+1: Fit to window
- [ ] Spacebar+Drag: pan canvas
- [ ] Hand tool for panning
- [ ] Scroll wheel: vertical scroll
- [ ] Shift+Scroll: horizontal scroll

### 4.10 Multi-Page Support
- [ ] Page navigation controls (Prev/Next)
- [ ] Page indicator (Page X of Y)
- [ ] Thumbnail strip (toggleable)
- [ ] Add Page button
- [ ] Delete Page button
- [ ] Duplicate Page
- [ ] Reorder pages (drag in thumbnails)
- [ ] Each page maintains own layers

## 5. Element Library (Left Sidebar)

### 5.1 Tab Navigation
- [ ] Design tab (layout icon)
- [ ] Elements tab (shapes icon)
- [ ] Text tab (T icon)
- [ ] Uploads tab (upload icon)
- [ ] Photos tab (image icon)
- [ ] Brand tab (brand kit icon)
- [ ] Projects tab (folder icon)
- [ ] Apps tab (grid icon)
- [ ] Data tab (spreadsheet icon)

### 5.2 Design Tab
- [ ] Template presets (Certificates, Marksheets, etc.)
- [ ] Grid of clickable thumbnails
- [ ] Category organization
- [ ] Preset dimensions display
- [ ] Apply prompt (replace vs new)
- [ ] Page layout options (columns, grids)
- [ ] Content block presets
- [ ] Recently used section

### 5.3 Elements Tab

#### Quick Insert Row
- [ ] Rectangle icon
- [ ] Square icon
- [ ] Circle icon
- [ ] Line icon
- [ ] Text Box icon
- [ ] Image icon
- [ ] Horizontal scroll if needed

#### Shapes Category (Accordion)
- [ ] Basic: Rectangle, Square, Rounded Rectangle, Circle, Ellipse, Triangle
- [ ] Basic: Right Triangle, Diamond, Pentagon, Hexagon, Octagon
- [ ] Stars: 4-point, 5-point, 6-point, 8-point
- [ ] Special: Heart, Arrow (various directions)
- [ ] Lines & Arrows: Straight, Arrow, Double Arrow, Curved, Connectors
- [ ] Callouts: Rectangular, Rounded, Oval, Cloud, Thought Bubble
- [ ] Symbols: Checkmark, X, Plus, Minus, Question, Exclamation, Info
- [ ] Drag to canvas or click to insert at center

#### Text Elements Category
- [ ] Heading 1, 2, 3 with previews
- [ ] Body text preset
- [ ] Caption/small text preset
- [ ] Text Box (free-form)
- [ ] Vertical Text
- [ ] Curved Text/Text on Path
- [ ] Placeholder Text (mail merge)

#### Tables Category
- [ ] Insert Table button (row/col dialog)
- [ ] Preset sizes (2×2, 3×3, 4×4, 5×5)
- [ ] Spreadsheet data table
- [ ] Layout table

#### Frames & Masks Category
- [ ] Image frames (various shapes)
- [ ] Decorative borders
- [ ] Photo collage layouts
- [ ] Shape masks (circle, square, custom)

#### Charts & Data Category
- [ ] Bar Chart
- [ ] Line Chart
- [ ] Pie Chart
- [ ] Doughnut Chart
- [ ] Link to data source

#### QR Code & Barcodes Category
- [ ] QR Code generator (input/placeholder)
- [ ] Barcode types (Code 128, 39, EAN, UPC)
- [ ] Preview of generated code

#### Decorative Elements Category
- [ ] Dividers and separators
- [ ] Ornaments and flourishes
- [ ] Borders and corners
- [ ] Icons library (searchable)

#### Smart Objects Category
- [ ] Date/Time field (auto or data)
- [ ] Page Number field
- [ ] Document properties
- [ ] Signature line
- [ ] Logo placeholder

### 5.4 Text Tab
- [ ] "Add a text box" button
- [ ] "Add a heading" button
- [ ] "Add a subheading" button
- [ ] "Add body text" button
- [ ] Font combinations (curated pairs)
- [ ] Text styles (saved presets)
- [ ] Word Art styles gallery
- [ ] Curved text presets
- [ ] 3D text effects

### 5.5 Uploads Tab
- [ ] "Upload files" button (drag-drop)
- [ ] Supported formats note
- [ ] "Record yourself" option
- [ ] Uploaded Assets tabs (Images, Folders)
- [ ] Asset actions: Insert, Delete, Download, Rename, Move
- [ ] Search uploaded assets
- [ ] Recently used section

### 5.6 Photos Tab
- [ ] Search input (Google Drive / stock photos)
- [ ] Categories grid (Nature, Business, People, Education, etc.)
- [ ] Recent searches history
- [ ] Image preview on hover
- [ ] Pagination for results
- [ ] Filter options (size, color, orientation)

### 5.7 Brand Tab
- [ ] Upload brand logos
- [ ] Brand logo library
- [ ] Quick insert logos
- [ ] Brand colors section (primary, secondary, accent)
- [ ] Color palette with hex codes
- [ ] Click-to-copy hex
- [ ] Brand fonts section
- [ ] Set primary/secondary fonts
- [ ] Quick apply brand fonts

### 5.8 Projects Tab
- [ ] Recent templates (list/grid)
- [ ] Thumbnail, name, last modified
- [ ] Quick actions (Open, Duplicate, Delete)
- [ ] Search templates by name/category
- [ ] Folder navigation (Drive structure)

### 5.9 Apps Tab
- [ ] Integration tiles (clickable)
- [ ] Google Drive browser
- [ ] Image search
- [ ] Icon libraries
- [ ] QR generators
- [ ] Translation tool

### 5.10 Data Tab (Mail Merge)
- [ ] "Connect Data Source" button
- [ ] Current data file name
- [ ] "Change Data Source" button
- [ ] "Refresh Data" button
- [ ] Last updated timestamp
- [ ] Data preview table (first 5 rows)
- [ ] Total row count
- [ ] Available fields list
- [ ] Drag field to canvas
- [ ] Click field to insert at cursor
- [ ] Search/filter fields
- [ ] Insert placeholder dropdown

## 6. Contextual Formatting (Secondary Toolbar)

### 6.1 Canvas/Page Ribbon (No Selection)

#### Page Setup Section
- [ ] Page Size dropdown (A4, Letter, Legal, A3, A5, Custom)
- [ ] Orientation toggle (Portrait/Landscape icons)
- [ ] Margins button → popover (presets + custom)

#### Background Section
- [ ] Background Color picker
- [ ] Background Image button
- [ ] Background Pattern dropdown
- [ ] Background Opacity slider

#### Guides Section
- [ ] Add Horizontal Guide
- [ ] Add Vertical Guide
- [ ] Clear All Guides
- [ ] Lock Guides toggle

### 6.2 Text Ribbon (Text Selected)

#### Font Section
- [ ] Font Family dropdown (Google Fonts, searchable)
- [ ] Font Size dropdown (8-72+, custom input)
- [ ] Increase/Decrease font size buttons
- [ ] Bold (Ctrl+B)
- [ ] Italic (Ctrl+I)
- [ ] Underline (Ctrl+U)
- [ ] Underline style dropdown (single, double, dotted, dashed, wavy)
- [ ] Strikethrough (Ctrl+Shift+X)
- [ ] Subscript (Ctrl+Shift+,)
- [ ] Superscript (Ctrl+Shift+.)
- [ ] Clear formatting button

#### Text Color Section
- [ ] Text Color picker (recent, theme, full palette)
- [ ] Highlight/Background Color picker
- [ ] Text Shadow button → popover (offset, blur, color)
- [ ] Text Outline/Stroke (color, width)

#### Paragraph Section
- [ ] Alignment buttons (Left, Center, Right, Justify)
- [ ] Line Height dropdown (1.0, 1.15, 1.5, 2.0, etc.)
- [ ] Letter Spacing slider
- [ ] Paragraph Spacing (Before/After)
- [ ] Indent buttons (Increase/Decrease)
- [ ] First Line Indent input

#### List Section
- [ ] Bullet List toggle → bullet style dropdown
- [ ] Numbered List toggle → number style dropdown
- [ ] Decrease Indent
- [ ] Increase Indent

#### Text Effects Section
- [ ] All Caps toggle
- [ ] Small Caps toggle
- [ ] WordArt/Curved Text button
- [ ] Text Transform dropdown

#### Style Presets Section
- [ ] Heading 1 button
- [ ] Heading 2 button
- [ ] Heading 3 button
- [ ] Body Text preset
- [ ] Caption preset
- [ ] Custom Styles dropdown
- [ ] Save current style

### 6.3 Image Ribbon (Image Selected)

#### Image Section
- [ ] Replace Image button
- [ ] Crop button (enters crop mode)
- [ ] Flip Horizontal
- [ ] Flip Vertical
- [ ] Reset Image (revert to original)

#### Adjustments Section
- [ ] Brightness slider (-100 to +100)
- [ ] Contrast slider
- [ ] Saturation slider
- [ ] Blur slider
- [ ] Opacity slider (0-100%)

#### Filters Section
- [ ] Filter dropdown/gallery (None, Grayscale, Sepia, Invert, Vintage, Warm, Cool, High Contrast)
- [ ] Custom filter builder
- [ ] Filter Intensity slider

#### Image Effects Section
- [ ] Drop Shadow toggle → settings popover
- [ ] Border/Frame dropdown (presets + custom)
- [ ] Corner Radius slider
- [ ] Mask button → shape masks submenu

#### Advanced
- [ ] Background Remover button (AI)
- [ ] Image compression settings

### 6.4 Shape Ribbon (Shape Selected)

#### Fill Section
- [ ] Fill Type dropdown (Solid, Gradient, Pattern, None)
- [ ] Fill Color picker (for solid)
- [ ] Gradient editor (linear/radial, colors, stops, angle)
- [ ] Pattern selector
- [ ] Fill Opacity slider

#### Stroke/Border Section
- [ ] Stroke Color picker
- [ ] Stroke Width input (0-50px)
- [ ] Stroke Style dropdown (Solid, Dashed, Dotted, etc.)
- [ ] Stroke Opacity slider
- [ ] Stroke Position dropdown (Center, Inside, Outside)

#### Corner Section (Rectangles)
- [ ] Corner Radius slider
- [ ] Individual corner controls (toggle)

#### Shape-Specific Controls
- [ ] Polygons: Number of sides input
- [ ] Stars: Number of points, inner radius ratio
- [ ] Lines: Line caps, arrowheads
- [ ] Arcs: Start/end angle

### 6.5 Table Ribbon (Table Selected)

#### Table Structure
- [ ] Add Row Above
- [ ] Add Row Below
- [ ] Add Column Left
- [ ] Add Column Right
- [ ] Delete Row
- [ ] Delete Column
- [ ] Merge Cells
- [ ] Split Cells
- [ ] Table Properties button

#### Cell Formatting
- [ ] Cell Background Color
- [ ] Cell Border Color/Width
- [ ] Cell Padding input
- [ ] Vertical Alignment (Top, Middle, Bottom)
- [ ] Horizontal Alignment (Left, Center, Right)

#### Table Styles
- [ ] Preset table style gallery
- [ ] Striped rows toggle
- [ ] Header row highlight

### 6.6 Multi-Select Ribbon (Multiple Elements Selected)

#### Alignment Section
- [ ] Align Left
- [ ] Align Center Horizontally
- [ ] Align Right
- [ ] Align Top
- [ ] Align Middle Vertically
- [ ] Align Bottom
- [ ] Distribute Horizontally
- [ ] Distribute Vertically

#### Grouping Section
- [ ] Group (Ctrl+G)
- [ ] Ungroup (Ctrl+Shift+G)

#### Common Properties
- [ ] Opacity slider (applies to all)
- [ ] Delete All button

## 7. Configuration Panels (Right Sidebar)

### 7.1 Panel Tabs
- [ ] Properties tab
- [ ] Layers tab
- [ ] Data tab (mapping)
- [ ] History tab (undo list)

### 7.2 Properties Panel (No Selection)

#### Page Properties
- [ ] Page/Template name (editable)
- [ ] Category dropdown
- [ ] Description textarea

#### Page Dimensions
- [ ] Width input (with unit dropdown)
- [ ] Height input (with unit dropdown)
- [ ] Orientation toggle
- [ ] Size presets dropdown
- [ ] "Apply to All Pages" checkbox

#### Page Background
- [ ] Background type (Color/Image/Pattern)
- [ ] Color picker
- [ ] Image selector (position, size, repeat)
- [ ] Pattern selector
- [ ] Opacity slider

#### Page Margins
- [ ] Top, Right, Bottom, Left inputs
- [ ] Link toggle (same margin all sides)
- [ ] Show margins on canvas toggle

#### Watermark
- [ ] Enable watermark toggle
- [ ] Watermark type (Text/Image)
- [ ] Text: content, font, size, color, opacity, rotation
- [ ] Image: upload/select, size, opacity, position
- [ ] Position preset (Center, Corners, Tile)

### 7.3 Properties Panel (Element Selected)

#### Element Info Section
- [ ] Element type label
- [ ] Element name (editable, for layers)
- [ ] Placeholder toggle
- [ ] If placeholder: field mapping dropdown

#### Transform Section
- [ ] Position X input (with unit)
- [ ] Position Y input
- [ ] Width input (with lock aspect toggle)
- [ ] Height input
- [ ] Rotation angle input (degrees)
- [ ] Flip Horizontal button
- [ ] Flip Vertical button

#### Appearance Section (All Elements)
- [ ] Opacity slider (0-100%)
- [ ] Blend mode dropdown (Normal, Multiply, Screen, Overlay, etc.)

#### Text Element Properties
- [ ] All font properties (from toolbar)
- [ ] Text content editor (quick edit)
- [ ] Character limit (optional, shows count)
- [ ] Overflow behavior (Visible, Hidden, Ellipsis, Shrink)

#### Shape Element Properties
- [ ] All fill and stroke properties
- [ ] Shadow settings (enable, offset, blur, spread, color)

#### Image Element Properties
- [ ] All filter/adjustment sliders
- [ ] Source display (filename/URL)
- [ ] Replace button
- [ ] Fit mode (Fill, Fit, Stretch, Tile)
- [ ] Crop button

#### Table Element Properties
- [ ] Rows/Columns count
- [ ] Cell width/height
- [ ] Border settings
- [ ] Background settings
- [ ] Data population options

#### Link Section
- [ ] Add/Edit Link button
- [ ] Link type (URL, Email, Phone, Page link)
- [ ] Link URL input
- [ ] Open in new tab toggle
- [ ] Test Link button

#### Actions Section (Interactive PDFs)
- [ ] On Click action dropdown
- [ ] Action configuration

#### Advanced Section (Collapsible)
- [ ] Element ID (auto-generated)
- [ ] CSS class input
- [ ] Custom data attributes
- [ ] Export settings (include/exclude)

### 7.4 Page Panel
- [ ] All page properties (same as Properties when nothing selected)
- [ ] Document setup section (DPI, units, bleed)
- [ ] Header & Footer (for multi-page)
- [ ] Page numbering settings

### 7.5 Layers Panel

#### Layer List
- [ ] Eye icon (visibility toggle)
- [ ] Lock icon (lock toggle)
- [ ] Element type icon
- [ ] Element name (double-click to rename)
- [ ] Thumbnail preview (optional)
- [ ] Z-index order (top to bottom)
- [ ] Selected element highlighted
- [ ] Multi-select with Shift/Ctrl

#### Layer Actions
- [ ] Drag to reorder layers
- [ ] Right-click context menu
- [ ] Delete, Duplicate, Group, Lock, Hide

#### Layer Controls (Toolbar)
- [ ] Add new layer/element dropdown
- [ ] Delete selected layer
- [ ] Duplicate selected layer
- [ ] Group selected layers
- [ ] Ungroup button
- [ ] Lock/Unlock toggle
- [ ] Show/Hide toggle

#### Group Handling
- [ ] Groups as expandable/collapsible entries
- [ ] Indent child elements
- [ ] Expand/collapse toggle icon

#### Search/Filter
- [ ] Search input (filter by name)
- [ ] Filter dropdown (All, Images, Text, Shapes, Placeholders)

### 7.6 Data Tab (in Right Panel)
- [ ] Placeholder list with mapping status
- [ ] Map to column dropdown per placeholder
- [ ] Validation indicators
- [ ] Preview with current row

### 7.7 History Tab
- [ ] Undo list (with action names)
- [ ] Click to jump to state
- [ ] Redo list (grayed out)
- [ ] Clear history button
- [ ] History limit indicator

### 7.8 Accordion Sections
- [ ] Collapsible sections (click to expand/collapse)
- [ ] Remember collapsed state per session
- [ ] "Expand All" / "Collapse All" buttons

## 8. Mail Merge & Logic

### 8.1 Start Mail Merge
- [ ] Start Mail Merge button/dropdown
- [ ] Document type options (Labels, Envelopes, Single, Directory)
- [ ] Configure layout for type

### 8.2 Select Recipients
- [ ] Select Data Source button (file picker)
- [ ] Connected source indicator
- [ ] Edit Recipient List button → modal
- [ ] Refresh Data button

### 8.3 Edit Recipient List Modal
- [ ] Full spreadsheet view (scrollable)
- [ ] Column headers (sortable)
- [ ] Row numbers
- [ ] Checkbox column (include/exclude rows)
- [ ] Select All / Deselect All
- [ ] Add Row, Delete Selected Rows
- [ ] Find and Replace
- [ ] Duplicate Row
- [ ] Filter controls per column
- [ ] Active filters display
- [ ] Clear all filters
- [ ] Data validation (highlight issues)
- [ ] Validation rules config

### 8.4 Insert Merge Fields
- [ ] Highlight Merge Fields button (toggle)
- [ ] Address Block builder
- [ ] Greeting Line builder
- [ ] Insert Merge Field dropdown (all fields)
- [ ] Drag field to canvas

### 8.5 Rules & Conditional Logic
- [ ] Rules button
- [ ] If...Then...Else rules
- [ ] Show field only if condition
- [ ] Skip record if condition
- [ ] Field formatting rules (uppercase, date format, number format)

### 8.6 Match Fields
- [ ] Two-column layout (Placeholder | Data Column)
- [ ] Auto-match by similar names
- [ ] Manual override capability

### 8.7 Preview & Navigation
- [ ] Preview Toggle (placeholders vs data)
- [ ] Previous Record button
- [ ] Record number input/indicator
- [ ] Next Record button
- [ ] First Record button
- [ ] Last Record button
- [ ] Find Recipient (search in data)

### 8.8 Check for Errors
- [ ] Scan for unmapped placeholders
- [ ] Scan for missing data
- [ ] Invalid field references
- [ ] Formatting issues
- [ ] Error report display with fixes

### 8.9 Finish & Merge
- [ ] Edit Individual Documents (generate all, then edit)
- [ ] Print Documents (send to print dialog)
- [ ] Send Email Messages (if email field)
- [ ] Generate PDFs (batch to Drive)

### 8.10 Merge Options Dialog
- [ ] Record range (All, Current, Range start/end)
- [ ] Output destination folder
- [ ] File naming pattern builder
- [ ] Output format selection
- [ ] Quality/resolution settings
- [ ] Include/exclude options

### 8.11 Conditional Elements
- [ ] Conditional Text (with condition builder)
- [ ] Operators: equals, not equals, contains, starts with, ends with, >, <, is empty, is not empty
- [ ] AND/OR logic
- [ ] Conditional Visibility (show/hide)
- [ ] Conditional Formatting (change style based on data)

## 9. File Operations & Export

### 9.1 Save Operations
- [ ] Save to LocalStorage
- [ ] Save to backend file system
- [ ] Auto-save every 30 seconds
- [ ] Save As with category selection
- [ ] Version naming/numbering
- [ ] Save indicator animation

### 9.2 Export Operations
- [ ] Export as PNG
- [ ] Export as High-Quality PDF (jsPDF)
- [ ] Export as SVG
- [ ] Export as JSON Template
- [ ] Export batch as ZIP
- [ ] Export with custom DPI/resolution
- [ ] WYSIWYG export guarantee

### 9.3 Google Drive Integration
- [ ] Browse Drive files
- [ ] Save template to Drive
- [ ] Open from Drive
- [ ] Sync templates
- [ ] Upload assets to Drive
- [ ] Manage asset folders
- [ ] Track asset usage

### 9.4 Template Management
- [ ] Template Info/Properties modal
- [ ] Metadata editing (author, version, tags)
- [ ] Template preview thumbnail
- [ ] Duplicate template
- [ ] Move to folder
- [ ] Delete template (with confirmation)
- [ ] Rename template

### 9.5 Version History
- [ ] Slider UI to navigate versions
- [ ] Version name/timestamp
- [ ] Compare versions
- [ ] Restore to version
- [ ] Fork from version

### 9.6 Print Operations
- [ ] Print preview
- [ ] Page setup dialog
- [ ] Printer selection
- [ ] Print quality settings
- [ ] Copies count
- [ ] Page range selection

## 10. Element Type Implementations

### 10.1 Text Elements
- [ ] Textbox (free-form, wrapping)
- [ ] Fixed text (auto-size)
- [ ] Rich text (mixed formatting)
- [ ] Vertical text
- [ ] Text on path (custom SVG path)
- [ ] Curved text (arc, circle, wave)
- [ ] All formatting properties
- [ ] Text effects (gradient, shadow, outline)

### 10.2 Placeholder Elements
- [ ] Visual distinction (border color, icon)
- [ ] Tooltip showing field name
- [ ] Format patterns (uppercase, date, currency, etc.)
- [ ] Fallback values
- [ ] Conditional display rules
- [ ] Preview mode replacement

### 10.3 Shape Elements
- [ ] Basic shapes (rect, circle, triangle, etc.)
- [ ] Polygons (3-20 sides)
- [ ] Stars (3-20 points, inner radius)
- [ ] Lines (with caps, arrowheads)
- [ ] Curves (bezier paths)
- [ ] Custom SVG paths
- [ ] Fill types (solid, gradient, pattern, image)
- [ ] Stroke styles
- [ ] Corner radius (individual corners)
- [ ] Shadow effects

### 10.4 Image Elements
- [ ] Static images
- [ ] Dynamic images (URL from data)
- [ ] Crop mode (draggable handles, darkened area outside)
- [ ] Flip horizontal/vertical
- [ ] Filters (brightness, contrast, saturation, hue, blur, grayscale, sepia)
- [ ] Filter presets (vintage, cold, warm, dramatic, etc.)
- [ ] Border/frame
- [ ] Corner radius
- [ ] Masks (shape clipping)
- [ ] Background removal (AI optional)
- [ ] Fit modes (fill, fit, stretch, tile)

### 10.5 Table Elements
- [ ] Variable rows/columns
- [ ] Cell content (text or placeholder)
- [ ] Cell styling (background, border, padding, alignment)
- [ ] Merge cells
- [ ] Split cells
- [ ] Insert/delete rows/columns
- [ ] Table-wide styling
- [ ] Striped rows
- [ ] Header row highlight
- [ ] Data population from Excel
- [ ] Column mapping

### 10.6 QR Code Elements
- [ ] Data input (static or placeholder)
- [ ] Error correction levels (L, M, Q, H)
- [ ] Margin setting
- [ ] Foreground/background colors
- [ ] Size/resolution
- [ ] Logo in center (optional)
- [ ] Custom styling
- [ ] Generate on template save
- [ ] Regenerate on data change

### 10.7 Barcode Elements
- [ ] Barcode formats (Code128, Code39, EAN13, EAN8, UPC)
- [ ] Data input (static or placeholder)
- [ ] Show/hide text value
- [ ] Font size/alignment for text
- [ ] Line color/background
- [ ] Width/height
- [ ] Quiet zone
- [ ] Validation

### 10.8 Group Elements
- [ ] Group/ungroup controls
- [ ] Group bounding box
- [ ] Nested groups
- [ ] Enter/exit group mode (double-click)
- [ ] Maintain relative positions
- [ ] Group-level transforms

### 10.9 Signature Line
- [ ] Signer name field
- [ ] Signer title field
- [ ] Date signed field (auto or placeholder)
- [ ] Signature image placeholder
- [ ] Instructions text
- [ ] Line style

### 10.10 Date/Time Field
- [ ] Format pattern (various formats)
- [ ] Source (current date, placeholder, fixed date)
- [ ] Update behavior (static or auto)
- [ ] Timezone setting

### 10.11 Page Number Field
- [ ] Format (1, "Page 1", "1 of N", roman numerals)
- [ ] Starting number
- [ ] Font styling
- [ ] Position (header/footer)

### 10.12 Header & Footer
- [ ] Content area with design elements
- [ ] Height setting
- [ ] Appears on every page
- [ ] Can contain page numbers, title, logo

## 11. Keyboard Shortcuts

### 11.1 File Operations
- [ ] Ctrl+N: New template
- [ ] Ctrl+O: Open from Drive
- [ ] Ctrl+S: Save
- [ ] Ctrl+Shift+S: Save As
- [ ] Ctrl+P: Print
- [ ] Ctrl+E: Export

### 11.2 Edit Operations
- [ ] Ctrl+Z: Undo
- [ ] Ctrl+Y / Ctrl+Shift+Z: Redo
- [ ] Ctrl+X: Cut
- [ ] Ctrl+C: Copy
- [ ] Ctrl+V: Paste
- [ ] Ctrl+D: Duplicate
- [ ] Del / Backspace: Delete
- [ ] Ctrl+A: Select All
- [ ] Escape: Deselect / Cancel / Exit mode

### 11.3 View Operations
- [ ] Ctrl++ / Ctrl+=: Zoom in
- [ ] Ctrl+-: Zoom out
- [ ] Ctrl+0: Zoom to 100%
- [ ] Ctrl+1: Zoom to fit
- [ ] Ctrl+R: Toggle rulers
- [ ] Ctrl+': Toggle grid
- [ ] F11: Fullscreen

### 11.4 Text Formatting
- [ ] Ctrl+B: Bold
- [ ] Ctrl+I: Italic
- [ ] Ctrl+U: Underline
- [ ] Ctrl+Shift+X: Strikethrough
- [ ] Ctrl+Shift+.: Superscript
- [ ] Ctrl+Shift+,: Subscript
- [ ] Ctrl+L: Align left
- [ ] Ctrl+E: Align center
- [ ] Ctrl+R: Align right
- [ ] Ctrl+J: Justify

### 11.5 Object Manipulation
- [ ] Arrow keys: Move 1px
- [ ] Shift+Arrow: Move 10px
- [ ] Ctrl+]: Bring forward
- [ ] Ctrl+[: Send backward
- [ ] Ctrl+Shift+]: Bring to front
- [ ] Ctrl+Shift+[: Send to back
- [ ] Ctrl+G: Group
- [ ] Ctrl+Shift+G: Ungroup
- [ ] Ctrl+L: Lock
- [ ] Ctrl+Shift+L: Unlock

### 11.6 Canvas Navigation
- [ ] Spacebar+Drag: Pan
- [ ] Scroll wheel: Vertical scroll
- [ ] Shift+Scroll: Horizontal scroll
- [ ] Ctrl+Scroll: Zoom
- [ ] Double-click text: Enter edit
- [ ] Double-click image: Crop mode
- [ ] Hold Alt+Drag: Duplicate
- [ ] Hold Shift+Drag: Constrain axis
- [ ] Hold Shift+Resize: Toggle aspect ratio

### 11.7 Shortcuts Reference Panel
- [ ] Open with Ctrl+/ or Help menu
- [ ] Searchable
- [ ] Organized by category
- [ ] Visual key representation
- [ ] Customizable shortcuts (future)

## 12. Final Polish & UX

### 12.1 Visual Design System
- [ ] Consistent color palette (primary, secondary, success, warning, error, neutral)
- [ ] Spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- [ ] Typography scale (12px-72px)
- [ ] UI font stack (Inter, SF Pro, Segoe UI)
- [ ] Icon consistency (Lucide)
- [ ] Custom scrollbar styling
- [ ] Button styles (primary, secondary, ghost, danger)
- [ ] Input styling (consistent height, border radius, focus states)
- [ ] Dropdown styling
- [ ] Tooltips (dark background, light text, 300-500ms delay)
- [ ] Modals (centered, backdrop, animations)
- [ ] Toast notifications (success, error, warning, info)

### 12.2 Transitions & Animations
- [ ] Button hover (150-300ms ease-out)
- [ ] Panel expand/collapse (smooth)
- [ ] Modal open/close (fade + scale)
- [ ] Tooltip appear (fade)
- [ ] Loading states (spinners, skeleton screens)
- [ ] Canvas element manipulation (immediate, no animation)
- [ ] Micro-interactions (checkbox check, toggle switch)

### 12.3 Loading States
- [ ] Skeleton screens for panels
- [ ] Spinner for async operations
- [ ] Progress bars for long tasks (generation)
- [ ] Button loading states (spinner inside)
- [ ] Disabled states during loading

### 12.4 Error Handling
- [ ] Toast notifications for errors
- [ ] Inline validation (red borders, error messages)
- [ ] Confirmation dialogs for destructive actions
- [ ] Graceful error recovery
- [ ] Retry mechanisms
- [ ] Clear error messages with solutions
- [ ] Network error handling

### 12.5 Accessibility (WCAG AA)
- [ ] Sufficient color contrast (4.5:1 text, 3:1 UI)
- [ ] Focus visible on all interactive elements
- [ ] Keyboard navigation for all features
- [ ] Screen reader labels (aria-label, aria-labelledby)
- [ ] No information by color alone
- [ ] Skip links for main content
- [ ] Focus trapping in modals
- [ ] Semantic HTML
- [ ] Alt text for images
- [ ] Form field labels

### 12.6 Performance Optimization
- [ ] Virtualization for large lists (layers, libraries)
- [ ] Debounce frequent updates (typing, dragging)
- [ ] requestAnimationFrame for smooth updates
- [ ] Lazy-load sidebar content
- [ ] Image optimization (thumbnails, compression)
- [ ] Canvas rendering optimization
- [ ] Code splitting for large features
- [ ] Memoization for expensive computations

### 12.7 Responsive Behavior
- [ ] Auto-collapse sidebars < 1440px
- [ ] Icon-only mode with flyouts
- [ ] Touch-friendly controls for tablets
- [ ] Desktop recommendation < 1024px
- [ ] Minimum width: 1024px

### 12.8 User Preferences
- [ ] Theme (light/dark) - future
- [ ] Default units (px, mm, cm, inch)
- [ ] Auto-save interval
- [ ] Grid size preference
- [ ] Snap settings default
- [ ] Ruler visibility default
- [ ] Tooltip delay
- [ ] Keyboard shortcuts customization - future

### 12.9 Help & Documentation
- [ ] Help menu
- [ ] Keyboard shortcuts reference
- [ ] Tutorial modals (first-time user)
- [ ] Tooltips on all icons
- [ ] Context-sensitive help
- [ ] Video tutorials (links)
- [ ] FAQ page
- [ ] Contact support

### 12.10 Testing & Validation
- [ ] Template validation before save
- [ ] Data validation before merge
- [ ] Element bounds checking
- [ ] Font reference validation
- [ ] Image reference validation
- [ ] Circular group reference check
- [ ] Required placeholder mapping check

### 12.11 Additional Features
- [ ] Collaboration (comments mode) - future
- [ ] Real-time collaboration - future
- [ ] Template marketplace - future
- [ ] AI-powered suggestions - future
- [ ] Multi-language support - future
- [ ] Custom plugins/extensions - future

---
