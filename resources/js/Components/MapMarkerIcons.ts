/**
 * MapMarkerIcons.ts
 * Dedicated custom map marker icons and SVG builders for Masarat Wasel.
 * Provides high-performance, lightweight vector markers with ground pointer needles/stems
 * to avoid UI crowding and support interactive hover & selection expansion.
 */

// -------------------------------------------------------------
// 1. OFFICIAL SCHOOL BUILDING SVG PATHS (Provided by User)
// -------------------------------------------------------------
export const SCHOOL_SVG_PATHS = `
<path d="M33 11.8c0 .5-.5 1-1 1s-1-.5-1-1V1c0-.6.5-1 1-1s1 .4 1 1v10.8" fill="#b2c1c0"/>
<path fill="#e5dec1" d="M4 28h56v32H4z"/>
<path d="M60.5 19.8c-.5-1-1.8-1.8-3-1.8H6.4c-1.1 0-2.5.8-3 1.8L.1 26.2c-.5 1 0 1.8 1.1 1.8h61.4c1.1 0 1.6-.8 1.1-1.8l-3.2-6.4" fill="#d33b23"/>
<g fill="#d6eef0">
<path d="M15 45c0 .5-.4 1-1 1H8c-.6 0-1-.5-1-1v-4c0-.5.4-1 1-1h6c.6 0 1 .5 1 1v4"/>
<path d="M15 35c0 .5-.4 1-1 1H8c-.6 0-1-.5-1-1v-4c0-.5.4-1 1-1h6c.6 0 1 .5 1 1v4"/>
</g>
<g fill="#dbb471">
<path d="M14 36.5H8c-.8 0-1.5-.7-1.5-1.5v-4c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5m-6-6c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5h6c.3 0 .5-.2.5-.5v-4c0-.3-.2-.5-.5-.5H8"/>
<path d="M10.5 30h1v6h-1z"/>
<path d="M14 47H8c-.8 0-1.5-.7-1.5-1.5v-4c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5m-6-6c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5h6c.3 0 .5-.2.5-.5v-4c0-.3-.2-.5-.5-.5H8"/>
<path d="M10.5 40.5h1v6h-1z"/>
</g>
<path d="M15 55c0 .5-.4 1-1 1H8c-.6 0-1-.5-1-1v-4c0-.5.4-1 1-1h6c.6 0 1 .5 1 1v4" fill="#d6eef0"/>
<g fill="#dbb471">
<path d="M14 57H8c-.8 0-1.5-.7-1.5-1.5v-4c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5m-6-6c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5h6c.3 0 .5-.2.5-.5v-4c0-.3-.2-.5-.5-.5H8"/>
<path d="M10.5 50.5h1v6h-1z"/>
</g>
<g fill="#d6eef0">
<path d="M57 45c0 .5-.5 1-1 1h-6c-.5 0-1-.5-1-1v-4c0-.5.5-1 1-1h6c.5 0 1 .5 1 1v4"/>
<path d="M57 35c0 .5-.5 1-1 1h-6c-.5 0-1-.5-1-1v-4c0-.5.5-1 1-1h6c.5 0 1 .5 1 1v4"/>
</g>
<g fill="#dbb471">
<path d="M56 36.5h-6c-.8 0-1.5-.7-1.5-1.5v-4c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5m-6-6c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5h6c.3 0 .5-.2.5-.5v-4c0-.3-.2-.5-.5-.5h-6"/>
<path d="M52.5 30h1v6h-1z"/>
<path d="M56 47h-6c-.8 0-1.5-.7-1.5-1.5v-4c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5m-6-6c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5h6c.3 0 .5-.2.5-.5v-4c0-.3-.2-.5-.5-.5h-6"/>
<path d="M52.5 40.5h1v6h-1z"/>
</g>
<path d="M57 55c0 .5-.5 1-1 1h-6c-.5 0-1-.5-1-1v-4c0-.5.5-1 1-1h6c.5 0 1 .5 1 1v4" fill="#d6eef0"/>
<g fill="#dbb471">
<path d="M56 57h-6c-.8 0-1.5-.7-1.5-1.5v-4c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5m-6-6c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5h6c.3 0 .5-.2.5-.5v-4c0-.3-.2-.5-.5-.5h-6"/>
<path d="M52.5 50.5h1v6h-1z"/>
</g>
<path d="M32.8 11.6c-.4-.3-1.1-.3-1.6 0L11.8 27.4c-.4.3-.4.6.2.6h40c.5 0 .7-.3.2-.6L32.8 11.6" fill="#f15744"/>
<path d="M48.2 27.4L32.8 14.6c-.4-.4-1.1-.4-1.5 0L15.8 27.4c-.5.3-.4.6.2.6h2v32h28V28h2c.5 0 .7-.3.2-.6" fill="#f9f3d9"/>
<path fill="#e5dec1" d="M24 45h16v15H24z"/>
<path fill="#42ade2" d="M26 45h12v15H26z"/>
<g fill="#89664c">
<path d="M20.2 38c.3.1.7.2 1.1.2c.5 0 .7-.2.7-.4s-.2-.4-.7-.5c-.7-.2-1.2-.6-1.2-1.1c0-.7.6-1.2 1.7-1.2c.5 0 .9.1 1.1.2l-.2.7c-.2-.1-.5-.2-.9-.2s-.6.2-.6.4s.2.4.8.5c.8.3 1.1.6 1.1 1.2s-.6 1.2-1.8 1.2c-.5 0-1-.1-1.2-.2l.1-.8"/>
<path d="M26.9 38.8c-.2.1-.6.2-1.1.2c-1.5 0-2.3-.8-2.3-1.9c0-1.3 1.1-2.1 2.4-2.1c.5 0 .9.1 1.1.2l-.2.7c-.2-.1-.5-.1-.8-.1c-.8 0-1.4.4-1.4 1.3c0 .8.5 1.3 1.4 1.3c.3 0 .6-.1.8-.1l.1.5"/>
<path d="M28.5 35.1v1.5h1.6v-1.5h1V39h-1v-1.6h-1.6V39h-1v-3.9h1"/>
<path d="M36 37c0 1.3-.9 2-2.1 2c-1.3 0-2.1-.9-2.1-2c0-1.2.8-2 2.1-2s2.1.9 2.1 2m-3.2 0c0 .8.4 1.3 1.1 1.3c.7 0 1-.6 1-1.3c0-.7-.4-1.3-1.1-1.3c-.6 0-1 .6-1 1.3"/>
<path d="M40.6 37c0 1.3-.9 2-2.1 2c-1.3 0-2.1-.9-2.1-2c0-1.2.8-2 2.1-2c1.4 0 2.1.9 2.1 2m-3.1 0c0 .8.4 1.3 1.1 1.3c.7 0 1-.6 1-1.3c0-.7-.4-1.3-1.1-1.3c-.6 0-1 .6-1 1.3"/>
<path d="M41.3 35.1h1v3.1H44v.7h-2.7v-3.8"/>
</g>
<circle cx="32" cy="26" r="7" fill="#dbb471"/>
<circle cx="32" cy="26" r="5" fill="#ffffff"/>
<path fill="#e5dec1" d="M31.5 45h1v15h-1z"/>
<path d="M32 22c-.5 0-1 .5-1 1v4c0 .5.5 1 1 1s1-.5 1-1v-4c0-.5-.5-1-1-1" fill="#b2c1c0"/>
<path d="M32 26h-2c-.5 0-1 .5-1 1s.5 1 1 1h2c.5 0 1-.5 1-1s-.5-1-1-1" fill="#f15744"/>
<path d="M33 2v7.4c4 3.2 8-6.9 12-3.7C41 0 37 7.6 33 2z" fill="#b4d7ee"/>
<path d="M32.9 40.3c-.5-.4-1.4-.4-1.9 0c-2.1 1.5-9 5.7-9 5.7v2h20v-2s-6.9-4.2-9.1-5.7" fill="#f15744"/>
<path d="M63 60H1c-.6 0-1 .5-1 1v2c0 .5.4 1 1 1h62c.5 0 1-.5 1-1v-2c0-.5-.5-1-1-1" fill="#666"/>
<path fill="#e8e8e8" d="M20 62h24v2H20z"/>
<path fill="#d0d0d0" d="M22 60h20v2H22z"/>
<g fill="#666">
<path d="M29.1 53.5h1.4v.7h-1.4z"/>
<path d="M33.5 53.5h1.4v.7h-1.4z"/>
</g>
`;

