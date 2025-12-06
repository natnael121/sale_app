# Field Operations Map View - Documentation

## Overview
The Field Operations Map View is a comprehensive mapping interface for administrators to visualize and track all field agent activities, meeting check-ins, and lead locations in real-time.

## Features

### 1. Interactive Map Display
- Full-screen interactive map using Leaflet and OpenStreetMap
- Responsive design that works on all devices
- Smooth pan and zoom controls
- Real-time data visualization

### 2. Data Visualization

#### Meeting Check-ins
- **Green Markers**: Completed meetings with check-in data
- **Yellow Markers**: In-progress meetings
- **Blue Markers**: Scheduled meetings
- Shows meeting location, status, check-in time, and uploaded photos
- Displays meeting notes and scheduled times

#### Lead Locations
- **Emerald Markers**: Converted leads
- **Green Markers**: Interested leads
- **Yellow Markers**: Contacted leads
- **Gray Markers**: New leads
- Shows company name, manager details, phone numbers, and addresses
- Displays lead status and sector information

### 3. Advanced Filtering
- **Layer Toggles**: Show/hide meetings and leads independently
- **Status Filter**: Filter meetings by scheduled, in-progress, or completed
- **Date Range**: Filter by today, week, month, or all time
- **Search Function**: Search by location, company name, notes, or other details

### 4. Statistics Dashboard
- Total meetings count
- Completed meetings count
- Active field agents count
- Total mapped leads count

### 5. Interactive Features
- Click markers to view detailed information in popups
- "My Location" button to center map on user's current position
- Auto-fit bounds to show all markers
- Color-coded legend for easy identification

## How to Use

### For Admins:
1. Navigate to "Field Operations Map" from the sidebar
2. View all field agent activities on the map
3. Use filters to narrow down specific data:
   - Toggle meeting/lead visibility
   - Filter by meeting status
   - Search for specific locations or companies
4. Click on markers to see detailed information
5. Use "My Location" to center the map on your position

### Data Requirements:
- **Meetings**: Must have check-in data (latitude/longitude) to appear on map
- **Leads**: Must have location data (latitude/longitude) saved during creation

## Technical Implementation

### Components:
- **AdminMapView**: Main component (`src/components/map/AdminMapView.tsx`)
- Uses Leaflet library for map rendering
- Integrates with Firebase Firestore for real-time data

### Data Sources:
- Meetings collection (filtered by organization)
- Leads collection (filtered by organization and location data)
- Users collection (field agents only)

### Map Service:
- Utilizes existing `mapService.ts` for map utilities
- Custom markers with color coding
- Popup generation with detailed information

### Routes:
- Path: `/map`
- Access: Admin role only
- Navigation: Added to admin sidebar

## Color Coding Reference

### Meetings:
- 🟢 Green = Completed
- 🟡 Yellow = In Progress
- 🔵 Blue = Scheduled

### Leads:
- 🟢 Emerald = Converted
- 🟢 Green = Interested
- 🟡 Yellow = Contacted
- ⚫ Gray = New

## Future Enhancements (Suggested)
- Real-time field agent tracking
- Route optimization for field agents
- Heat map for high-activity areas
- Export map data to reports
- Distance calculations between locations
- Clustering for dense marker areas
- Custom date range picker
- Photo preview in popups
- Direct navigation integration (Google Maps/Waze)
- Meeting scheduling directly from map
- Lead assignment from map view

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Requires JavaScript enabled
- Geolocation support for "My Location" feature
