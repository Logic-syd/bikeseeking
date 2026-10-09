/** Original vector artwork. All shapes are local, with no external assets or brands. */
type BikeArtProps = {
  color: string;
  cargo?: boolean;
  vertical?: boolean;
  className?: string;
};

export function BikeArt({ color, cargo = false, vertical = false, className }: BikeArtProps) {
  const length = cargo ? 300 : 200;
  const front = cargo ? 259 : 161;
  const handle = cargo ? 239 : 143;
  return (
    <svg
      className={className}
      viewBox={vertical ? `0 0 90 ${length}` : `0 0 ${length} 90`}
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={vertical ? 'translate(90 0) rotate(90)' : undefined}>
        {/* A quiet offset silhouette adds depth without expensive SVG filters. */}
        <g transform="translate(1 3)" opacity=".13" fill="#263D36">
          <rect x="16" y="38" width="50" height="17" rx="8" />
          <rect x={front - 18} y="38" width="46" height="17" rx="8" />
          <rect x="54" y="34" width={front - 46} height="24" rx="10" />
        </g>
        {/* Thin tires are seen directly from above; both point along the allowed axis. */}
        <rect x="16" y="38" width="50" height="14" rx="7" fill="#2E3935" />
        <path d="M24 41H57M24 49H57" stroke="#68766D" strokeWidth="1.5" strokeLinecap="round" />
        <rect x={front - 18} y="38" width="46" height="14" rx="7" fill="#2E3935" />
        <path d={`M${front - 11} 41H${front + 19}M${front - 11} 49H${front + 19}`} stroke="#68766D" strokeWidth="1.5" strokeLinecap="round" />
        {/* Back rack, two frame stays, crank, and fork. */}
        <path d="M36 45L74 33L108 45L75 57Z" fill={color} stroke="#35443B" strokeWidth="3" strokeLinejoin="round" />
        <path d="M40 45H65M63 38V52" stroke="#F7F3E5" strokeWidth="3" strokeLinecap="round" />
        <path d={`M102 45H${front}M${front - 21} 35L${front + 1} 45L${front - 21} 55`} stroke="#35443B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M102 45H${front - 5}`} stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M102 24V65" stroke="#36443B" strokeWidth="4" strokeLinecap="round" />
        <rect x="92" y="20" width="18" height="7" rx="2.5" fill="#34453B" />
        <rect x="96" y="63" width="18" height="7" rx="2.5" fill="#34453B" />
        <circle cx="102" cy="45" r="8" fill={color} stroke="#34453B" strokeWidth="3" />
        <circle cx="102" cy="45" r="2.5" fill="#F8F4E9" />
        {/* The wide rear saddle tapers forward, visibly different from the handlebars. */}
        <path d="M68 31C65 31 63 34 63 39V51C63 56 65 59 68 59L85 52C90 50 90 40 85 38Z" fill="#344239" stroke="#26382F" strokeWidth="2.5" />
        <path d="M69 35L82 40" stroke="#708176" strokeWidth="2" strokeLinecap="round" />
        {cargo && (
          <g>
            <path d="M126 27Q126 21 134 21H213Q221 21 221 29V62Q221 69 213 69H134Q126 69 126 62Z" fill="#34443A" />
            <rect x="130" y="23" width="87" height="42" rx="6" fill={color} stroke="#34443A" strokeWidth="2" />
            <rect x="136" y="28" width="75" height="32" rx="3" fill="#F4D8B3" stroke="#AA8062" strokeWidth="2" />
            <path d="M140 36H207M140 45H207M140 54H207M153 28V60M194 28V60" stroke="#C39F77" strokeWidth="1.5" />
            <path d="M169 30H184V58H169Z" fill="#FFF8E9" opacity=".75" />
            <path d="M171 40L175 36L181 42M171 49L177 43L182 47" stroke="#BC9270" strokeWidth="1.7" strokeLinecap="round" />
          </g>
        )}
        {/* Upright bars and bright headlamp mark the front of each bicycle. */}
        <path d={`M${handle + 2} 45L${handle - 3} 22Q${handle - 3} 18 ${handle + 2} 18H${handle + 12}M${handle + 2} 45L${handle - 3} 68Q${handle - 3} 72 ${handle + 2} 72H${handle + 12}`} stroke="#34443A" strokeWidth="5" strokeLinecap="round" />
        <path d={`M${handle + 4} 18H${handle + 14}M${handle + 4} 72H${handle + 14}`} stroke="#FCF7E9" strokeWidth="5" strokeLinecap="round" />
        <path d={`M${handle + 4} 18H${handle + 14}M${handle + 4} 72H${handle + 14}`} stroke="#34443A" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={front - 3} cy="45" r="5" fill="#FFF5BE" stroke="#34443A" strokeWidth="2" />
        <rect x="26" y="40" width="4" height="10" rx="1.5" fill="#EE8A81" />
      </g>
    </svg>
  );
}