// -------------------------------------------------------------
// 2. OFFICIAL SCHOOL BUS SVG PATHS (Provided by User)
// -------------------------------------------------------------
export const BUS_SVG_PATHS = `
<g id="XMLID_1377_">
	<path id="XMLID_1394_" fill="#6C6559" d="M460,231.396V295c0,11.046-8.954,20-20,20h-80H20c-11.046,0-20-8.954-20-20V125 c0-11.046,8.954-20,20-20h320c11.046,0,20,8.954,20,20h20v-5c0-2.761,2.239-5,5-5h10c2.761,0,5,2.239,5,5v30c0,2.761-2.239,5-5,5 h-10c-2.761,0-5-2.239-5-5v-15h-20v51.802c0,4.767,3.365,8.871,8.039,9.806l75.883,15.177C453.271,213.654,460,221.862,460,231.396 z"/>
	<path id="XMLID_1393_" fill="#454748" d="M395,155h-10c-2.761,0-5-2.239-5-5v-30c0-2.761,2.239-5,5-5h10 c2.761,0,5,2.239,5,5v30C400,152.761,397.761,155,395,155z"/>
	<path id="XMLID_1392_" fill="#E5B352" d="M460,225.903V285h-13.832c-3.744,0-7.262-1.626-9.834-4.346 C427.22,271.015,414.313,265,400,265c-20.501,0-38.111,12.344-45.828,30H175.828c-7.717-17.656-25.326-30-45.828-30 s-38.111,12.344-45.828,30H0V118.3c0-7.345,5.955-13.3,13.3-13.3h333.4c7.345,0,13.3,5.955,13.3,13.3v68.502 c0,4.767,3.365,8.871,8.039,9.806l81.269,16.254C455.525,214.105,460,219.564,460,225.903z"/>
	<path id="XMLID_1389_" fill="#454748" d="M170,315c0,22.091-17.909,40-40,40s-40-17.909-40-40s17.909-40,40-40 S170,292.909,170,315z M400,275c-22.091,0-40,17.909-40,40s17.909,40,40,40s40-17.909,40-40S422.091,275,400,275z"/>
	<path id="XMLID_1388_" fill="#A6A293" d="M150,315c0,11.046-8.954,20-20,20s-20-8.954-20-20s8.954-20,20-20 S150,303.954,150,315z M400,295c-11.046,0-20,8.954-20,20s8.954,20,20,20s20-8.954,20-20S411.046,295,400,295z"/>
	<path id="XMLID_1387_" fill="#454748" d="M120,195H30c-5.523,0-10-4.477-10-10v-40c0-5.523,4.477-10,10-10h90 c5.523,0,10,4.477,10,10v40C130,190.523,125.523,195,120,195z M250,185v-40c0-5.523-4.477-10-10-10h-90c-5.523,0-10,4.477-10,10v40 c0,5.523,4.477,10,10,10h90C245.523,195,250,190.523,250,185z"/>
	<path id="XMLID_1386_" fill="#555859" d="M115,185H35c-2.761,0-5-2.239-5-5v-30c0-2.761,2.239-5,5-5h80c2.761,0,5,2.239,5,5 v30C120,182.761,117.761,185,115,185z M240,180v-30c0-2.761-2.239-5-5-5h-80c-2.761,0-5,2.239-5,5v30c0,2.761,2.239,5,5,5h80 C237.761,185,240,182.761,240,180z"/>
	<path id="XMLID_1384_" fill="#454748" d="M250,227v6c0,1.105-0.895,2-2,2H0v-10h248C249.105,225,250,225.895,250,227z M248,245H0v10h248c1.105,0,2-0.895,2-2v-6C250,245.895,249.105,245,248,245z"/>
	<path id="XMLID_1382_" fill="#CE7341" d="M430,245L430,245c0-5.523,4.477-10,10-10h20v20h-20 C434.477,255,430,250.523,430,245z"/>
	<path id="XMLID_1381_" fill="#454748" d="M280,135h50c5.523,0,10,4.477,10,10v170h-70V145C270,139.477,274.477,135,280,135z"/>
	<path id="XMLID_1378_" fill="#555859" d="M300,145v170h-20V150c0-2.761,2.239-5,5-5H300z M325,145h-15v170h20V150 C330,147.239,327.761,145,325,145z"/>
</g>
`;

