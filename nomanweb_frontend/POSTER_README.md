# NoManWeb ReKrutor Poster - Design Documentation

## Overview
This document contains the complete poster design for the **NoManWeb ReKrutor AI Recruitment Platform**. The poster showcases the dual-sided recruitment matching platform with AI-powered features.

## Design Specifications

### Dimensions & Format
- **Size**: 80cm × 180cm (Portrait orientation)
- **Aspect Ratio**: 4:9
- **Format**: Vector SVG (Scalable Vector Graphics)
- **File**: `poster-nomanweb.svg`

### Design Concept
**Concept C: Split Accent Strip**
- Left vertical gradient strip (#18243c → #3b82f6)
- Clean white content area on the right
- Modern, professional layout with floating elements
- Brand-aligned color scheme and typography

### Brand Elements Used

#### Colors
- **Primary Dark**: `#18243c` (Deep navy)
- **Secondary Teal**: `#4ca1af` (Brand teal)
- **Accent Blue**: `#3b82f6` (Bright blue)
- **Background**: `#f8fafc` (Light gray)
- **Text**: `#64748b` (Medium gray)

#### Typography
- **Headlines**: Inter (800 weight, uppercase, 48px)
- **Subheadings**: Inter (600-700 weight, 24px)
- **Body Text**: Open Sans (400 weight, 16px)
- **Feature Text**: Open Sans (400 weight, 11px)
- **Labels**: Inter (700 weight, various sizes)

#### Logo
- NoManWeb branding positioned in top-right area
- Clean, minimal text-based logo treatment

## Content Structure

### Main Sections
1. **Header**: NoManWeb logo and main headline "ARTIFICIAL INTELLIGENCE"
2. **Subtitle**: Platform description and "Open Yoke" branding
3. **AI Features Grid**: 6 key features in organized layout
4. **Platform Screenshots**: Mock interface preview
5. **Tech Stack**: Technology icons and labels
6. **Team Credits**: Development team and advisor information
7. **Institution**: University branding and logos
8. **QR Code**: Scan for demo functionality

### Featured AI Capabilities
1. **Resume Parsing & Extraction**
2. **AI Summarization with Gemini**
3. **Video Resume Processing**
4. **Smart Mailing & Nudge System**
5. **Recruiter Rating System**
6. **Automated Matching System**

## File Structure

```
public/
├── poster-nomanweb.svg          # Main poster file (80×180cm)
├── logo.png                     # NoManWeb logo option 1
├── logo1.png                    # NoManWeb logo option 2
└── old-logo.png                 # NoManWeb logo option 3

pages/
└── poster-preview.js            # Next.js preview page

POSTER_README.md                 # This documentation
```

## Usage Instructions

### For Web Display
1. Use the SVG file directly in web applications
2. The file is optimized for web viewing and scaling
3. Preview available at: `http://localhost:3000/poster-preview`

### For Print Production

#### Recommended Print Settings
- **Resolution**: Vector format (infinite scalability)
- **Color Mode**: Convert to CMYK for offset printing
- **Bleed**: Add 3mm bleed if required by printer
- **Paper**: High-quality poster paper or vinyl
- **Finish**: Matte or semi-gloss recommended

#### Print Preparation Steps
1. **Use SVG for best quality** - Vector format ensures crisp edges at any size
2. **Convert to PDF if needed** - Some printers prefer PDF format
3. **Check color profiles** - Ensure CMYK conversion maintains brand colors
4. **Verify dimensions** - Confirm 80×180cm output size with printer
5. **Test print** - Consider a smaller test print to verify colors

#### Color Conversion Notes
- `#18243c` → CMYK: C:85 M:70 Y:0 K:65 (approximate)
- `#4ca1af` → CMYK: C:60 M:0 Y:25 K:15 (approximate)
- `#3b82f6` → CMYK: C:75 M:45 Y:0 K:0 (approximate)

*Note: Exact CMYK values may vary depending on printing process and paper type. Always consult with your printer for color matching.*

### Export Options

#### For Digital Use
- **SVG**: Use original file (recommended)
- **PNG**: Export at 300 DPI for high-quality raster
- **JPG**: Export at 300 DPI for smaller file size

#### For Print Use
- **PDF**: Convert SVG to PDF with embedded fonts
- **EPS**: Vector format for professional printing
- **High-res PNG**: 300 DPI minimum (2362×5315 pixels)

## Preview & Review

### Online Preview
Access the interactive preview at: `http://localhost:3000/poster-preview`

**Preview Features:**
- Scalable view (20% to 100%)
- Grid overlay for alignment checking
- Direct SVG download
- Print specifications display
- Responsive design for different screen sizes

### Review Checklist
- [ ] Brand colors match specifications
- [ ] Typography is consistent and readable
- [ ] All text content is accurate
- [ ] Logo placement and sizing is appropriate
- [ ] QR code is functional (if applicable)
- [ ] Layout works at target print size
- [ ] File exports correctly for intended use

## Technical Details

### SVG Specifications
- **Viewport**: 800×1800 units
- **Coordinate System**: Top-left origin
- **Text Rendering**: Embedded font families
- **Color Format**: Hex values with gradients
- **File Size**: Optimized for web delivery

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- SVG support required
- Responsive design for mobile viewing

## Maintenance & Updates

### Making Changes
1. Edit the SVG file directly for text/color changes
2. Update the preview page if layout changes significantly
3. Test changes in the preview environment
4. Update this documentation for major revisions

### Version Control
- Current version: 1.0
- Created: January 2025
- Last updated: January 2025

## Contact & Support

For questions about the poster design or technical implementation:
- **Project**: NoManWeb ReKrutor Platform
- **Design**: AI-powered recruitment matching system
- **Institution**: Vincent Mary School of Engineering, Assumption University

---

*This poster was created using Concept C (Split Accent Strip) design with NoManWeb brand guidelines and optimized for both digital and print applications.*