export function BikeLogo() {
  return (
    <svg viewBox="0 0 44 36" fill="none" aria-hidden="true" focusable="false">
      <circle cx="10" cy="25" r="8" stroke="currentColor" strokeWidth="2.7" />
      <circle cx="34" cy="25" r="8" stroke="currentColor" strokeWidth="2.7" />
      <path d="M10 25L17 12L24 25H10L15 16H30L34 25M30 16L27 7H33M13 11H21" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TreeArt() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" aria-hidden="true" focusable="false">
      <rect x="16" y="18" width="68" height="68" rx="16" fill="#BAAD93" opacity=".4" />
      <rect x="16" y="14" width="68" height="68" rx="16" fill="#D4CBAD" stroke="#B0A687" strokeWidth="2" />
      <rect x="23" y="21" width="54" height="54" rx="11" fill="#A19370" />
      <path d="M48 68L52 37" stroke="#725D45" strokeWidth="8" strokeLinecap="round" />
      <path d="M45 26C30 14 16 32 24 44C11 60 27 76 43 70C54 81 73 71 73 60C91 48 77 25 65 29C60 16 50 18 45 26Z" fill="#679B70" stroke="#517B58" strokeWidth="2" />
      <path d="M40 28C28 27 24 39 30 45C22 54 28 64 39 63C50 73 68 61 67 53C78 46 71 32 61 35C57 22 47 23 40 28Z" fill="#90B88A" />
      <path d="M42 32C35 31 30 41 36 46M48 54C57 58 64 51 61 44" stroke="#C1D4A3" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function BollardArt() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" aria-hidden="true" focusable="false">
      <circle cx="52" cy="56" r="22" fill="#555D51" opacity=".12" />
      <circle cx="50" cy="50" r="25" fill="#D9D0BA" stroke="#B3A992" strokeWidth="2" />
      <circle cx="50" cy="50" r="17" fill="#34463C" />
      <circle cx="50" cy="47" r="13" fill="#617268" stroke="#34463C" strokeWidth="2" />
      <circle cx="50" cy="46" r="7" fill="#F3EAD6" />
      <path d="M42 40Q47 35 55 39" stroke="#A2AEA2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StreetBike({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="35" cy="46" rx="45" ry="5" fill="#506E55" opacity=".1" stroke="none" />
      <circle cx="11" cy="28" r="16" fill="#FBF7EC" stroke="#34483C" strokeWidth="3" />
      <circle cx="62" cy="28" r="16" fill="#FBF7EC" stroke="#34483C" strokeWidth="3" />
      <path d="M11 28L26 4L39 28H11L22 10H53L62 28M53 10L48 -3H57" stroke={color} strokeWidth="4" />
      <path d="M21 3H31M48 -3H57" stroke="#34483C" strokeWidth="4" />
      <path d="M39 28L43 34H49" stroke="#34483C" strokeWidth="2" />
      <circle cx="39" cy="28" r="3" fill="#34483C" stroke="none" />
    </g>
  );
}