export interface MarkerIconResult {
    url: string;
    scaledSize: any;
    anchor: any;
}

// -------------------------------------------------------------
// 3. SCHOOL MARKER: Pure School Building SVG with Floating Name Badge ABOVE
// -------------------------------------------------------------
/**
 * Creates an authentic school landmark marker with:
 * - The pure, clean school building SVG (no enclosing background box)
 * - An elegant floating name badge positioned cleanly ABOVE the building
// -------------------------------------------------------------
// 3. SCHOOL MARKER: Pure School Building SVG with Clean White Floating Name Tag ABOVE
// -------------------------------------------------------------
/**
 * Creates an authentic school landmark marker with:
 * - The pure, clean school building SVG (no enclosing background box)
 * - A clean, permanent WHITE floating name badge positioned cleanly ABOVE the building
 * - Shows the FULL school name without truncation
 * - Consistent, elegant neutral styling without blue or dark hover jumps
 * - Optional parked buses count indicator badge (e.g. 🚌 3)
 */
export const createSchoolMarkerSvg = (
    schoolName: string = 'المدرسة',
    isSelected: boolean = false,
    isHovered: boolean = false,
    isRtl: boolean = true,
    parkedBusesCount: number = 0
): MarkerIconResult => {
    // Show FULL school name without any truncation
    const cleanName = (schoolName || (isRtl ? 'المدرسة' : 'School')).trim();

    // School icon size (pure vector landmark)
    const iconW = 46;
    const iconH = 46;

    // Floating tag dimensions ABOVE the school
    const tagH = 24;
    // Calculate generous text width for Arabic/English
    const textW = Math.ceil(cleanName.length * 8.5);
    const busBadgeW = parkedBusesCount > 0 ? 38 : 0;
    const tagW = Math.max(textW + busBadgeW + 36, 110);

    const width = Math.max(tagW + 24, 160);
    const midX = width / 2;
    const pointerH = 4;
    const gap = 3;
    const height = tagH + pointerH + gap + iconH + 6;

    const tagX = midX - tagW / 2;
    const tagY = 2;
    const buildingY = tagY + tagH + pointerH + gap;
    const buildingX = midX - iconW / 2;

    // Unified Clean White Styling (No blue, no dark shifts)
    const strokeColor = '#cbd5e1';
    const tagBg = '#ffffff';
    const textColor = '#0f172a';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <filter id="schDropShadow" x="-25%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#090d16" flood-opacity="0.25"/>
                </filter>
                <filter id="bldgShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.28"/>
                </filter>
            </defs>

            <!-- 1. PERMANENT WHITE FLOATING NAME BADGE (ABOVE THE SCHOOL ICON) -->
            <g filter="url(#schDropShadow)">
                <!-- Pill Body -->
                <rect x="${tagX}" y="${tagY}" width="${tagW}" height="${tagH}" rx="${tagH / 2}" 
                      fill="${tagBg}" stroke="${strokeColor}" stroke-width="1.2" />

                <!-- Downward Pointer to School Top -->
                <polygon points="${midX - 4},${tagY + tagH} ${midX + 4},${tagY + tagH} ${midX},${tagY + tagH + pointerH}" 
                         fill="${tagBg}" stroke="${strokeColor}" stroke-width="0.8" />
                <!-- Cover seam line -->
                <line x1="${midX - 3.5}" y1="${tagY + tagH}" x2="${midX + 3.5}" y2="${tagY + tagH}" stroke="${tagBg}" stroke-width="1.5" />

                <!-- Badge Content: Landmark Dot + Full School Name + Optional Bus Counter -->
                <g transform="translate(${tagX}, ${tagY + tagH / 2})">
                    <!-- Amber Landmark Dot -->
                    <circle cx="${isRtl ? tagW - 12 : 12}" cy="0" r="3" fill="#f59e0b" />

                    <!-- Full School Name Text (No clipping, completely visible) -->
                    <text x="${isRtl ? (parkedBusesCount > 0 ? tagW - 20 - busBadgeW : tagW - 20) : 22}" 
                          y="4" 
                          fill="${textColor}" 
                          font-size="11.5" 
                          font-weight="800" 
                          font-family="system-ui, -apple-system, sans-serif" 
                          text-anchor="${isRtl ? 'end' : 'start'}">
                        ${cleanName}
                    </text>

                    ${parkedBusesCount > 0 ? `
                        <!-- Parked Buses Live Indicator Tag -->
                        <g transform="translate(${isRtl ? 10 : tagW - busBadgeW - 8}, -7)">
                            <rect x="0" y="0" width="32" height="14" rx="7" fill="#fef3c7" stroke="#f59e0b" stroke-width="0.8"/>
                            <text x="16" y="10" fill="#92400e" font-size="8.5" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">
                                🚌${parkedBusesCount}
                            </text>
                        </g>
                    ` : ''}
                </g>
            </g>

            <!-- 2. PURE AUTHENTIC SCHOOL BUILDING SVG (NO ENCLOSING BOX / NO BG) -->
            <!-- Soft ground contact shadow under doorstep -->
            <ellipse cx="${midX}" cy="${height - 3}" rx="20" ry="3" fill="#0f172a" opacity="0.25" />

            <!-- Authentic School SVG Paths rendered cleanly -->
            <g transform="translate(${buildingX}, ${buildingY})" filter="url(#bldgShadow)">
                <svg width="${iconW}" height="${iconH}" viewBox="0 0 64 64">
                    ${SCHOOL_SVG_PATHS}
                </svg>
            </g>
        </svg>
    `;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(width, height) : { width, height } as any,
        anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(midX, height - 3) : { x: midX, y: height - 3 } as any,
    };
};

// -------------------------------------------------------------
// 4. BUS MARKER: Pure Yellow School Bus SVG with Clean White Floating Label ABOVE
// -------------------------------------------------------------
/**
 * Creates an authentic school bus marker with:
 * - Pure yellow school bus SVG directly on the road (no enclosing box / no card background)
 * - Clean, permanent WHITE floating label ABOVE the bus roof
 * - Full bus name in Arabic (باص 12) or English (Bus 12) with generous width so it never exits the box
 * - Live status dot positioned BESIDE the text on the same horizontal line (never above the text)
 * - Unified white palette (no weird colors, no blue)
 */
export const createBusMarkerSvg = (
    bus: any,
    isSelected: boolean = false,
    isHovered: boolean = false,
    isRtl: boolean = true
): MarkerIconResult => {
    const isMoving = Boolean(bus.is_moving || (bus.speed_kmh && bus.speed_kmh >= 3.0));

    // Bus vehicle dimensions (enlarged for greater clarity and visibility on the map)
    const baseW = 75;
    const baseH = 42;
    const scale = isSelected ? 1.15 : 1.0;
    const busW = Math.round(baseW * scale);
    const busH = Math.round(baseH * scale);

    // Format full bus label
    const busNum = bus.bus_number 
        ? (isRtl ? `باص ${bus.bus_number}` : `Bus ${bus.bus_number}`) 
        : (isRtl ? 'باص' : 'Bus');

    // Floating tag dimensions ABOVE the bus
    const tagH = 23;
    // Generous width calculation so text NEVER exits the box in Arabic or English
    const textW = Math.ceil(busNum.length * 9.5);
    const tagW = Math.max(textW + 38, 90);

    const width = Math.max(tagW + 28, busW + 24, 130);
    const midX = width / 2;
    const pointerH = 4;
    const gap = 3;
    const height = tagH + pointerH + gap + busH + 6;

    const tagX = midX - tagW / 2;
    const tagY = 2;
    const busY = tagY + tagH + pointerH + gap;
    const busX = midX - busW / 2;

    // Status dot color (green if moving, neutral slate if stopped)
    const statusDotColor = isMoving ? '#10b981' : '#94a3b8';
    
    // Always clean white pill with neutral border
    const tagBg = '#ffffff';
    const tagBorderColor = isMoving ? '#a7f3d0' : '#cbd5e1';
    const tagTextColor = '#0f172a';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <filter id="busDropShadow" x="-25%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="1.8" stdDeviation="2" flood-color="#090d16" flood-opacity="0.25"/>
                </filter>
                <filter id="vehShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="1.8" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.32"/>
                </filter>
            </defs>

            <!-- 1. PERMANENT WHITE FLOATING LABEL (ABOVE THE BUS) -->
            <g filter="url(#busDropShadow)">
                <!-- Pill Container -->
                <rect x="${tagX}" y="${tagY}" width="${tagW}" height="${tagH}" rx="${tagH / 2}" 
                      fill="${tagBg}" stroke="${tagBorderColor}" stroke-width="${isSelected ? '1.8' : '1.2'}" />

                <!-- Downward Arrow to Bus Roof -->
                <polygon points="${midX - 3.5},${tagY + tagH} ${midX + 3.5},${tagY + tagH} ${midX},${tagY + tagH + pointerH}" 
                         fill="${tagBg}" stroke="${tagBorderColor}" stroke-width="0.8" />
                <!-- Seam cover line -->
                <line x1="${midX - 3}" y1="${tagY + tagH}" x2="${midX + 3}" y2="${tagY + tagH}" stroke="${tagBg}" stroke-width="1.5" />

                <!-- Tag Content: Dot BESIDE text on the same horizontal line -->
                <g transform="translate(${tagX}, ${tagY + tagH / 2})">
                    <!-- Status Dot (Beside Text) -->
                    <circle cx="${isRtl ? tagW - 12 : 12}" cy="0" r="3.2" fill="${statusDotColor}" />

                    <!-- Bus Name Text (Fits completely within box without exiting) -->
                    <text x="${isRtl ? tagW - 21 : 21}" 
                          y="4" 
                          fill="${tagTextColor}" 
                          font-size="11" 
                          font-weight="800" 
                          font-family="system-ui, -apple-system, sans-serif" 
                          text-anchor="${isRtl ? 'end' : 'start'}">
                        ${busNum}
                    </text>
                </g>
            </g>

            <!-- 2. PURE AUTHENTIC YELLOW SCHOOL BUS SVG (NO ENCLOSING BOX / NO BG) -->
            <!-- Soft ground road wheel shadow -->
            <ellipse cx="${midX}" cy="${height - 3}" rx="${Math.round(busW * 0.48)}" ry="2.6" fill="#0f172a" opacity="0.32" />

            <!-- Yellow Bus SVG Paths directly rendered on the road -->
            <g transform="translate(${busX}, ${busY})" filter="url(#vehShadow)">
                <svg width="${busW}" height="${busH}" viewBox="0 0 460 460">
                    ${BUS_SVG_PATHS}
                </svg>
            </g>
        </svg>
    `;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(width, height) : { width, height } as any,
        anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(midX, height - 3) : { x: midX, y: height - 3 } as any,
    };
};

