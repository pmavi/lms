import logger from './logger';

export default function convertUnitTypes(typeFrom, typeTo, value) {
   let result = value;
   switch (`${typeFrom}->${typeTo}`) {
      case 'Gallons->AcreInches':
         result = value / 27154.28599076099;
         break;
      case 'Gallons->AcreFeet':
         result = value / 325851.4318891248;
         break;
      case 'AcreInches->Gallons':
         result = value * 27154.28599076099;
         break;
      case 'AcreInches->AcreFeet':
         result = value / 12;
         break;
      case 'AcreFeet->Gallons':
         result = value * 325851.4318891248;
         break;
      case 'AcreFeet->AcreInches':
         result = value * 12;
         break;
      default:
         if (typeFrom !== typeTo) {
            logger.error(
               `There is no supported conversion from ${typeFrom} to ${typeTo}`,
            );
         }
   }
   return result;
}
