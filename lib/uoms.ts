import type {Uom} from './types';

// Fixed UOM catalogue from the supplied workbook: UOM STANDART2.xlsx, sheet "Order Unit".
// UOM is intentionally code-defined (not editable in Supabase / Database page).
const rows=[
 ['EA','EACH'],['UT','UNIT'],['PC','PIECES'],['DZ','DOZEN'],['PR','PAIR'],['BON','BON'],
 ['UM','MICROMETER'],['MM','MILIMETER'],['CM','CENTIMETRE'],['DM','DECIMETERS'],['M','METER'],
 ['KM','KILOMETER'],['FT','FEET'],['YD','YARD'],['UG','MICROGRAM'],['MG','MILIGRAM'],['G','GRAM'],
 ['KG','KILOGRAM'],['TON','TON'],['LB','POUND'],['OZ','OUNCE'],['UL','MICROLITER'],['ML','MILLILITER'],
 ['L','LITTER'],['GAL','GALLON'],['BBR','BARREL'],['M3','Cubic Meter'],['M2','Square Meter'],['SH','SHEET'],
 ['SAI','SAI'],['BD','BUNDLE'],['BAG','BAG'],['BK','BULK'],['BOX','BOX'],['CR','CARTON'],['CT','CASSETTE'],
 ['PK','PACK'],['CS','CASE'],['KIT','KIT'],['SET','SET'],['RM','REAM'],['VOL','VOLUME'],['CAN','CAN'],
 ['BT','BOTTLE'],['DR','DRUM'],['PL','PAIL'],['ROL','ROLL']
] as const;

export const STANDARD_UOMS:Uom[]=rows.map(([code,name])=>({id:code,code,name,active:true}));

export function formatUomLabel(uom:Pick<Uom,'code'|'name'>){
 const name=String(uom.name||'').trim();
 if(!name)return uom.code;
 const pretty=name.toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());
 return `${uom.code} (${pretty})`;
}
