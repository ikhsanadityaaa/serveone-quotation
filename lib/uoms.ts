import type {Uom} from './types';

// Source: UOM STANDART.xlsx, sheet "Order Unit", Character + Standard Unit.
const rows=[['EA','EACH'],['UT','UNIT'],['PC','PIECES'],['DZ','DOZEN'],['PR','PAIR'],['BON','BON'],['UM','MICROMETER'],['MM','MILIMETER'],['CM','CENTIMETRE'],['DM','DECIMETERS'],['M','METER'],['KM','KILOMETER'],['FT','FEET'],['YD','YARD'],['UG','MICROGRAM'],['MG','MILIGRAM'],['G','GRAM'],['KG','KILOGRAM'],['TON','TON'],['LB','POUND'],['OZ','OUNCE'],['UL','MICROLITER'],['ML','MILILITER'],['L','LITTER'],['GAL','GALLON'],['BBR','BARREL'],['M3','Cubic Meter'],['M2','Square Meter'],['SH','SHEET'],['SAI','SAI'],['BD','BUNDLE'],['BAG','BAG'],['BK','BULK'],['BOX','BOX'],['CR','CARTON'],['CT','CASSETTE'],['PK','PACK'],['CS','CASE'],['KIT','KIT'],['SET','SET'],['RM','REAM'],['VOL','VOLUME'],['CAN','CAN'],['BT','BOTTLE'],['DR','DRUM'],['PL','PAIL'],['ROL','ROLL']] as const;

export const STANDARD_UOMS:Uom[]=rows.map(([code,name])=>({id:code,code,name,active:true}));