export function StationScene({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 900 330" fill="none" aria-hidden="true" focusable="false">
      {/* A fictional little Munich neighbourhood, with nothing inside the play grid. */}
      <ellipse cx="454" cy="274" rx="425" ry="49" fill="#E6DDC8" />
      <path d="M70 282H833M129 299H768M113 266H809" stroke="#D4CBB5" strokeWidth="2" strokeDasharray="28 12" />
      <path d="M140 248L121 309M274 248L264 318M418 245L418 322M562 245L571 318M704 248L720 308" stroke="#D4CBB5" strokeWidth="2" />
      <path d="M79 169H827" stroke="#DDDBC5" strokeWidth="3" strokeLinecap="round" />
      {/* Distant gabled homes keep the station part of a walkable street. */}
      <path d="M268 177V108L315 70L359 108V182" fill="#E5E7D2" />
      <path d="M267 110L315 70L362 110" stroke="#C9D0B8" strokeWidth="5" strokeLinejoin="round" />
      <path d="M295 112H309V133H295ZM326 112H340V133H326Z" fill="#BACFC0" />
      <path d="M738 187V119L778 85L819 119V207" fill="#F0DBC9" />
      <path d="M736 120L778 84L822 120" stroke="#DCC0A8" strokeWidth="5" strokeLinejoin="round" />
      <path d="M760 130H773V151H760ZM788 130H801V151H788Z" fill="#C3D4C3" />
      {/* Mint station entrance. */}
      <path d="M364 243V106Q364 98 374 98H702Q712 98 712 106V243Z" fill="#E6EADB" stroke="#7D9983" strokeWidth="2" />
      <path d="M353 93L382 64H692L726 93V104H353Z" fill="#547B62" />
      <path d="M381 66H690" stroke="#779982" strokeWidth="4" strokeLinecap="round" />
      <path d="M374 106H703" stroke="#C3D2BB" strokeWidth="4" />
      <rect x="389" y="118" width="298" height="42" rx="5" fill="#F8F4E8" stroke="#ADC0A5" strokeWidth="2" />
      <text x="538" y="145" textAnchor="middle" fill="#3C5D48" fontSize="19" fontWeight="750" letterSpacing="4" fontFamily="Arial, sans-serif">ROSENVIERTEL</text>
      <path d="M399 242V182Q399 173 408 173H467Q476 173 476 182V242" fill="#708D7A" />
      <path d="M489 242V182Q489 173 498 173H578Q587 173 587 182V242" fill="#344F42" />
      <path d="M600 242V182Q600 173 609 173H668Q677 173 677 182V242" fill="#708D7A" />
      <path d="M437 175V240M637 175V240M402 208H473M602 208H674" stroke="#D3DCC7" strokeWidth="5" />
      <path d="M410 182L422 182L405 203M610 182H627L605 205" fill="#A7BDAA" />
      <path d="M508 183H567M510 193H565M509 203H563" stroke="#456452" strokeWidth="4" />
      <path d="M516 222H559M510 230H566M502 238H573" stroke="#8EAA8D" strokeWidth="3" />
      <rect x="353" y="241" width="370" height="9" rx="3" fill="#B8C5AB" />
      <rect x="364" y="249" width="347" height="5" rx="2" fill="#CBD3BE" />
      <circle cx="538" cy="85" r="14" fill="#F6F0DF" stroke="#344F42" strokeWidth="3" />
      <path d="M538 76V85L545 89" stroke="#344F42" strokeWidth="2" strokeLinecap="round" />
      {/* A small pink bakery, with a hand-painted sign and striped canvas. */}
      <path d="M104 249V118Q104 110 112 110H268Q276 110 276 118V249Z" fill="#E8B8AF" stroke="#BA8E84" strokeWidth="2" />
      <path d="M94 105L115 75H264L286 105V116H94Z" fill="#C68479" />
      <path d="M117 78H260" stroke="#E4A092" strokeWidth="3" strokeLinecap="round" />
      <rect x="118" y="127" width="144" height="33" rx="4" fill="#FFF5E5" />
      <text x="190" y="149" textAnchor="middle" fill="#80564D" fontSize="17" fontWeight="700" letterSpacing="3" fontFamily="Arial, sans-serif">BACKSTUBE</text>
      <rect x="120" y="187" width="78" height="62" rx="3" fill="#55766B" stroke="#FFF3E0" strokeWidth="5" />
      <rect x="214" y="184" width="46" height="65" rx="3" fill="#77938A" stroke="#FFF3E0" strokeWidth="5" />
      <path d="M159 190V241M123 223H195" stroke="#D8DAC7" strokeWidth="3" />
      <path d="M128 217C129 207 134 204 141 207L146 217ZM153 217C151 205 159 201 166 207L171 217ZM178 217C177 205 185 201 190 210L192 217Z" fill="#E9BC7D" />
      <path d="M129 213L136 208M158 211L164 206M182 210L187 207" stroke="#B88652" strokeWidth="2" />
      <circle cx="249" cy="221" r="2" fill="#F3E3BB" />
      <path d="M108 168H270L282 190H96Z" fill="#FFF3E3" stroke="#B78378" strokeWidth="2" />
      <path d="M121 168H137L132 190H114ZM153 168H169L167 190H149ZM185 168H201L202 190H183ZM217 168H233L237 190H219ZM249 168H269L281 190H261Z" fill="#D99288" />
      <path d="M97 190V196Q105 204 114 196Q123 204 132 196Q140 204 149 196Q158 204 167 196Q175 204 183 196Q193 204 202 196Q210 204 219 196Q228 204 237 196Q249 204 261 196Q271 204 281 196V190Z" fill="#E6AA9D" />
      <path d="M116 250H269" stroke="#B58D7F" strokeWidth="5" strokeLinecap="round" />
      {/* Street trees and planted stone beds frame the scene. */}
      <ellipse cx="64" cy="263" rx="31" ry="13" fill="#BFC8A5" stroke="#A5B490" strokeWidth="2" />
      <path d="M65 253V137M65 195L48 178M66 180L82 157" stroke="#8B7960" strokeWidth="9" strokeLinecap="round" />
      <path d="M40 112C19 116 15 140 29 151C9 170 28 194 46 189C60 208 85 196 91 184C112 181 120 156 103 145C112 120 84 102 69 112C58 101 46 103 40 112Z" fill="#85A97D" />
      <path d="M43 115C27 121 25 137 38 145C21 162 34 181 51 176C67 191 86 179 89 169C108 158 96 138 86 135C85 113 63 110 54 121" fill="#A6C295" />
      <path d="M39 145C37 134 43 126 53 126M57 167C69 172 81 163 79 154" stroke="#D1DFB5" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="813" cy="274" rx="38" ry="14" fill="#BFC8A5" stroke="#A5B490" strokeWidth="2" />
      <path d="M815 261V138M815 218L797 197M815 191L837 174" stroke="#8B7960" strokeWidth="10" strokeLinecap="round" />
      <path d="M798 110C774 99 754 125 766 144C744 158 752 188 774 193C777 214 810 220 821 205C840 220 864 204 864 186C891 169 873 139 855 142C862 121 837 103 822 114C818 105 808 103 798 110Z" fill="#719868" />
      <path d="M797 115C778 111 766 131 779 144C759 158 769 181 788 181C790 201 816 201 824 188C843 201 859 181 853 166C870 151 854 139 842 145C845 123 824 117 812 128" fill="#96B885" />
      <path d="M785 142C780 134 786 124 796 125M806 173C816 180 830 173 829 162" stroke="#C0D3A0" strokeWidth="5" strokeLinecap="round" />
      {/* Public bicycle parking belongs to this fictional neighbourhood. */}
      <path d="M324 165V257" stroke="#678173" strokeWidth="5" />
      <rect x="303" y="133" width="42" height="42" rx="7" fill="#587D78" stroke="#F3F3E5" strokeWidth="3" />
      <text x="324" y="163" textAnchor="middle" fill="#FBF7E8" fontSize="29" fontWeight="700" fontFamily="Arial, sans-serif">P</text>
      <path d="M312 236V227Q312 212 326 212Q340 212 340 227V250M374 261V242Q374 227 388 227Q402 227 402 242V265M729 270V250Q729 235 743 235Q757 235 757 250V274" stroke="#9FAE9B" strokeWidth="5" />
      <StreetBike x={292} y={230} color="#BC7B71" scale={0.72} />
      <StreetBike x={356} y={246} color="#657F9C" scale={0.72} />
      <StreetBike x={702} y={254} color="#B79455" scale={0.72} />
      <path d="M467 276H490M477 273V280M615 286H637M625 282V289" stroke="#A4B298" strokeWidth="2" strokeLinecap="round" />
      <path d="M114 45Q125 36 137 45M743 51Q750 43 759 51" stroke="#C6CBAF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="343" cy="43" r="4" fill="#E5C2A2" />
      <circle cx="773" cy="58" r="3" fill="#D6DCBA" />
    </svg>
  );
}
