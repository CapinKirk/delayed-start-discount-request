export type Region = 'GLOBAL' | 'AMER' | 'EMEA' | 'APAC';

export const tzGroups: Array<{ region: Region; zones: string[] }> = [
  { region: 'GLOBAL', zones: ['UTC'] },
  { region: 'AMER', zones: [
    'America/New_York','America/Chicago','America/Denver','America/Phoenix','America/Los_Angeles','America/Anchorage','America/Adak',
    'America/Sao_Paulo','America/Mexico_City','America/Bogota','America/Lima','America/Toronto','America/Vancouver'
  ] },
  { region: 'EMEA', zones: [
    'Europe/London','Europe/Dublin','Europe/Lisbon','Europe/Madrid','Europe/Paris','Europe/Brussels','Europe/Berlin','Europe/Amsterdam','Europe/Rome','Europe/Vienna','Europe/Prague','Europe/Warsaw','Europe/Athens','Europe/Bucharest','Europe/Helsinki','Europe/Stockholm','Europe/Zurich','Africa/Johannesburg'
  ] },
  { region: 'APAC', zones: [
    'Asia/Tokyo','Asia/Seoul','Asia/Singapore','Asia/Hong_Kong','Asia/Taipei','Asia/Shanghai','Asia/Kolkata','Asia/Bangkok','Asia/Jakarta','Asia/Manila','Asia/Kuala_Lumpur',
    'Australia/Perth','Australia/Adelaide','Australia/Darwin','Australia/Brisbane','Australia/Sydney','Australia/Melbourne','Pacific/Auckland'
  ] },
];