// -------------------------------------------------------------
// 5. STUDENT STOP MARKER: School Pupil Silhouette with Backpack & Uniform
// -------------------------------------------------------------
/**
 * Creates an authentic, clean, expressive student stop marker:
 * - Option 1: School pupil silhouette with V-collar school uniform and backpack straps
 * - Top loop for school bag, clean head and torso
 * - High-contrast white circular badge on a teardrop pin
 * - Dynamic attendance status colors (Emerald = boarded/present, Sky = dropped, Rose = absent, Amber = late, Indigo = scheduled)
 * - Numbered stop sequence badge (#1, #2, #3...)
 */
export const createStudentMarkerSvg = (
    status: string,
    stopNumber: number,
    isSelected: boolean = false
): MarkerIconResult => {
    let pinColor = '#4f46e5'; // Default Indigo (Scheduled / Waiting)
    let ringColor = '#818cf8';

    if (status === 'present' || status === 'boarded') {
        pinColor = '#059669'; // Emerald (Boarded / Present)
        ringColor = '#34d399';
    } else if (status === 'dropped') {
        pinColor = '#0284c7'; // Sky (Dropped Off)
        ringColor = '#38bdf8';
    } else if (status === 'absent') {
        pinColor = '#e11d48'; // Rose (Absent)
        ringColor = '#fb7185';
    } else if (status === 'late') {
        pinColor = '#d97706'; // Amber (Late / Waiting)
        ringColor = '#fbbf24';
    }

    const width = 48;
    const height = 60;

    // Dynamic width for stop number badge (#1 vs #12)
    const numStr = `#${stopNumber}`;
    const badgeW = numStr.length > 2 ? 24 : 20;
    const badgeX = 26 + badgeW / 2;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <filter id="stuShadow" x="-25%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#090d16" flood-opacity="0.38"/>
                </filter>
            </defs>

            <!-- Soft Ground Road Shadow -->
            <ellipse cx="24" cy="57" rx="9" ry="2.2" fill="#0f172a" opacity="0.32" />

            <g filter="url(#stuShadow)">
                <!-- Teardrop Pin Body pointing to pickup coordinates -->
                <path d="M24 56 C24 56 43 36 43 23 C43 12.5 34.5 4 24 4 C13.5 4 5 12.5 5 23 C5 36 24 56 24 56 Z" 
                      fill="${pinColor}" 
                      stroke="${isSelected ? '#ffffff' : '#ffffff'}" 
                      stroke-width="${isSelected ? '2.8' : '2'}" />
                
                <!-- Inner White Circular Disk for Maximum Contrast -->
                <circle cx="24" cy="23" r="14.5" fill="#ffffff" />
                
                <!-- Pupil Silhouette with Backpack Straps & School Uniform (Option 1) -->
                <g fill="${pinColor}">
                    <!-- Backpack Top Loop behind neck -->
                    <path d="M21.5 12.5 C21.5 10.5 26.5 10.5 26.5 12.5" stroke="${pinColor}" stroke-width="1.5" fill="none" stroke-linecap="round" />
                    
                    <!-- Head -->
                    <circle cx="24" cy="16" r="4.2" />
                    
                    <!-- Torso / School Uniform -->
                    <path d="M15.5 29 C15.5 23.5 19 22 24 22 C29 22 32.5 23.5 32.5 29 C32.5 30 31.5 30.5 24 30.5 C16.5 30.5 15.5 30 15.5 29 Z" />
                    
                    <!-- School Uniform V-Collar -->
                    <polygon points="24,25.5 21.5,22 26.5,22" fill="#ffffff" />
                    
                    <!-- Backpack Straps over shoulders -->
                    <rect x="17.2" y="23" width="1.8" height="6.5" rx="0.9" fill="#ffffff" opacity="0.95" />
                    <rect x="29" y="23" width="1.8" height="6.5" rx="0.9" fill="#ffffff" opacity="0.95" />
                </g>
            </g>
            
            <!-- Stop Order Badge Pill (#1, #2...) -->
            <g filter="url(#stuShadow)">
                <rect x="26" y="2" width="${badgeW}" height="15" rx="7.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.5" />
                <text x="${badgeX}" y="12.5" fill="#ffffff" font-size="9" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">
                    ${numStr}
                </text>
            </g>
        </svg>
    `;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(width, height) : { width, height } as any,
        anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(24, 56) : { x: 24, y: 56 } as any,
    };
};
